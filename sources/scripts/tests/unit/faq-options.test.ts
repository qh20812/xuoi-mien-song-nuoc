import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FAQ_CATEGORIES,
  FAQ_CATEGORY_LABELS,
  FAQ_PLACEMENT_LABELS,
  normalizeFaqCategory,
} from "@/lib/content/faq-options";

test("normalizeFaqCategory: giữ category hợp lệ, giá trị lạ rơi về general", () => {
  assert.equal(normalizeFaqCategory("booking"), "booking");
  assert.equal(normalizeFaqCategory("weather"), "weather");
  assert.equal(normalizeFaqCategory("khong-hop-le"), "general");
  assert.equal(normalizeFaqCategory(null), "general");
  assert.equal(normalizeFaqCategory(undefined), "general");
});

test("FAQ labels phủ đủ category và placement", () => {
  assert.equal(FAQ_CATEGORIES.length, Object.keys(FAQ_CATEGORY_LABELS).length);
  assert.deepEqual(Object.keys(FAQ_PLACEMENT_LABELS), [
    "home",
    "contact",
    "both",
  ]);
});
