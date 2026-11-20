import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertCronAuthorized,
  extractBearerToken,
  safeTokenEqual,
} from "@/lib/jobs/cron-auth";

function cronRequest(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/jobs/expire-holds", { headers });
}

test("extractBearerToken chỉ nhận scheme Bearer", () => {
  assert.equal(extractBearerToken("Bearer abc123"), "abc123");
  assert.equal(extractBearerToken("  bearer   abc123  "), "abc123");
  assert.equal(extractBearerToken("Basic abc123"), null);
  assert.equal(extractBearerToken("Bearer"), null);
  assert.equal(extractBearerToken("Bearer a b"), null);
  assert.equal(extractBearerToken(null), null);
  assert.equal(extractBearerToken(""), null);
});

test("safeTokenEqual so sánh đúng, khác độ dài luôn false", () => {
  assert.equal(safeTokenEqual("secret", "secret"), true);
  assert.equal(safeTokenEqual("secret", "secreT"), false);
  assert.equal(safeTokenEqual("secret", "secret-long"), false);
});

test("assertCronAuthorized: 503 khi thiếu CRON_SECRET, 401 khi sai, im lặng khi đúng", () => {
  assert.throws(
    () => assertCronAuthorized(cronRequest("Bearer abc"), undefined),
    (error: { code?: string; status?: number }) =>
      error.code === "CRON_DISABLED" && error.status === 503,
  );

  assert.throws(
    () => assertCronAuthorized(cronRequest("Bearer wrong"), "abc"),
    (error: { code?: string; status?: number }) =>
      error.code === "CRON_UNAUTHORIZED" && error.status === 401,
  );

  assert.throws(
    () => assertCronAuthorized(cronRequest(), "abc"),
    (error: { code?: string; status?: number }) => error.status === 401,
  );

  assert.doesNotThrow(() => assertCronAuthorized(cronRequest("Bearer abc"), "abc"));
});
