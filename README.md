# percidian

The TypeScript client for Percept One, Percidian's extraction model: send a document's text, get back a typed knowledge
graph, every node, property and edge cited to the text it comes from.

```sh
npm install percidian
```

Node 18 or later (Node 20 or later for `verifyWebhook`), Deno, Bun and Cloudflare Workers.

## Quickstart

Make an API key in the console (console.percidian.ai) and keep it in your server's environment as `PERCIDIAN_API_KEY`;
the client reads it from there (or pass `apiKey`). Never put a key in browser code.

```ts
import { Percidian, PercidianApi } from "percidian";

const client = new Percidian();
const result = (await client.extract({
    model: "percept-1",
    text: "Maya Chen is the CEO of Northstar Labs, based in Boston.",
})) as PercidianApi.Result;
for (const node of result.graph.nodes) {
    console.log(node.type, node.label);
}
```

Where there is no `process` (Workers, browsers), pass `apiKey` from your environment binding.

## Waiting for results

`extract` and `fill` resolve with the job's result however long the job runs. The API holds the request up to 280 seconds
and answers with the job if it is still running; the client then polls `jobs.getResult` until the job ends (pass an
`abortSignal` to stop it). A failed job throws `PercidianApi.ConflictError` with the code `job_failed`. Their requests time
out after 330 seconds at the least.

- `Prefer: "respond-async"` resolves with the job (`PercidianApi.JobAccepted`) at once: fetch its result later with
  `client.jobs.getResult({ job_id })`, or take its webhook.
- `format: "neo4j"` resolves with a `PercidianApi.Neo4JGraph`, `format: "jsonld"` with the JSON-LD, and `format: "csv"`
  (with `table`) with the CSV text.

## Batches

A batch is JSON Lines, one request a line:

```ts
const lines = [
    { custom_id: "memo-1", method: "POST", url: "/v1/extract", body: { model: "percept-1", text: "..." } },
    { custom_id: "memo-2", method: "POST", url: "/v1/extract", body: { model: "percept-1", text: "..." } },
];
const batch = await client.batches.create({ body: lines.map((line) => JSON.stringify(line)).join("\n") });
// Later: one BatchResult a line, matched to your requests by custom_id.
const results = await client.batches.getResults({ batch_id: batch.id });
for (const line of results.split("\n").filter(Boolean)) {
    console.log(JSON.parse(line).custom_id);
}
```

## Errors and retries

Each error status has its class (`PercidianApi.BadRequestError`, `UnauthorizedError`, `PaymentRequiredError`,
`TooManyRequestsError`, `ConflictError`, ...), all `PercidianError`s, and `body.error.code` says what went wrong:

```ts
try {
    await client.extract({ model: "percept-1", text });
} catch (error) {
    if (error instanceof PercidianApi.TooManyRequestsError) {
        console.log(error.body.error.code, error.body.error.limit, error.rawResponse?.headers.get("retry-after"));
    }
}
```

The client retries 408, 429 and 5xx answers twice, waiting as `Retry-After` says (60 seconds at most); set `maxRetries` on
the client or per request. Every `extract`, `fill`, `match` and `batches.create` carries an `Idempotency-Key` (a new UUID
unless you pass `"Idempotency-Key"`), the same on each retry, so a retry never runs or bills twice. A network error is
retried the same way for those, and for requests that only read or delete.

## Webhooks

Percept signs each webhook as [Standard Webhooks](https://www.standardwebhooks.com) does. Check one with the raw body,
exactly as received:

```ts
import { verifyWebhook, WebhookVerificationError } from "percidian";

try {
    const event = await verifyWebhook(secret, request.headers, await request.text());
} catch (error) {
    if (error instanceof WebhookVerificationError) {
        // answer 400
    }
}
```

`secret` is the endpoint's `whsec_` secret (`client.webhooks.endpoints.create` or `getSecret`), or for a request's
`webhook_url` the organization's (`client.webhooks.getSecret()`). A timestamp more than 5 minutes off is refused.

## Reference

Every method is in [reference.md](./reference.md).
