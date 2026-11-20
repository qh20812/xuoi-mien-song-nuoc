import assert from "node:assert/strict";
import { test } from "node:test";
import type { CuisineListingData } from "@/lib/contracts/cuisine";
import { getRelatedCuisines } from "@/lib/cuisines/listing";

function cuisine(
  slug: string,
  province: string,
): CuisineListingData {
  return {
    slug,
    name: slug,
    description: "",
    whereToEat: "",
    province,
    image: null,
    sortOrder: 1,
    provinceSlug: province,
    tourRefs: [],
  };
}

test("getRelatedCuisines: cùng vùng trước, loại chính nó, tôn trọng limit", () => {
  const current = cuisine("lau-mam", "Cà Mau");
  const all = [
    current,
    cuisine("cua-ca-mau", "Cà Mau"),
    cuisine("ba-khia", "Cà Mau"),
    cuisine("banh-xeo", "Cần Thơ"),
    cuisine("bun-nuoc-leo", "Cần Thơ"),
  ];

  assert.deepEqual(
    getRelatedCuisines(current, all).map((item) => item.slug),
    ["cua-ca-mau", "ba-khia", "banh-xeo"],
  );

  assert.deepEqual(
    getRelatedCuisines(current, all, 1).map((item) => item.slug),
    ["cua-ca-mau"],
  );

  assert.deepEqual(getRelatedCuisines(current, all, 0), []);
});
