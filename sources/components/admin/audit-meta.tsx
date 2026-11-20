import Image from "next/image";
import { formatAuditMeta, type AuditMetaEntry } from "@/lib/audit/meta";

type AuditMetaDetailsProps = {
  entity: string;
  action: string;
  meta: unknown;
};

function safeStringify(meta: unknown): string | null {
  try {
    return JSON.stringify(meta, null, 2) ?? null;
  } catch {
    return null;
  }
}

/**
 * Chi tiết `meta` của một dòng nhật ký: nhãn tiếng Việt, ảnh thu nhỏ, chuyển
 * trạng thái `cũ → mới`, diff cấu hình; JSON gốc vẫn mở được ở cuối.
 */
export function AuditMetaDetails({ entity, action, meta }: AuditMetaDetailsProps) {
  const entries = formatAuditMeta({ entity, action, meta });
  const raw = safeStringify(meta);

  if (entries.length === 0) return <span className="text-sage">—</span>;

  return (
    <details className="text-[12px]">
      <summary className="cursor-pointer font-medium text-clay underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none">
        Xem
      </summary>

      <div className="mt-2 max-w-[420px] rounded-[8px] border border-line bg-surface-warm p-2.5">
        <dl className="flex flex-col gap-2">
          {entries.map((entry, index) => (
            <div key={`${entry.label}-${index}`} className="flex flex-col gap-0.5">
              <dt className="text-[11px] font-semibold text-sage">{entry.label}</dt>
              <dd className="text-[12px] break-words text-ink">
                <MetaValue entry={entry} />
              </dd>
            </div>
          ))}
        </dl>

        {raw ? (
          <details className="mt-2 border-t border-line pt-2">
            <summary className="cursor-pointer text-[11px] font-medium text-sage hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none">
              JSON gốc
            </summary>
            <pre className="mt-1.5 max-h-40 overflow-auto text-[11px] leading-5 break-all whitespace-pre-wrap text-sage">
              {raw}
            </pre>
          </details>
        ) : null}
      </div>
    </details>
  );
}

function MetaValue({ entry }: { entry: AuditMetaEntry }) {
  if (entry.kind === "image") {
    return (
      <a
        href={entry.url}
        target="_blank"
        rel="noreferrer"
        title="Mở ảnh gốc"
        className="inline-flex rounded-[6px] focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
      >
        <Image
          src={entry.url}
          alt=""
          width={96}
          height={96}
          className="h-16 w-16 rounded-[6px] border border-line object-cover"
        />
      </a>
    );
  }

  if (entry.kind === "change") {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-sage">{entry.from || "—"}</span>
        <span aria-hidden="true" className="text-sage">
          →
        </span>
        <span className="font-medium text-ink">{entry.to || "—"}</span>
      </span>
    );
  }

  return <span className={entry.mono ? "font-mono text-[11px]" : undefined}>{entry.value}</span>;
}
