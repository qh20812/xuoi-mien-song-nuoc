import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  CuisineRow,
  DestinationRow,
  FaqRow,
  PostRow,
} from "@/lib/content/mappers";
import {
  POST_FALLBACK_IMAGE_SRC,
  normalizeFaqPlacement,
  normalizePostTopic,
  toCuisineListingData,
  toDestinationListingData,
  toPostRecord,
  toPublicFaqRecord,
  toStringArray,
} from "@/lib/content/mappers";
import { normalizeDestinationCategory } from "@/lib/destinations/categories";

test("normalizeDestinationCategory: giữ category hợp lệ, giá trị lạ rơi về song-nuoc", () => {
  assert.equal(normalizeDestinationCategory("cho-noi"), "cho-noi");
  assert.equal(normalizeDestinationCategory("rung"), "rung");
  assert.equal(normalizeDestinationCategory("khong-ton-tai"), "song-nuoc");
  assert.equal(normalizeDestinationCategory(null), "song-nuoc");
  assert.equal(normalizeDestinationCategory("bien"), "bien");
});

test("toDestinationListingData: map Decimal/string, nhóm category và tourRefs", () => {
  const row: DestinationRow = {
    slug: "cho-noi-cai-rang",
    name: "Chợ nổi Cái Răng",
    province: "Cần Thơ",
    category: "cho-noi",
    shortDesc: null,
    description: "Mô tả",
    bestSeason: null,
    travelNote: "Đi sớm",
    coverImageUrl: "https://example.com/cho-noi.jpg",
    lat: { toNumber: () => 10.005 },
    lng: "105.746",
    sortOrder: 3,
  };

  const data = toDestinationListingData(row, [
    { code: "XMSN-4N3D", slug: "tour-4n3d", name: "Tour 4N3Đ" },
  ]);

  assert.equal(data.shortDescription, "");
  assert.equal(data.bestSeason, "");
  assert.equal(data.travelNote, "Đi sớm");
  assert.equal(data.image, null, "URL ngoài phải bị chặn");
  assert.equal(data.lat, 10.005);
  assert.equal(data.lng, 105.746);
  assert.equal(data.provinceSlug, "can-tho");
  assert.equal(data.categoryLabel, "Chợ nổi");
  assert.equal(data.categoryGroup, "song-nuoc");
  assert.equal(data.categoryGroupLabel, "Sông nước & chợ nổi");
  assert.equal(data.tourRefs.length, 1);
});

test("toDestinationListingData: ảnh nội bộ được giữ, lat/lng null/NaN thành null", () => {
  const row: DestinationRow = {
    slug: "chua-vinh-trang",
    name: "Chùa Vĩnh Tràng",
    province: "Đồng Tháp",
    category: null,
    shortDesc: "Chùa cổ",
    description: null,
    bestSeason: null,
    travelNote: null,
    coverImageUrl: "/images/chua-vinh-trang.webp",
    lat: null,
    lng: { toNumber: () => Number.NaN },
    sortOrder: 1,
  };

  const data = toDestinationListingData(row, []);

  assert.deepEqual(data.image, {
    src: "/images/chua-vinh-trang.webp",
    alt: "Chùa Vĩnh Tràng",
  });
  assert.equal(data.lat, null);
  assert.equal(data.lng, null);
  assert.equal(data.category, "song-nuoc", "category null rơi về mặc định");
  assert.equal(data.categoryGroup, "song-nuoc");
});

test("toStringArray: chỉ nhận chuỗi, trim và bỏ rỗng; JSON sai kiểu trả []", () => {
  assert.deepEqual(toStringArray([" a ", 2, "b", "", null]), ["a", "b"]);
  assert.deepEqual(toStringArray({ 0: "a" }), []);
  assert.deepEqual(toStringArray("a,b"), []);
  assert.deepEqual(toStringArray(null), []);
});

