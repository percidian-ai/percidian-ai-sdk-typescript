// Checks that a webhook came from Percept.
//
// Percept signs every webhook as Standard Webhooks does: `webhook-id`, `webhook-timestamp` (Unix seconds) and
// `webhook-signature`, a space-separated list of `v1,<base64 HMAC-SHA256 of "<id>.<timestamp>.<body>">`, keyed by the base64
// after `whsec_` in the secret. During a secret's rotation a delivery carries a signature for each of the two secrets, so
// either one verifies. Uses Web Crypto: Node 20 or later, Deno, Bun, Cloudflare Workers and browsers.

const TOLERANCE_SECONDS = 5 * 60;

/** The webhook is not signed by this secret, its headers are missing, or its timestamp is more than 5 minutes off. */
export class WebhookVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WebhookVerificationError";
    }
}

export type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

/**
 * Verifies a webhook and returns its body, parsed.
 *
 * @param secret The endpoint's `whsec_` secret, or the organization's for a request's `webhook_url`
 *   (`client.webhooks.getSecret()`).
 * @param headers The request's headers: a `Headers`, or an object such as Node's `req.headers`.
 * @param body The raw body exactly as received (text, or bytes), never re-serialized JSON.
 * @throws WebhookVerificationError if it does not verify.
 */
export async function verifyWebhook(
    secret: string,
    headers: WebhookHeaders,
    body: string | Uint8Array,
    options: { now?: Date } = {},
): Promise<unknown> {
    const id = header(headers, "webhook-id");
    const timestamp = header(headers, "webhook-timestamp");
    const signatures = header(headers, "webhook-signature");
    if (!id || !timestamp || !signatures) {
        throw new WebhookVerificationError("missing webhook-id, webhook-timestamp or webhook-signature header");
    }
    if (!/^\d+$/.test(timestamp)) {
        throw new WebhookVerificationError("webhook-timestamp is not Unix seconds");
    }
    if (Math.abs((options.now ?? new Date()).getTime() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) {
        throw new WebhookVerificationError("webhook-timestamp is more than 5 minutes off");
    }
    let key: CryptoKey;
    try {
        key = await crypto.subtle.importKey(
            "raw",
            fromBase64(secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"],
        );
    } catch {
        throw new WebhookVerificationError("the secret is not a whsec_ secret");
    }
    const text = typeof body === "string" ? body : new TextDecoder().decode(body);
    const signed = new TextEncoder().encode(`${id}.${timestamp}.${text}`);
    for (const signature of signatures.split(" ")) {
        const [version, value] = signature.split(",", 2);
        const bytes = version === "v1" && value ? decoded(value) : undefined;
        // verify compares in constant time.
        if (bytes && (await crypto.subtle.verify("HMAC", key, bytes, signed))) {
            return JSON.parse(text);
        }
    }
    throw new WebhookVerificationError("no signature matches this secret");
}

function header(headers: WebhookHeaders, name: string): string | undefined {
    if (headers instanceof Headers) {
        return headers.get(name) ?? undefined;
    }
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === name) {
            return Array.isArray(value) ? value[0] : value;
        }
    }
    return undefined;
}

function fromBase64(value: string) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function decoded(value: string) {
    try {
        return fromBase64(value);
    } catch {
        return undefined;
    }
}
