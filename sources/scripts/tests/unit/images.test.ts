/**
 * T1/D10.4 · `toImageAsset` chỉ cho phép ảnh nội bộ hoặc Cloudinary.
 *
 * Dữ liệu DB có thể còn ảnh cũ hoặc URL nhập tay; hàm này phải rơi về `null`
 * thay vì truyền chuỗi lạ vào `next/image` (gây lỗi runtime).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { toImageAsset } from "@/lib/images";

const CLOUDINARY =
  "https://res.cloudinary.com/duj1xyanj/image/upload/v1730000000/xmsn/media/anh.webp";

test("giữ ảnh nội bộ trong /public/images", () => {
  assert.deepEqual(toImageAsset("/images/05-du-khach-tren-ghe.webp", "Ghe"), {
    src: "/images/05-du-khach-tren-ghe.webp",
    alt: "Ghe",
  });
  assert.deepEqual(toImageAsset("/images/chua-vinh-trang.webp", "Chùa"), {
    src: "/images/chua-vinh-trang.webp",
    alt: "Chùa",
  });
});

test("nhận URL Cloudinary đúng host và path upload", () => {
  assert.deepEqual(toImageAsset(CLOUDINARY, "Cloudinary"), {
    src: CLOUDINARY,
    alt: "Cloudinary",
  });

  const thumbnail =
    "https://res.cloudinary.com/duj1xyanj/image/upload/c_fill,w_320,h_320,q_auto,f_auto/xmsn/media/anh.webp";
  assert.deepEqual(toImageAsset(thumbnail, "Thumb"), {
    src: thumbnail,
    alt: "Thumb",
  });
});

test("chặn host/path lạ để không làm sập next/image", () => {
  const remote =
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Chuoi.jpg/1920px-Chuoi.jpg";

  assert.equal(toImageAsset(remote, "Chuối"), null);
  assert.equal(toImageAsset("https://example.com/anh.webp", "Ngoài"), null);
  assert.equal(toImageAsset("//example.com/anh.webp", "Ngoài"), null);
  assert.equal(toImageAsset("/uploads/anh.webp", "Sai thư mục"), null);
  assert.equal(
    toImageAsset(
      "https://res.cloudinary.com.evil.com/duj1xyanj/image/upload/a.webp",
      "Giả host",
    ),
    null,
  );
  assert.equal(
    toImageAsset(
      "http://res.cloudinary.com/duj1xyanj/image/upload/a.webp",
      "Không https",
    ),
    null,
  );
  assert.equal(
    toImageAsset("https://res.cloudinary.com/duj1xyanj/raw/upload/a.webp", "Raw"),
    null,
  );
});

test("rỗng hoặc null trả null", () => {
  assert.equal(toImageAsset(null, "Không có"), null);
  assert.equal(toImageAsset(undefined, "Không có"), null);
  assert.equal(toImageAsset("", "Không có"), null);
});

test("chặn đuôi file không phải ảnh", () => {
  assert.equal(toImageAsset("/images/tai-lieu.pdf", "PDF"), null);
  assert.equal(toImageAsset("/images/script.js", "JS"), null);
});
