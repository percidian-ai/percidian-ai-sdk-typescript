# Reference
<details><summary><code>client.<a href="/src/Client.ts">extract</a>({ ...params }) -> PercidianApi.ExtractResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Runs an extraction job on text and waits for it: the answer is the graph (200), or the job if it is still running after the wait (202). Every node, property and edge in the graph cites the text that states it, each quote checked against the text you sent.

**Input.** A JSON body (`ExtractText`) with exactly one of `text` or `pages`. A page is its text (`{text}`) or the blocks of your own OCR with their boxes (`{blocks: [{text, box}]}`), which give its citations the page and a box. `model` is required: `percept-1` or `percept-1-flash`. Optional: `ontology_id` (by default the built-in `core@1.2.0`), `webhook_url`, `metadata`, and `format` (with `table` for `csv`), the shape of the result. Neither model takes `instructions` or `cache` (400 `instructions_not_supported`, `cache_not_supported`). A document may be as long as the model's limit, in estimated tokens (see Limits); a longer one is 400 `document_too_long`. Percept One runs no OCR: a file upload (multipart) is refused with 415 `files_not_supported`.

**Waiting.** The request waits for its job, up to 280 seconds, and answers as `GET /v1/jobs/{job_id}/result` would: 200 with the result, or the failed job's 409 `job_failed`. A job still running then is answered 202 with the job, `Location` and `Retry-After: 5`, and runs on: fetch its result later, or take its webhook. A long document can take longer than the wait. `Prefer: wait=N` (RFC 7240) waits at most N seconds instead (with a `webhook_url` too, whose event still comes when the job ends). `Prefer: respond-async`, or a `webhook_url` without `wait`, answers 202 at once (`respond-async, wait=N`: after up to N seconds). Set your client's timeout above the wait, such as 330 seconds. The wait holds no slot beyond the job's own.

**Format.** The result's shape is chosen with the request, like a response format, and never after it: `format` is `json` (the default), `neo4j`, `jsonld`, or `csv` with `table` (`nodes` or `edges`). The job keeps it (its `format` and `table`), and the 200 and `GET /v1/jobs/{job_id}/result` answer in that shape only. A `format` or `table` in the URL's query is 400 `format_invalid`.

**Idempotency.** With `Idempotency-Key`, a retry never runs or bills twice: the same key and the same request within 25 hours answer with the first job, whatever its status (`Idempotent-Replayed: true`), and wait as the first request did. The same key with another request is 409 `idempotency_key_reused`. A request refused before it became a job leaves the key free; a failed job keeps it, so send a new key to try again.

**Limits.** The request counts one request a minute against the organization's limits and holds one slot of work in flight until its job ends, or at once if it does not become one. At a limit it is 429 `rate_limited`, with `error.limit` and `Retry-After`, and nothing is read or stored; with the credit used up it is 402 `insufficient_credit` (`budget_exceeded` at a monthly budget). While Percept's capacity is short it is 503 `overloaded`, before any limit is counted. The job's billed tokens count against the tokens a minute when it ends. The body is checked against `Content-Length` before it is read: at most 8 MiB of JSON, boxes included, and 4 MiB of text.

