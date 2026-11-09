// Percidian: the API client, with extract and fill that wait for the job's result.

import * as PercidianApi from "../api/index.js";
import { PercidianClient } from "../Client.js";
import * as core from "../core/index.js";
import { isResponseBodyError } from "../core/fetcher/getResponseBody.js";

/** Above the API's 280-second wait. */
const WAIT_TIMEOUT_SECONDS = 330;
/** GET /v1/jobs/{job_id}/result answers 409 result_not_ready, with Retry-After: 5, while the job runs. */
const POLL_SECONDS = 5;
const NETWORK_RETRIES = 2;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "DELETE"]);

export class Percidian extends PercidianClient {
    constructor(options: PercidianClient.Options = {}) {
        super({ ...options, fetch: retryingFetch(options.fetch) });
    }

    public override extract(
        request: PercidianApi.ExtractRequest,
        requestOptions?: PercidianClient.RequestOptions,
    ): core.HttpResponsePromise<PercidianApi.ExtractResponse> {
        return core.HttpResponsePromise.fromPromise(
            this.waited(super.extract(request, this.waitOptions(requestOptions)), request.Prefer, requestOptions),
        );
    }

    public override fill(
        request: PercidianApi.FillText,
        requestOptions?: PercidianClient.RequestOptions,
    ): core.HttpResponsePromise<PercidianApi.FieldsResult> {
        return core.HttpResponsePromise.fromPromise(
            this.waited(super.fill(request, this.waitOptions(requestOptions)), request.Prefer, requestOptions),
        );
    }

    private waitOptions(requestOptions: PercidianClient.RequestOptions | undefined): PercidianClient.RequestOptions {
        const timeoutInSeconds =
            requestOptions?.timeoutInSeconds ?? Math.max(this._options.timeoutInSeconds ?? 0, WAIT_TIMEOUT_SECONDS);
        return { ...requestOptions, timeoutInSeconds };
    }

    private async waited<T>(
        call: core.HttpResponsePromise<T>,
        prefer: string | undefined,
        requestOptions: PercidianClient.RequestOptions | undefined,
    ): Promise<core.WithRawResponse<T>> {
        const answer = await call.withRawResponse();
        if (answer.rawResponse.status !== 202 || prefer?.includes("respond-async")) {
            return asText(answer);
        }
        const job = answer.data as unknown as PercidianApi.JobAccepted;
        for (;;) {
            try {
                const result = await this.jobs
                    .getResult({ job_id: job.id }, { abortSignal: requestOptions?.abortSignal })
                    .withRawResponse();
                return asText(result) as unknown as core.WithRawResponse<T>;
            } catch (error) {
                const seconds = pollAfter(error);
                if (seconds == null) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
            }
        }
    }
}

/** A CSV result, as text. */
function asText<T>(answer: core.WithRawResponse<T>): core.WithRawResponse<T> {
    const body: unknown = answer.data;
    return isResponseBodyError(body) && body.error.reason === "non-json"
        ? { ...answer, data: body.error.rawBody as unknown as T }
        : answer;
}

/** Seconds before asking again while the job runs (409 result_not_ready); undefined for anything else (job_failed). */
function pollAfter(error: unknown): number | undefined {
    if (!(error instanceof PercidianApi.ConflictError) || error.body?.error?.code !== "result_not_ready") {
        return undefined;
    }
    const retryAfter = Number(error.rawResponse?.headers.get("retry-after") ?? Number.NaN);
    return Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : POLL_SECONDS;
}

/** Sends a JSON Lines body (POST /v1/batches) as the caller's text. */
function rawJsonLines(init: RequestInit | undefined): RequestInit | undefined {
    const body = init?.body;
    return typeof body === "string" &&
        body.startsWith('"') &&
        /^application\/(jsonl|x-ndjson)\b/i.test(new Headers(init?.headers).get("content-type") ?? "")
        ? { ...init, body: JSON.parse(body) as string }
        : init;
}

/** fetch, retried after a network error when safe: the request only reads or deletes, or carries an Idempotency-Key. */
function retryingFetch(given: typeof fetch | undefined): typeof fetch {
    return async (input, sent) => {
        const init = rawJsonLines(sent);
        const replayable =
            (SAFE_METHODS.has((init?.method ?? "GET").toUpperCase()) || new Headers(init?.headers).has("idempotency-key")) &&
            !(typeof ReadableStream !== "undefined" && init?.body instanceof ReadableStream);
        for (let attempt = 0; ; attempt++) {
            try {
                return await (given ?? fetch)(input, init);
            } catch (error) {
                if (!replayable || attempt >= NETWORK_RETRIES || init?.signal?.aborted) {
                    throw error;
                }
            }
        }
    };
}
