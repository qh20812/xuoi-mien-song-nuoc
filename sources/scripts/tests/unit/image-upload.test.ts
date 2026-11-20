import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import {
  fitWithinEdge,
  formatBytes,
  fileNameForType,
  prepareImageForUpload,
  shouldCompressImage,
} from "@/lib/media/resize-for-upload";

test("shouldCompressImage dựa trên ngưỡng, không nén ảnh nhỏ", () => {
  assert.equal(shouldCompressImage(1024), false);
  assert.equal(shouldCompressImage(3 * 1024 * 1024), false);
  assert.equal(shouldCompressImage(MAX_UPLOAD_BYTES), true);
  assert.equal(shouldCompressImage(MAX_UPLOAD_BYTES + 1), true);
  assert.equal(shouldCompressImage(Number.NaN), false);
});

test("fitWithinEdge giữ tỉ lệ và không phóng to", () => {
  assert.deepEqual(fitWithinEdge(2400, 1200), { width: 1920, height: 960 });
  assert.deepEqual(fitWithinEdge(1200, 2400), { width: 960, height: 1920 });
  assert.deepEqual(fitWithinEdge(800, 600), { width: 800, height: 600 });
  assert.deepEqual(fitWithinEdge(1920, 1920), { width: 1920, height: 1920 });
  assert.deepEqual(fitWithinEdge(0, 100), { width: 0, height: 0 });
  assert.deepEqual(fitWithinEdge(Number.NaN, 100), { width: 0, height: 0 });
});

test("formatBytes đọc được KB/MB", () => {
  assert.equal(formatBytes(512 * 1024), "512 KB");
  assert.match(formatBytes(3.4 * 1024 * 1024), /3,4 MB/);
  assert.equal(formatBytes(0), "0 KB");
});

test("fileNameForType đổi đuôi theo định dạng nén", () => {
  assert.equal(fileNameForType("anh.Tour.JPG", "image/webp"), "anh.Tour.webp");
  assert.equal(fileNameForType("anh.png", "image/jpeg"), "anh.jpg");
  assert.equal(fileNameForType("", "image/jpeg"), "anh.jpg");
});

test("prepareImageForUpload trả nguyên file khi ảnh nhỏ", async () => {
  const file = new File([new Uint8Array(64)], "small.jpg", { type: "image/jpeg" });
  assert.equal(await prepareImageForUpload(file), file);
});
