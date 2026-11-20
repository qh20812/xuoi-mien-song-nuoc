import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isCloudinaryImageUrl,
  isLocalImageUrl,
  isManagedImageUrl,
} from "@/lib/media/image-url";

test("isLocalImageUrl chỉ nhận ảnh trong /images", () => {
  assert.equal(isLocalImageUrl("/images/a.webp"), true);
  assert.equal(isLocalImageUrl("/images/thu-muc/a.JPG"), true);
  assert.equal(isLocalImageUrl("/uploads/a.webp"), false);
  assert.equal(isLocalImageUrl("images/a.webp"), false);
  assert.equal(isLocalImageUrl("/images/a.svg"), false);
  assert.equal(isLocalImageUrl(null), false);
});

test("isCloudinaryImageUrl chỉ nhận https + host + /image/upload", () => {
  assert.equal(
    isCloudinaryImageUrl(
      "https://res.cloudinary.com/duj1xyanj/image/upload/v1/xmsn/media/a.webp",
    ),
    true,
  );
  assert.equal(
    isCloudinaryImageUrl(
      "https://res.cloudinary.com/duj1xyanj/image/upload/c_fill,w_320/a.webp",
    ),
    true,
  );
  assert.equal(
    isCloudinaryImageUrl("http://res.cloudinary.com/duj1xyanj/image/upload/a.webp"),
    false,
  );
  assert.equal(
    isCloudinaryImageUrl("https://example.com/duj1xyanj/image/upload/a.webp"),
    false,
  );
  assert.equal(
    isCloudinaryImageUrl("https://res.cloudinary.com/duj1xyanj/raw/upload/a.webp"),
    false,
  );
  assert.equal(isCloudinaryImageUrl("khong-phai-url"), false);
});

test("isManagedImageUrl hợp nhất hai nguồn ảnh", () => {
  assert.equal(isManagedImageUrl("/images/a.webp"), true);
  assert.equal(
    isManagedImageUrl("https://res.cloudinary.com/x/image/upload/a.webp"),
    true,
  );
  assert.equal(isManagedImageUrl("https://example.com/a.webp"), false);
  assert.equal(isManagedImageUrl(""), false);
});

test("khi có CLOUDINARY_URL thì chỉ nhận đúng cloud name", () => {
  const previous = process.env.CLOUDINARY_URL;
  process.env.CLOUDINARY_URL = "cloudinary://key:secret@demo";

  try {
    assert.equal(
      isCloudinaryImageUrl("https://res.cloudinary.com/demo/image/upload/a.webp"),
      true,
    );
    assert.equal(
      isCloudinaryImageUrl("https://res.cloudinary.com/khac/image/upload/a.webp"),
      false,
    );
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previous;
  }
});