**Billing.** The result's `usage` is what the job is billed (see Pricing). A failed job is free.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.extract({
    text: "Maya Chen is the Chief Executive Officer of Northstar Labs Inc., which is headquartered in Boston.",
    model: "percept-1",
    metadata: {
        "source_id": "memo-0142"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.ExtractRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PercidianClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.<a href="/src/Client.ts">fill</a>({ ...params }) -> PercidianApi.FieldsResult</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Answers the fields you name from a document's text, each value checked against the text and cited where it is written. A field the document does not state, or whose answer cannot be checked, is `null` (a list or a table: no items). The result is a `FieldsResult`.

**Input.** A JSON body (`FillText`) with exactly one of `text` or `pages`, and `fields`: up to 50 by name, each `text`, `number`, `date`, a `list` of one of these, or a `table` of named columns, with its own `instructions` if you like. Optional: `webhook_url` and `metadata`. It takes no `ontology_id`, `instructions` or `cache` (400 `fields_conflict`). A file upload is refused with 415 `files_not_supported`.

**Waiting.** The request waits for its job, up to 280 seconds, and answers as `GET /v1/jobs/{job_id}/result` would: 200 with the result, or the failed job's 409 `job_failed`. A job still running then is answered 202 with the job, `Location` and `Retry-After: 5`, and runs on: fetch its result later, or take its webhook. `Prefer: wait=N` (RFC 7240) waits at most N seconds instead (with a `webhook_url` too, whose event still comes when the job ends). `Prefer: respond-async`, or a `webhook_url` without `wait`, answers 202 at once (`respond-async, wait=N`: after up to N seconds). Set your client's timeout above the wait, such as 330 seconds. The wait holds no slot beyond the job's own.

**Idempotency.** With `Idempotency-Key`, a retry never runs or bills twice: the same key and the same request within 25 hours answer with the first job, whatever its status (`Idempotent-Replayed: true`), and wait as the first request did. The same key with another request is 409 `idempotency_key_reused`. A request refused before it became a job leaves the key free; a failed job keeps it, so send a new key to try again.

**Limits.** The request counts one request a minute against the organization's limits and holds one slot of work in flight until its job ends, or at once if it does not become one. At a limit it is 429 `rate_limited`, with `error.limit` and `Retry-After`, and nothing is read or stored; with the credit used up it is 402 `insufficient_credit` (`budget_exceeded` at a monthly budget). While Percept's capacity is short it is 503 `overloaded`, before any limit is counted. The job's billed tokens count against the tokens a minute when it ends. The body is checked against `Content-Length` before it is read: at most 8 MiB of JSON, boxes included, and 4 MiB of text.

**Billing.** As `POST /v1/extract`: the result's `usage`, and a failed job is free.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.fill({
    text: "Invoice INV-2026-0142\nBill to: Bluefin Robotics LLC\nDue date: 30 November 2026\n\nItem | Qty | Amount\nSensor array | 4 | 8,000.00\nCalibration service | 1 | 4,500.00\n\nTotal due: $12,500.00",
    fields: {
        "invoice_number": {
            type: "text"
        },
        "customer": {
            type: "text",
            instructions: "The party the invoice is billed to."
        },
        "due_date": {
            type: "date"
        },
        "total": {
            type: "number",
            instructions: "The total amount due."
        },
        "line_items": {
            type: "table",
            columns: {
                "item": {
                    type: "text"
                },
                "quantity": {
                    type: "number"
                },
                "amount": {
                    type: "number"
                }
            }
        },
        "purchase_order": {
            type: "text"
        }
    },
    metadata: {
        "source_id": "inv-2026-0142"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.FillText` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PercidianClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.<a href="/src/Client.ts">match</a>({ ...params }) -> PercidianApi.MatchResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Scores each candidate against the existing nodes you send with it: whether each pair is the `same` entity, a `different` one, or `uncertain`, with a probability and a reason. Percept does not store or search your graph: you choose the nodes to compare, and your application decides what to link or merge.

**Input.** JSON (`MatchRequest`): 1 to 50 proposals, each a `candidate` and 1 to 25 `existing` nodes. A node is sent whole (`MatchNode`: its `type`, `label` and source context, from your own store) or as `{"typed_id"}` from one of your own extraction results, which Percept reads from that job for 1 hour after it ends. `ontology_id` names the ontology the types are from (by default `core@1.2.0`). The body is read as JSON whatever its `Content-Type`, and is at most 8 MiB.

**Outcome.** The model scores every existing node. `same` needs a probability of at least 0.75 and no `veto`. A pair whose nodes carry the same kind of identifier with different values, once normalized, is `different`, with a `veto` naming the identifier, whatever its probability: check `veto` before you merge.

**Idempotency.** With `Idempotency-Key`, the same key and the same request within 25 hours answer 200 with the first answer, its body and `usage` (`Idempotent-Replayed: true`), without a model call, a slot or a second bill. The same key with another request is 409 `idempotency_key_reused`; while the first request with the key still runs, 409 `idempotency_key_in_use`. A match that is not answered (any error) gives its key back. Without a key, a retried match runs and bills again.

**Limits.** A match counts one request a minute and holds one slot of work in flight while it runs (429 `rate_limited`, 402 `insufficient_credit`). While Percept's capacity is short, or the model is still busy, it is 503 `overloaded`, and 503 `model_unavailable` when the model did not answer; both carry `Retry-After`. Its `usage.input_tokens` count against the tokens a minute when it is answered. A replayed key passes no limit and takes no slot.

**Billing and data.** A match is billed on `usage.input_tokens` only, at the match input price; its output is free. Percept keeps none of its content beyond its usage, except its answer for 25 hours when the request sends an `Idempotency-Key`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.match({
    proposals: [{
            id: "northstar",
            candidate: {
                type: "core.organization",
                label: "Northstar Labs Inc.",
                context: ["Maya Chen is the Chief Executive Officer of Northstar Labs Inc., which is headquartered in Boston."]
            },
            existing: [{
                    id: "crm-1042",
                    type: "core.organization",
                    label: "Northstar Laboratories",
                    context: ["Northstar Laboratories, a Boston robotics company led by Maya Chen."]
                }, {
                    id: "crm-2210",
                    type: "core.organization",
                    label: "Northstar Logistics",
                    properties: {
                        "lei": "549300NSLOGX00000042"
                    },
                    context: ["Northstar Logistics operates freight warehouses in Ohio."]
                }]
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.MatchBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PercidianClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Jobs
<details><summary><code>client.jobs.<a href="/src/api/resources/jobs/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;PercidianApi.JobListItem, PercidianApi.JobList&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's jobs until their `expires_at`, newest first, a page at a time. A deleted job is not listed. Each job's `metadata` is listed whether Prompt history is on or off. Pass `next_cursor` as `cursor`, with the same filters, for the next page; it is `null` on the last page.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.jobs.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.jobs.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.ListJobsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `JobsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.jobs.<a href="/src/api/resources/jobs/client/Client.ts">get</a>({ ...params }) -> PercidianApi.Job</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

A job's status, until its `expires_at` (then 404 `job_not_found`). Its `metadata` is shown whether Prompt history is on or off. After a 202, poll it (5 seconds apart to start with, longer for long jobs) until `status` is `succeeded`, then fetch `GET /v1/jobs/{job_id}/result`; or `failed`, when `error` says why and its `class` whether sending the request again can succeed. `usage` is what the job is billed once it has ended. You can also skip this and fetch the result directly: it answers 409 `result_not_ready` while the job runs.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.jobs.get({
    job_id: "job_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetJobsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `JobsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.jobs.<a href="/src/api/resources/jobs/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Stops the job if it is running, and deletes its text, everything made from it and its result at once. Later requests for it are 404 `job_not_found`, and a webhook not delivered yet is not sent. The usage record (tokens and times, no content) is kept for billing.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.jobs.delete({
    job_id: "job_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.DeleteJobsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `JobsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.jobs.<a href="/src/api/resources/jobs/client/Client.ts">getResult</a>({ ...params }) -> PercidianApi.GetResultJobsResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

A succeeded job's result: the graph of a `POST /v1/extract` job (`Result`), or the fields of a `POST /v1/fill` job (`FieldsResult`). While the job is queued or running the answer is 409 `result_not_ready` (transient, with `Retry-After: 5`); a failed job's is 409 `job_failed`. A result can be fetched until its job's `expires_at`, with Prompt history on or off (410 `result_gone` if it is no longer stored).

**Shapes.** The result comes in the shape its request chose with `format` (`POST /v1/extract`), a shape to load into your own graph database, and in no other: the job's `format` and `table` name it, and a `format` or `table` in this URL's query is 400 `format_invalid`. Each shape has every node and edge of the graph and nothing else of the result (`unresolved`, `usage`, `metadata` and `details` are in the default JSON only; the job's `usage` is on `GET /v1/jobs/{job_id}`). Every shape is billed the same. A fill job's fields and a batch's results have the default only.

- `json` (the default): `Result`.
- `neo4j`: `Neo4jGraph`, the `Neo4jGraph` of the neo4j-graphrag Python package, which its `Neo4jWriter` writes as it is (`Neo4jGraph.model_validate(body)`), though it creates every node and relationship again on each write. To load a result again, or many results into one graph, MERGE each node on its `id` (or on its label and `name_key`, one node per name) and each relationship on its `id` property.
- `jsonld`: JSON-LD 1.1 (`application/ld+json`). `@vocab` is the ontology (`https://api.percidian.ai/v1/ontologies/{ontology_id}#`, or `https://api.percidian.ai/ns/core@1.2.0#`), so a node's `@type`, its properties and each predicate are the ontology's own names (a name with a colon, or named `percept`, `prov`, `rdf` or `rdfs`, is its full IRI: `@vocab` and the name). Percept's own terms are `percept:` (`https://api.percidian.ai/ns/percept#`): `percept:name_key`, `percept:aliases`, `percept:typed_id`, `percept:confidence`, `percept:extracted_by`; the label is `rdfs:label`. Each edge is a triple on its source node (to the target node or the literal value) and also an `rdf:Statement` (`rdf:subject`, `rdf:predicate`, `rdf:object`) with its qualifiers, dates, confidence and citations. Citations are PROV-O provenance: `prov:wasDerivedFrom` a `percept:Citation` with `percept:quote`, `percept:start`, `percept:end`, `percept:page`, `percept:bbox` and `percept:unit`. Ids are relative to the result's URL: `#node-{id}` and `#edge-{id}`, percent-encoded. A value that is not text, a number, a boolean or a list of these is a JSON literal (`@json`).
- `csv` with `table` `nodes` or `edges`: that one table (`text/csv`, RFC 4180: a header row, CRLF line ends, a cell with a comma, a quote or a line break in double quotes, a quote doubled). Nodes: `id`, `typed_id`, `type`, `label`, `name_key`, `confidence`, `extracted_by`, `properties` (the extracted values as a JSON object), `citations` (JSON), `aliases` (JSON). Edges: `id`, `predicate`, `source`, `target` (empty for a literal), `value`, `qualifiers` (JSON), `effective_at`, `valid_from`, `valid_until`, `confidence`, `extracted_by`, `citations` (JSON). Text cells are the text as extracted, others JSON, null empty. A cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return is prefixed with `'` so a spreadsheet reads it as text, not as a formula (OWASP's CSV injection guidance); a plain number such as `-5` is left as it is.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.jobs.getResult({
    job_id: "job_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetResultJobsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `JobsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.jobs.<a href="/src/api/resources/jobs/client/Client.ts">getInput</a>({ ...params }) -> PercidianApi.JobInput</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

The request a job was sent with, as your organization's Prompt history keeps it until the job's `expires_at`: its `text` or `pages`, `ontology_id`, `instructions` or `fields`, and `metadata`. A job sent with Prompt history off has none here (404 `input_not_kept`): its input was held only to deliver its result and for caching, up to 25 hours, then deleted; its `metadata` is still on the job (`GET /v1/jobs/{job_id}`).
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.jobs.getInput({
    job_id: "job_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetInputJobsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `JobsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Batches
<details><summary><code>client.batches.<a href="/src/api/resources/batches/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;PercidianApi.Batch, PercidianApi.BatchList&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's batches, newest first, a page at a time. A batch is listed for its 24-hour window, then as long as its results are kept: 7 days more with Prompt history on, 25 hours with it off. Pass `next_cursor` as `cursor` for the next page; it is `null` on the last page.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.batches.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.batches.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.ListBatchesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BatchesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.batches.<a href="/src/api/resources/batches/client/Client.ts">create</a>({ ...params }) -> PercidianApi.Batch</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Starts a batch: up to 10,000 requests to one endpoint, run in the background within 24 hours (extraction at the price of single requests, matching at half). It answers 202 at once.

**Body.** JSON Lines (`application/jsonl` or `application/x-ndjson`), one `BatchRequest` a line:

```
{"custom_id": "memo-0142", "method": "POST", "url": "/v1/extract", "body": {"model": "percept-1", "text": "..."}}
```

- `endpoint`, in the query, is the batch's endpoint: `/v1/extract` (the default) or `/v1/match`. Every line's `url` must be it: send extractions and matches as separate batches. A line without `method` and `url` is a `/v1/extract` line.
- `custom_id` is your name for the request: 1 to 64 letters, digits, `_` or `-`, once per batch. Match results to requests by it, not by their order.
- `body` is what the endpoint takes: an `ExtractText` body without `webhook_url` (the batch's is in the query), or a `MatchRequest`.
- At most 10,000 lines and 256 MiB, and a line at most twice the text limit plus 64 KiB.

The whole batch is checked before anything is kept: a line `POST /v1/extract` would refuse refuses the batch with that line's status and code, its message naming the line. A match line is checked for its size and `ontology_id` here, and the rest when it runs: a body `POST /v1/match` would refuse fails its request (`match_invalid`).

**Running.** Each extraction line is a job of its own, which `GET /v1/jobs` lists and `DELETE /v1/jobs/{job_id}` cancels; a match line has no job. Identical lines run once, and each of their `custom_id`s gets the result. A request the model is too busy to take waits, and runs again once there is capacity, within the batch's 24 hours; one the model keeps refusing for hours fails (`transient`). A request that fails transiently for another reason is tried again, up to 3 times in all. A request not ended 24 hours after the batch was created expires. A batch's jobs run in the room your own jobs and matches leave under your in-flight limit, within a share of capacity all organizations' batches split fairly, so a batch never holds back your synchronous calls.

**Limits and billing.** A batch counts one request a minute, and its lines count against your batch queue until it ends (429 `rate_limited`, `error.limit` `batch_queue`; a batch larger than the whole queue is refused without `Retry-After`: split it). Its tokens never count against your tokens a minute. Only succeeded requests are billed: an extraction at the price of the same request sent alone, a match at half; failed, expired and canceled ones are free.

**Results.** Poll `GET /v1/batches/{batch_id}`, or pass `webhook_url` for one `BatchWebhookEvent` when the batch ends. Fetch `GET /v1/batches/{batch_id}/results` as the results come: each line is kept 7 days after it is written with your organization's Prompt history on when the batch was created, 25 hours with it off.

**Idempotency.** The same `Idempotency-Key` and the same batch (its endpoint, its lines in order and `webhook_url`) within 25 hours answer 202 with the first batch, whatever its status (`Idempotent-Replayed: true`); the same key with another batch is 409 `idempotency_key_reused`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.batches.create({
    body: "{\"custom_id\": \"memo-0142\", \"method\": \"POST\", \"url\": \"/v1/extract\", \"body\": {\"model\": \"percept-1\", \"text\": \"Maya Chen is the Chief Executive Officer of Northstar Labs Inc., which is headquartered in Boston.\"}}\n{\"custom_id\": \"memo-0143\", \"method\": \"POST\", \"url\": \"/v1/extract\", \"body\": {\"model\": \"percept-1-flash\", \"text\": \"Northstar Labs acquired Bluefin Robotics LLC in March 2026.\", \"metadata\": {\"source_id\": \"memo-0143\"}}}\n"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.CreateBatchesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BatchesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.batches.<a href="/src/api/resources/batches/client/Client.ts">get</a>({ ...params }) -> PercidianApi.Batch</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

A batch's status, its requests counted by state, and its billed tokens so far. Poll it until `status` is `ended`, or take its webhook; results can be fetched while it runs.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.batches.get({
    batch_id: "batch_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetBatchesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BatchesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.batches.<a href="/src/api/resources/batches/client/Client.ts">cancel</a>({ ...params }) -> PercidianApi.Batch</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Cancels the requests not started yet: they become `canceled`, and are free. Requests already running go on to their end; the batch is `canceling` until they do, then `ended`. The results so far stay. Canceling an ended batch changes nothing.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.batches.cancel({
    batch_id: "batch_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.CancelBatchesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BatchesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.batches.<a href="/src/api/resources/batches/client/Client.ts">getResults</a>({ ...params }) -> string</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

One `BatchResult` a line (JSON Lines) for each request that has ended, in the order they ended; a running batch's results grow as its requests end. Match lines to your requests by `custom_id`. A succeeded request's result is inline: as `GET /v1/jobs/{job_id}/result` gives it, or in a match batch as `POST /v1/match` answers it. The results are kept 25 hours after the batch ends, 7 days with Prompt history on when the batch was created (while it runs, counted from its first results): until the batch's `results_expire_at`, from when the answer is 410 `results_gone`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.batches.getResults({
    batch_id: "batch_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetResultsBatchesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `BatchesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Ontologies
<details><summary><code>client.ontologies.<a href="/src/api/resources/ontologies/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;PercidianApi.OntologySummary, PercidianApi.OntologyList&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's stored ontologies, each version on its own, newest first, a page at a time, and the storage they all use of the allowance: 1,000 ontologies and 100 MiB. Pass `next_cursor` as `cursor` for the next page; it is `null` on the last page.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.ontologies.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.ontologies.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.ListOntologiesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `OntologiesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.ontologies.<a href="/src/api/resources/ontologies/client/Client.ts">create</a>({ ...params }) -> PercidianApi.OntologySummary</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Stores an ontology (`OntologyInput`): its node types with their properties, and its predicates. Its id comes from its content: new content answers 201 with a new id, and the same content again answers 200 with the same id. Name the id as `ontology_id` in `POST /v1/extract`, a batch's lines or `POST /v1/match` to use exactly this version.

**Versions.** To revise an ontology, store the whole new definition with `supersedes` set to the current version's id. The new version names the old in `supersedes`, the old names the new in `superseded_by`, and the old id still selects the old definition. A version can be superseded once (409 `ontology_superseded`: supersede the newer one).

**Limits.** At most 4 MiB, 2,000 node types, 2,000 predicates and 100 properties a type; 1,000 ontologies and 100 MiB per organization, superseded versions included (409 `ontology_storage_full`: delete some first).
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.ontologies.create({
    name: "Company intelligence",
    node_types: [{
            name: "Person",
            description: "A human individual.",
            properties: [{
                    name: "title",
                    type: "string"
                }]
        }, {
            name: "Organization",
            description: "A company or institution.",
            properties: [{
                    name: "website",
                    type: "string"
                }, {
                    name: "sector",
                    type: "enum",
                    values: ["robotics", "logistics", "software"]
                }]
        }],
    predicates: [{
            name: "leads",
            description: "A person leads an organization.",
            source_types: ["Person"],
            target_types: ["Organization"]
        }]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.OntologyInput` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `OntologiesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.ontologies.<a href="/src/api/resources/ontologies/client/Client.ts">get</a>({ ...params }) -> PercidianApi.OntologyDetail</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

One of your ontologies: its summary, and the ontology as stored, with whitespace in descriptions collapsed and absent options left out.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.ontologies.get({
    ontology_id: "ontology_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetOntologiesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `OntologiesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.ontologies.<a href="/src/api/resources/ontologies/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Deletes this version. Jobs already accepted with it can still read it for 25 hours; no new job or match can name it (404 `ontology_not_found`). Deleting the current version makes the one it superseded current again.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.ontologies.delete({
    ontology_id: "ontology_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.DeleteOntologiesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `OntologiesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.ontologies.<a href="/src/api/resources/ontologies/client/Client.ts">listVersions</a>({ ...params }) -> PercidianApi.OntologyVersions</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Oldest first, by the versions' links: `supersedes` back to the oldest, `superseded_by` on to the newest. The newest is current (`current: true`). A deleted version ends the line where it was: deleting the newest makes the one before it current again, and a version that named a deleted one in `supersedes` starts the line.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.ontologies.listVersions({
    ontology_id: "ontology_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.ListVersionsOntologiesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `OntologiesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Limits
<details><summary><code>client.limits.<a href="/src/api/resources/limits/client/Client.ts">get</a>() -> PercidianApi.Limits</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's tier, its limits, what remains of each now, how soon each minute limit is full again, each model's own (`models`), whether its credit is `ok` or `exhausted`, and its prepaid balance. Reading it counts against no limit.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.limits.get();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `LimitsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.limits.<a href="/src/api/resources/limits/client/Client.ts">listTransactions</a>({ ...params }) -> PercidianApi.Transactions</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Every move of your prepaid balance, newest first: a `grant` (credit bought), `usage` (a job, a match, or a batch's match request, at its price when it ends; failed work is free), a `refund` or an `adjust`ment. Amounts are signed integers in micro-USD (1 USD = 1,000,000). Pass the last `id` of a page as `before` for the next page.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.limits.listTransactions();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.ListTransactionsLimitsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `LimitsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Webhooks
<details><summary><code>client.webhooks.<a href="/src/api/resources/webhooks/client/Client.ts">getSecret</a>() -> PercidianApi.GetSecretWebhooksResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

The secret every webhook event of your organization's jobs and batches is signed with: `whsec_` and 32 bytes in base64, which a Standard Webhooks library takes as it is (how to verify an event by hand: Webhooks, above). Any of the organization's API keys reads it, and only its own organization's; it does not change between reads. Not cached (`Cache-Control: no-store`): keep it as you keep an API key.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.getSecret();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `WebhooksClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Usage
<details><summary><code>client.usage.<a href="/src/api/resources/usage/client/Client.ts">get</a>({ ...params }) -> PercidianApi.UsageReport</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's metered tokens, jobs and pages by UTC day or month. Succeeded jobs and answered matches appear after a short delay, usually a minute or two, and a console session's report can be up to a minute older; failed jobs are not metered, and periods without usage are left out. Each period has its billed extraction tokens (`usage`) and a line per purpose and model: `extraction`, its jobs' billed tokens, and `match`, billed on input. Prices, balances and invoices are not here: see `GET /v1/limits/transactions`. Its parameters are `start`, `end` and `group_by` alone, with no paging (`limit`, `cursor`): any other is refused with 400 `field_unknown`. It takes an API key, or a console session of any member of the organization.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.usage.get();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.GetUsageRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `UsageClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Webhooks Endpoints
<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">list</a>() -> PercidianApi.WebhookEndpointList</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's webhook endpoints, oldest first (20 at most), with their state. Never their secrets.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.list();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">create</a>({ ...params }) -> PercidianApi.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Registers an endpoint for the event types you name. Its signing secret is made with it (`GET /v1/webhook_endpoints/{endpoint_id}/secret`). Send it a test (`POST …/test`) to check your receiver before real events arrive.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.create({
    url: "url",
    event_types: ["job.succeeded"]
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.WebhookEndpointInput` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">get</a>({ ...params }) -> PercidianApi.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

One endpoint and its state: `enabled`, why it is disabled (`disabled_reason`: `manual` or `failing`) and since when its attempts have all failed (`failing_since`).
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.get({
    endpoint_id: "endpoint_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.GetEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">update</a>({ ...params }) -> PercidianApi.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Changes the fields you send and leaves the others as they are. `{"enabled": false}` stops deliveries (those not yet sent fail with `endpoint_disabled`); `{"enabled": true}` starts them again and clears a `failing` state.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.update({
    endpoint_id: "endpoint_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.WebhookEndpointUpdate` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Deletes the endpoint and its delivery log. Deliveries in flight stop.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.delete({
    endpoint_id: "endpoint_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.DeleteEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">getSecret</a>({ ...params }) -> PercidianApi.WebhookEndpointSecret</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

The secret this endpoint's events are signed with (`whsec_` and 32 bytes in base64; how to verify: Webhooks, above). It changes only when you rotate it. Not cached (`Cache-Control: no-store`): keep it as you keep an API key. A console session needs the `admin` or `owner` role, or `webhooks:manage`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.getSecret({
    endpoint_id: "endpoint_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.GetSecretEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">rotateSecret</a>({ ...params }) -> PercidianApi.WebhookEndpointSecret</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Makes a new secret and returns it. For 24 hours (until `previous_expires_at`) each event is signed with both, two `v1` entries in `webhook-signature`, so your receiver verifies with either while you deploy the new one; then the old one stops signing. Another rotation is refused until those 24 hours end.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.rotateSecret({
    endpoint_id: "endpoint_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.RotateSecretEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">test</a>({ ...params }) -> PercidianApi.WebhookTest</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

POSTs a test event to the endpoint now, signed as a real one is, whether or not the endpoint is enabled or subscribed to its type, and answers with the request as sent and your endpoint's answer. `type` `webhook.test` (the default) or a sample of an event type, whose ids are all zeros. The test is logged as a delivery (`test: true`) and is never retried. At most 10 tests a minute per organization. A console session needs the `admin` or `owner` role, or `webhooks:manage`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.test({
    endpoint_id: "endpoint_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.TestEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">recover</a>({ ...params }) -> PercidianApi.WebhookRecovery</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Attempts again, once each and in order, every delivery to this endpoint that failed and was created at or after `since` (up to 1,000 a call; `has_more` says to call again). Use it after an outage of your receiver. Each keeps its event's `id`, so a receiver that already took one dedupes it. A console session needs the `admin` or `owner` role, or `webhooks:manage`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.endpoints.recover({
    endpoint_id: "endpoint_id",
    since: "since"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.RecoverEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Webhooks Deliveries
<details><summary><code>client.webhooks.deliveries.<a href="/src/api/resources/webhooks/resources/deliveries/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;PercidianApi.WebhookDelivery, PercidianApi.WebhookDeliveryList&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Your organization's deliveries of the last 30 days, newest first, a page at a time: one per event and endpoint, with its state and its last attempt. Pass `next_cursor` as `cursor`, with the same filters, for the next page; it is `null` on the last page.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.webhooks.deliveries.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.webhooks.deliveries.list();
while (page.hasNextPage()) {
    page = await page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.ListDeliveriesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DeliveriesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.deliveries.<a href="/src/api/resources/webhooks/resources/deliveries/client/Client.ts">get</a>({ ...params }) -> PercidianApi.WebhookDeliveryDetail</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

One delivery, its event as sent, and each attempt, oldest first: when, why (`scheduled`, `manual` or `test`), the request's headers (signatures redacted), your endpoint's status and the first 1,024 bytes of its answer, the time it took and how it failed.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.deliveries.get({
    delivery_id: "delivery_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.GetDeliveriesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DeliveriesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.deliveries.<a href="/src/api/resources/webhooks/resources/deliveries/client/Client.ts">retry</a>({ ...params }) -> PercidianApi.WebhookDelivery</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Attempts the delivery once more, now, with its event as first sent (the same `id`), whether it failed or was delivered. Its outcome is logged as a `manual` attempt; it is not retried on the schedule. A test is not sent again. A console session needs the `admin` or `owner` role, or `webhooks:manage`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.webhooks.deliveries.retry({
    delivery_id: "delivery_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PercidianApi.webhooks.RetryDeliveriesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DeliveriesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

