/**
 * T1 · `toLocalImage` chặn URL ngoài trước khi đưa vào `next/image`.
 *
 * `next.config.ts` không khai báo `images.remotePatterns`, nên một URL http(s)
 * lọt vào `next/image` sẽ ném lỗi runtime và làm sập trang. Dữ liệu DB có thể
 * còn ảnh cũ, nên hàm này phải rơi về `null` thay vì truyền nguyên chuỗi.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { toLocalImage } from "@/lib/images";

test("giữ ảnh nội bộ trong /public/images", () => {
  assert.deepEqual(toLocalImage("/images/05-du-khach-tren-ghe.webp", "Ghe"), {
    src: "/images/05-du-khach-tren-ghe.webp",
    alt: "Ghe",
  });
  assert.deepEqual(toLocalImage("/images/chua-vinh-trang.webp", "Chùa"), {
    src: "/images/chua-vinh-trang.webp",
    alt: "Chùa",
  });
});

test("chặn URL ngoài để không làm sập next/image", () => {
  const remote =
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Chuoi.jpg/1920px-Chuoi.jpg";

  assert.equal(toLocalImage(remote, "Chuối"), null);
  assert.equal(toLocalImage("https://example.com/anh.webp", "Ngoài"), null);
  assert.equal(toLocalImage("//example.com/anh.webp", "Ngoài"), null);
  assert.equal(toLocalImage("/uploads/anh.webp", "Sai thư mục"), null);
});

test("rỗng hoặc null trả null", () => {
  assert.equal(toLocalImage(null, "Không có"), null);
  assert.equal(toLocalImage(undefined, "Không có"), null);
  assert.equal(toLocalImage("", "Không có"), null);
});

test("chặn đuôi file không phải ảnh", () => {
  assert.equal(toLocalImage("/images/tai-lieu.pdf", "PDF"), null);
  assert.equal(toLocalImage("/images/script.js", "JS"), null);
});
