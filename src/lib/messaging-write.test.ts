import assert from "node:assert/strict";
import test from "node:test";
import { trustedMessagingOrigin } from "./messaging-write";

// Amplify hands route handlers an internal request.url (localhost), so the
// check must compare against the public origin, not request.url.
const internal = "http://localhost:3000/api/messages/new";
const req = (headers: Record<string, string>) => new Request(internal, { method: "POST", headers });

test("same-site write from the public origin is accepted behind Amplify", () => {
  assert.equal(trustedMessagingOrigin(req({ origin: "https://eccp.empowrcic.org", "sec-fetch-site": "same-origin" })), true);
});

test("cross-site, missing and null origins are rejected", () => {
  assert.equal(trustedMessagingOrigin(req({ origin: "https://evil.example" })), false);
  assert.equal(trustedMessagingOrigin(req({ origin: "https://eccp.empowrcic.org", "sec-fetch-site": "cross-site" })), false);
  assert.equal(trustedMessagingOrigin(req({})), false);
  assert.equal(trustedMessagingOrigin(req({ origin: "null" })), false);
  assert.equal(trustedMessagingOrigin(req({ origin: "http://localhost:3000" })), false);
});
