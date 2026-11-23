import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderComplianceReminder } from "./compliance-reminder-email";

describe("compliance reminder email", () => {
  const item = { requirement: "safeguarding" as const, deadline: "2026-12-01" };
  it("renders deadline and plain-text fallback", () => {
    const result = renderComplianceReminder("Alex Example", [item], "Please complete soon.");
    assert.match(result.text, /Safeguarding: complete by 2026-12-01/);
    assert.match(result.html, /Sign in to ECCP/);
  });
  it("escapes coach name and optional note", () => {
    const result = renderComplianceReminder("<script>alert(1)</script>", [item], "<img src=x>");
    assert.doesNotMatch(result.html, /<script>|<img src=x>/);
    assert.match(result.html, /&lt;img src=x&gt;/);
  });
  it("rejects missing or invalid requirements", () => {
    assert.throws(() => renderComplianceReminder("Alex", [], ""));
    assert.throws(() => renderComplianceReminder("Alex", [{ ...item, deadline: "2026-02-30" }], ""));
  });
  it("enforces optional note length", () => {
    assert.throws(() => renderComplianceReminder("Alex", [item], "x".repeat(501)));
  });
});
