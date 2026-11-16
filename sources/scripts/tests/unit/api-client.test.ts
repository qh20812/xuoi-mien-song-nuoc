/**
 * T1 · `apiRequest` — lớp HTTP dùng chung cho các adapter gọi API nội bộ.
 *
 * `fetchImpl` được inject nên không cần server thật.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, apiRequest, isApiError } from "@/lib/api/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  return (async (url: string, init?: RequestInit) =>
    handler(url, init)) as unknown as typeof fetch;
}

test("thành công: trả payload và gửi đúng method/body/header", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = stubFetch((url, init) => {
    calls.push({ url, init });
    return jsonResponse({ ok: true, order: { code: "XMSN-2026-0001" } });
  });

  const payload = await apiRequest<{ ok: true; order: { code: string } }>(
    "/api/orders",
    {
      method: "POST",
      body: { departureId: 4 },
      baseUrl: "http://localhost:3000/",
      fetchImpl,
    },
  );

  assert.equal(payload.order.code, "XMSN-2026-0001");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "http://localhost:3000/api/orders");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.equal(calls[0]!.init?.body, JSON.stringify({ departureId: 4 }));
  assert.equal(
    (calls[0]!.init?.headers as Record<string, string>)["content-type"],
    "application/json",
  );
});

test("không có baseUrl thì dùng URL tương đối (browser)", async () => {
  let seen = "";
  const fetchImpl = stubFetch((url) => {
    seen = url;
    return jsonResponse({ ok: true });
  });

  await apiRequest("/api/contact", { method: "POST", body: {}, fetchImpl });

  assert.equal(seen, "/api/contact");
});

test("GET không gửi body và content-type", async () => {
  let init: RequestInit | undefined;
  const fetchImpl = stubFetch((_url, requestInit) => {
    init = requestInit;
    return jsonResponse({ ok: true });
  });

  await apiRequest("/api/x", { fetchImpl });

  assert.equal(init?.body, undefined);
  assert.equal(
    (init?.headers as Record<string, string>)["content-type"],
    undefined,
  );
});

test("ok:false ném ApiError giữ nguyên code/message/details của server", async () => {
  const fetchImpl = stubFetch(() =>
    jsonResponse(
      {
        ok: false,
        error: {
          code: "DEPARTURE_FULL",
          message: "Chuyến này vừa hết chỗ.",
          details: { remaining: 0 },
        },
      },
      409,
    ),
  );

  await assert.rejects(
    () => apiRequest("/api/orders", { fetchImpl }),
    (error: unknown) => {
      assert.ok(isApiError(error));
      assert.equal(error.status, 409);
      assert.equal(error.code, "DEPARTURE_FULL");
      assert.equal(error.message, "Chuyến này vừa hết chỗ.");
      assert.deepEqual(error.details, { remaining: 0 });
      return true;
    },
  );
});

test("HTTP lỗi không có body lỗi vẫn ném ApiError với status thật", async () => {
  const fetchImpl = stubFetch(() => new Response("", { status: 500 }));

  await assert.rejects(
    () => apiRequest("/api/x", { fetchImpl }),
    (error: unknown) => isApiError(error) && error.status === 500,
  );
});

test("body không phải JSON trả INVALID_RESPONSE", async () => {
  const fetchImpl = stubFetch(() => new Response("<html>oops</html>"));

  await assert.rejects(
    () => apiRequest("/api/x", { fetchImpl }),
    (error: unknown) => isApiError(error) && error.code === "INVALID_RESPONSE",
  );
});

test("lỗi mạng trả NETWORK_ERROR với status 0", async () => {
  const fetchImpl = stubFetch(() => {
    throw new TypeError("fetch failed");
  });

  await assert.rejects(
    () => apiRequest("/api/x", { fetchImpl }),
    (error: unknown) =>
      isApiError(error) && error.code === "NETWORK_ERROR" && error.status === 0,
  );
});

test("AbortError được ném lại nguyên vẹn để caller tự xử lý", async () => {
  const abort = new Error("aborted");
  abort.name = "AbortError";
  const fetchImpl = stubFetch(() => {
    throw abort;
  });

  await assert.rejects(
    () => apiRequest("/api/x", { fetchImpl }),
    (error: unknown) => error === abort,
  );
});

test("isApiError phân biệt được lỗi thường", () => {
  assert.equal(isApiError(new ApiError("x")), true);
  assert.equal(isApiError(new Error("x")), false);
  assert.equal(isApiError(null), false);
});
