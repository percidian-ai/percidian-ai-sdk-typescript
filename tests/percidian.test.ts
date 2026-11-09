// extract waiting through a 202, retries keeping their Idempotency-Key, typed errors, and webhook verification against a
// delivery as Percept signs one. No network: a fetch stub answers.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as PercidianApi from "../src/api/index";
import { Percidian } from "../src/wrapper/Percidian";
import { verifyWebhook, WebhookVerificationError } from "../src/wrapper/webhooks";

const sdks = [__dirname, join(__dirname, "..", "..")].find((dir) => existsSync(join(dir, "responses.json"))) as string;
const responses = JSON.parse(readFileSync(join(sdks, "responses.json"), "utf8"));
const webhook = JSON.parse(readFileSync(join(sdks, "webhook-fixture.json"), "utf8"));
const jobId: string = responses.job_accepted.id;
const text = "Ada Lovelace wrote the first published program in 1843.";

/** A fetch giving these answers in turn (one that throws is a network error), and the requests it was sent. */
function answers(...replies: Array<() => Response>): { fetch: typeof fetch; sent: Request[] } {
    const sent: Request[] = [];
    const stub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        sent.push(new Request(input, init));
        const reply = replies.shift();
        if (reply == null) {
            throw new Error("no answer left");
        }
        return reply();
    };
    return { fetch: stub as typeof fetch, sent };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): () => Response {
    return () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

const accepted = json(202, responses.job_accepted, { location: `/v1/jobs/${jobId}`, "retry-after": "5" });

describe("Percidian", () => {
    it("waits through a 202 for the result", async () => {
        const { fetch, sent } = answers(
            accepted,
            json(409, responses.result_not_ready, { "retry-after": "0" }),
            json(200, responses.result),
        );
        const client = new Percidian({ apiKey: "sk_test", fetch, maxRetries: 0 });
        const result = (await client.extract({ model: "percept-1", text })) as PercidianApi.Result;
        expect(result.id).toBe(responses.result.id);
        expect(sent.map((r) => `${r.method} ${new URL(r.url).pathname}`)).toEqual([
            "POST /v1/extract",
            `GET /v1/jobs/${jobId}/result`,
            `GET /v1/jobs/${jobId}/result`,
        ]);
        expect(sent[0].headers.get("authorization")).toBe("Bearer sk_test");
        expect(await sent[0].json()).toEqual({ model: "percept-1", text });
    });

    it("sends an extract again after a network error, with the same Idempotency-Key", async () => {
        const { fetch, sent } = answers(() => {
            throw new TypeError("fetch failed");
        }, json(200, responses.result));
        const client = new Percidian({ apiKey: "sk_test", fetch, maxRetries: 0 });
        await client.extract({ model: "percept-1", text });
        const keys = sent.map((r) => r.headers.get("idempotency-key"));
        expect(keys).toHaveLength(2);
        expect(keys[0]).toBeTruthy();
        expect(keys[1]).toBe(keys[0]);
    });

    it("throws typed errors with the API's error code", async () => {
        const { fetch } = answers(json(429, responses.rate_limited, { "retry-after": "30" }));
        const client = new Percidian({ apiKey: "sk_test", fetch, maxRetries: 0 });
        const error = await client.extract({ model: "percept-1", text }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(PercidianApi.TooManyRequestsError);
        expect((error as PercidianApi.TooManyRequestsError).body.error.code).toBe("rate_limited");
    });

    it("throws a failed job's error while polling", async () => {
        const { fetch } = answers(accepted, json(409, responses.job_failed));
        const client = new Percidian({ apiKey: "sk_test", fetch, maxRetries: 0 });
        const error = await client.extract({ model: "percept-1", text }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(PercidianApi.ConflictError);
        expect((error as PercidianApi.ConflictError).body.error.code).toBe("job_failed");
    });

    it("sends a batch's JSON Lines as they are, on a retry too", async () => {
        // As edge.ts createBatch reads them: application/jsonl, one JSON object a line (not one JSON string: 400 batch_invalid).
        const { fetch, sent } = answers(() => {
            throw new TypeError("fetch failed");
        }, json(202, responses.batch_accepted));
        const client = new Percidian({ apiKey: "sk_test", fetch, maxRetries: 0 });
        const batch = await client.batches.create({ body: responses.batch_requests });
        expect(batch.id).toBe(responses.batch_accepted.id);
        expect(await Promise.all(sent.map(async (r) => [r.headers.get("content-type"), await r.text()]))).toEqual([
            ["application/jsonl", responses.batch_requests],
            ["application/jsonl", responses.batch_requests],
        ]);
    });

    it("returns the job at once with Prefer: respond-async", async () => {
        const { fetch, sent } = answers(accepted);
        const client = new Percidian({ apiKey: "sk_test", fetch, maxRetries: 0 });
        const job = (await client.extract({ model: "percept-1", text, Prefer: "respond-async" })) as unknown;
        expect((job as PercidianApi.JobAccepted).id).toBe(jobId);
        expect(sent).toHaveLength(1);
    });
});

describe("verifyWebhook", () => {
    const sentAt = new Date(Number(webhook.headers["webhook-timestamp"]) * 1000);

    it.each([webhook.secret, webhook.previous_secret])("accepts a delivery signed by either secret", async (secret) => {
        const event = await verifyWebhook(secret, webhook.headers, new TextEncoder().encode(webhook.body), { now: sentAt });
        expect(event).toEqual(JSON.parse(webhook.body));
    });

    it("refuses a changed body, an old timestamp, another secret or a missing signature", async () => {
        const other = `whsec_${btoa(String.fromCharCode(...new Array(32).fill(1)))}`;
        const later = new Date(sentAt.getTime() + 301_000);
        const { "webhook-signature": _, ...unsigned } = webhook.headers;
        for (const [secret, headers, body, now] of [
            [webhook.secret, webhook.headers, webhook.body.replace("succeeded", "failed"), sentAt],
            [webhook.secret, webhook.headers, webhook.body, later],
            [other, webhook.headers, webhook.body, sentAt],
            [webhook.secret, unsigned, webhook.body, sentAt],
        ] as const) {
            await expect(verifyWebhook(secret, headers, body, { now })).rejects.toBeInstanceOf(WebhookVerificationError);
        }
    });
});
