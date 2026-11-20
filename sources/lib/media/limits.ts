/**
 * Giới hạn upload ảnh dùng chung cho client, route handler và service.
 *
 * Vercel Function chỉ nhận tối đa **4.5 MB** request body, nên tệp ảnh thật phải
 * nhỏ hơn 4 MB (multipart còn thêm header/biên giới). Client nén trước khi gửi;
 * server vẫn kiểm tra lại để không tin dữ liệu từ trình duyệt.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Trần body của route — chừa ~0.5 MB cho phần multipart. */
export const MAX_REQUEST_BODY_BYTES = 4.5 * 1024 * 1024;
/** Trên ngưỡng này client nén lại trước khi gửi (chừa biên so với trần 4 MB). */
export const CLIENT_COMPRESS_THRESHOLD_BYTES = 3.5 * 1024 * 1024;
export const UPLOAD_MAX_EDGE = 1920;
export const UPLOAD_WEBP_QUALITY = 78;
/** Nhãn hiển thị cho người dùng, khớp với `MAX_UPLOAD_BYTES`. */
export const MAX_UPLOAD_LABEL = "4 MB";