test("toPostRecord: tags/topic/related/checklist và ảnh fallback", () => {
  const row: PostRow = {
    slug: "bai-viet",
    title: "Bài viết",
    excerpt: null,
    content: null,
    coverImageUrl: "https://example.com/cover.jpg",
    tags: ["u-minh-ha", 2, " hanh-ly "],
    topic: "khong-hop-le",
    relatedTourCodes: ["XMSN-4N3D", 7],
    checklist: { bad: true },
    publishedAt: new Date("2026-09-15T08:00:00Z"),
    createdAt: new Date("2026-09-01T00:00:00Z"),
    isFeatured: false,
  };

  const post = toPostRecord(row);

  assert.equal(post.category, "kinh-nghiem");
  assert.equal(post.excerpt, "");
  assert.equal(post.content, "");
  assert.deepEqual(post.tags, ["u-minh-ha", "hanh-ly"]);
  assert.equal(post.topic, "hanh-ly");
  assert.deepEqual(post.relatedTourCodes, ["XMSN-4N3D"]);
  assert.equal(post.checklist, undefined);
  assert.equal(post.publishedAt, "2026-09-15T08:00:00.000Z");
  assert.equal(post.coverImage.src, POST_FALLBACK_IMAGE_SRC);
  assert.equal(post.coverImage.alt, "Bài viết");
});

test("toPostRecord: checklist hợp lệ, ảnh nội bộ và topic hợp lệ", () => {
  const row: PostRow = {
    slug: "bai-viet-2",
    title: "Bài viết 2",
    excerpt: "Tóm tắt",
    content: "Nội dung",
    coverImageUrl: "/images/63-mui-ghe-dtc-kenh-beo.webp",
    tags: [],
    topic: "dat-mui",
    relatedTourCodes: [],
    checklist: ["Kem chống muỗi", 1, " Nước uống "],
    publishedAt: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    isFeatured: true,
  };

  const post = toPostRecord(row);

  assert.equal(post.topic, "dat-mui");
  assert.deepEqual(post.checklist, ["Kem chống muỗi", "Nước uống"]);
  assert.equal(post.publishedAt, "2026-10-01T00:00:00.000Z");
  assert.equal(post.coverImage.src, "/images/63-mui-ghe-dtc-kenh-beo.webp");
});

test("toPostRecord: publishedAt hỏng và createdAt thiếu vẫn có ISO fallback", () => {
  const row: PostRow = {
    slug: "bai-viet-3",
    title: "Bài viết 3",
    excerpt: null,
    content: null,
    coverImageUrl: null,
    tags: [],
    topic: null,
    relatedTourCodes: null,
    checklist: null,
    publishedAt: "khong-phai-ngay",
    createdAt: null,
    isFeatured: false,
  };

  const post = toPostRecord(row);

  assert.equal(post.publishedAt, new Date(0).toISOString());
  assert.equal(post.topic, "hanh-ly");
  assert.equal(post.coverImage.src, POST_FALLBACK_IMAGE_SRC);
});

test("toCuisineListingData: null thành chuỗi rỗng, ảnh ngoài bị chặn", () => {
  const row: CuisineRow = {
    slug: "lau-mam",
    name: "Lẩu mắm",
    description: null,
    whereToEat: null,
    province: null,
    imageUrl: "https://example.com/lau.jpg",
    sortOrder: 2,
  };

  const data = toCuisineListingData(row, [
    { code: "XMSN-4N3D", slug: "tour", name: "Tour" },
  ]);

  assert.equal(data.description, "");
  assert.equal(data.whereToEat, "");
  assert.equal(data.province, "");
  assert.equal(data.provinceSlug, "");
  assert.equal(data.image, null);
  assert.equal(data.tourRefs.length, 1);
});

test("normalizeFaqPlacement và toPublicFaqRecord", () => {
  assert.equal(normalizeFaqPlacement("home"), "home");
  assert.equal(normalizeFaqPlacement("contact"), "contact");
  assert.equal(normalizeFaqPlacement("both"), "both");
  assert.equal(normalizeFaqPlacement("khac"), null);
  assert.equal(normalizeFaqPlacement(null), null);

  const row: FaqRow = {
    question: "Câu hỏi",
    answer: "Trả lời",
    category: "  ",
    placement: "home",
    sortOrder: 9,
    isActive: true,
  };

  const faq = toPublicFaqRecord(row);
  assert.equal(faq.category, "general");
  assert.equal(faq.placement, "home");
  assert.equal(faq.isActive, true);
  assert.equal(faq.sortOrder, 9);
});

test("normalizePostTopic", () => {
  assert.equal(normalizePostTopic("hanh-ly"), "hanh-ly");
  assert.equal(normalizePostTopic("thoi-tiet"), "thoi-tiet");
  assert.equal(normalizePostTopic("dat-mui"), "dat-mui");
  assert.equal(normalizePostTopic("khac"), "hanh-ly");
  assert.equal(normalizePostTopic(null), "hanh-ly");
});
