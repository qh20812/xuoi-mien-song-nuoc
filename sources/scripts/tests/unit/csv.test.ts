/**
 * T1 · Sinh CSV an toàn cho file export đơn đặt chỗ.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { csvCell, toCsv } from "@/lib/csv";

test("ô thường giữ nguyên", () => {
  assert.equal(csvCell("XMSN-2026-0001"), "XMSN-2026-0001");
  assert.equal(csvCell(4190000), "4190000");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
});

test("ô có dấu phẩy, nháy kép, xuống dòng đều được bọc", () => {
  assert.equal(csvCell("Nguyễn Văn A, Quận 1"), '"Nguyễn Văn A, Quận 1"');
  assert.equal(csvCell('Anh "B"'), '"Anh ""B"""');
  assert.equal(csvCell("dòng 1\ndòng 2"), '"dòng 1\ndòng 2"');
});

test("chặn CSV injection bằng dấu nháy đơn", () => {
  assert.equal(csvCell("=SUM(A1:A9)"), "'=SUM(A1:A9)");
  assert.equal(csvCell("+84903123456"), "'+84903123456");
  assert.equal(csvCell("@cmd"), "'@cmd");
  assert.equal(csvCell("-1"), "'-1");
});

test("toCsv thêm BOM và nối dòng bằng CRLF", () => {
  const csv = toCsv([
    ["Mã", "Tên"],
    ["A1", "Nguyễn Văn A"],
  ]);

  assert.equal(csv, "\uFEFFMã,Tên\r\nA1,Nguyễn Văn A");
  assert.equal(toCsv([["x"]], { bom: false }), "x");
});
