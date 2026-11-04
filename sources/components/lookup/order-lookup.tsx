"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleCheck,
  Clock3,
  MessageCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { CancelOrderDialog } from "@/components/lookup/cancel-order-dialog";
import { LookupForm } from "@/components/lookup/lookup-form";
import { LookupResult } from "@/components/lookup/lookup-result";
import { normalizePhone } from "@/lib/booking/validation";
import type { OrderLookupInput, PublicOrder } from "@/lib/contracts/order";
import type { SiteSettings } from "@/lib/contracts/site";
import {
  cancelOrder,
  lookupOrder,
  OrderApiError,
} from "@/lib/orders/client";

type OrderLookupProps = {
  settings: SiteSettings;
};

export function OrderLookup({ settings }: OrderLookupProps) {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [credentials, setCredentials] = useState<OrderLookupInput | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [justCancelled, setJustCancelled] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!order) return;
    document.getElementById("lookup-result-heading")?.focus();
  }, [order]);

  const closeCancelDialog = useCallback(() => {
    setCancelOpen(false);
    setCancelError(null);
  }, []);

  function updateField(field: "code" | "phone", value: string) {
    if (field === "code") setCode(value);
    else setPhone(value);

    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setLookupError(null);
  }

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const normalizedCode = code.trim().toUpperCase();
    const normalizedPhone = normalizePhone(phone);
    const errors: Record<string, string> = {};

    if (!/^XMSN-\d{4}-\d{4,8}$/.test(normalizedCode)) {
      errors.code = "Mã đơn không đúng định dạng XMSN-2026-0001.";
    }
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setLookupError(null);
    setOrder(null);
    setCredentials(null);
    setJustCancelled(false);

    try {
      const result = await lookupOrder({
        code: normalizedCode,
        phone: normalizedPhone,
      });
      setCode(normalizedCode);
      setPhone(normalizedPhone);
      setOrder(result);
      setCredentials({ code: normalizedCode, phone: normalizedPhone });
    } catch (error) {
      setLookupError(
        error instanceof OrderApiError
          ? error.message
          : "Không thể tra cứu lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(reason: string) {
    if (!credentials || !order || cancelSubmitting) return;

    setCancelSubmitting(true);
    setCancelError(null);

    try {
      const updated = await cancelOrder({
        ...credentials,
        reason,
      });
      setOrder(updated);
      setJustCancelled(true);
      setCancelOpen(false);
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (error) {
      setCancelError(
        error instanceof OrderApiError
          ? error.message
          : "Không thể hủy đơn lúc này. Vui lòng thử lại hoặc gọi hotline.",
      );
    } finally {
      setCancelSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 items-end gap-6 border-b border-line pb-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
            Tra cứu & quản lý đơn giữ chỗ
          </span>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,4.8vw,4rem)] leading-[1.05] font-medium tracking-[-0.03em] text-ink">
            Kiểm tra tình trạng đơn
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-sage">
            Nhập mã đơn và số điện thoại đã dùng khi đặt chỗ để xem trạng thái,
            lịch khởi hành và yêu cầu hủy nếu đủ điều kiện.
          </p>
        </div>
        <div className="lg:col-span-5 lg:flex lg:justify-end">
          <div className="inline-flex items-start gap-3 rounded-[12px] border border-line bg-surface px-4 py-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-clay" />
            <span className="text-sm leading-6 text-sage">
              Xác thực bằng mã đơn và số điện thoại. Hệ thống không tiết lộ thông
              tin nếu hai dữ liệu không khớp.
            </span>
          </div>
        </div>
      </section>

      <LookupForm
        code={code}
        phone={phone}
        errors={fieldErrors}
        loading={loading}
        settings={settings}
        onChange={updateField}
        onSubmit={handleLookup}
      />

      {lookupError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-[12px] border border-danger/30 bg-danger/5 p-4 text-sm leading-6 text-danger"
        >
          {lookupError}
        </div>
      ) : null}

      {justCancelled && order?.status === "cancelled" ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-4 rounded-[14px] border border-success/30 bg-success/5 p-4"
        >
          <div className="flex items-start gap-3">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <span className="block text-sm font-semibold text-ink">
                Đơn đã được hủy
              </span>
              <p className="mt-1 text-sm leading-6 text-sage">
                Chỗ đã được mở lại. Nếu bạn đã đặt cọc, nhân viên sẽ liên hệ để xử
                lý theo chính sách hoàn cọc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJustCancelled(false)}
            aria-label="Đóng thông báo"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-sage transition-colors hover:bg-surface hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}

      {loading ? (
        <div aria-busy="true" aria-label="Đang tải kết quả tra cứu" className="flex flex-col gap-4">
          <div className="h-24 animate-pulse rounded-[20px] border border-line bg-surface" />
          <div className="h-64 animate-pulse rounded-[20px] border border-line bg-surface" />
        </div>
      ) : null}

      {!loading && order ? (
        <div ref={resultRef} className="scroll-mt-28">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.12em] text-sage uppercase">
              Kết quả tra cứu
            </span>
            <span className="text-xs text-sage">1 đơn phù hợp</span>
          </div>
          <LookupResult
            order={order}
            onRequestCancel={() => {
              setCancelOpen(true);
              setCancelError(null);
            }}
          />
        </div>
      ) : null}

      {!loading && !order ? (
        <section className="rounded-[20px] border border-dashed border-line bg-surface-warm/35 p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface text-clay">
            <Search aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">
            Kết quả sẽ xuất hiện sau khi tra cứu
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-sage">
            Mã đơn có trong màn hình xác nhận giữ chỗ. Vì lý do bảo mật, cần nhập
            đúng số điện thoại đã dùng khi đặt.
          </p>
        </section>
      ) : null}

      {order ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <Clock3 aria-hidden="true" className="size-5 text-clay" />
            <h3 className="mt-2 text-sm font-semibold text-ink">
              Giữ chỗ {settings.booking.holdHours} giờ
            </h3>
            <p className="mt-1 text-xs leading-5 text-sage">
              Chưa thu tiền trực tuyến. Nhân viên hướng dẫn đặt cọc sau khi liên hệ.
            </p>
          </div>
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <RotateCcw aria-hidden="true" className="size-5 text-clay" />
            <h3 className="mt-2 text-sm font-semibold text-ink">
              Dời lịch miễn phí thủ tục
            </h3>
            <p className="mt-1 text-xs leading-5 text-sage">
              Áp dụng khi chuyến mới còn chỗ; chênh lệch giá được xử lý theo báo
              giá mới.
            </p>
          </div>
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <MessageCircle aria-hidden="true" className="size-5 text-clay" />
            <h3 className="mt-2 text-sm font-semibold text-ink">
              Hỗ trợ trực tiếp
            </h3>
            <p className="mt-1 text-xs leading-5 text-sage">
              Gọi{" "}
              <a
                href={settings.hotlineHref}
                className="font-semibold text-ink underline underline-offset-2"
              >
                {settings.hotline}
              </a>{" "}
              hoặc nhắn Zalo khi cần thay đổi.
            </p>
          </div>
        </div>
      ) : null}

      {cancelOpen && order && credentials ? (
        <CancelOrderDialog
          order={order}
          submitting={cancelSubmitting}
          error={cancelError}
          onClose={closeCancelDialog}
          onConfirm={handleCancel}
        />
      ) : null}
    </div>
  );
}
