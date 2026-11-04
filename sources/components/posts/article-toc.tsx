"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ListTree } from "lucide-react";
import type { ParsedArticleSection } from "@/lib/posts/content";
import { cn } from "@/lib/utils";

type ArticleTocProps = {
  sections: ParsedArticleSection[];
  compact?: boolean;
};

export function ArticleToc({ sections, compact = false }: ArticleTocProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  const links = sections.map((section, index) => {
    const active = section.id === activeId;
    return (
      <a
        key={section.id}
        href={`#${section.id}`}
        aria-current={active ? "location" : undefined}
        className={cn(
          "flex items-center justify-between gap-3 rounded-[8px] px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-surface-warm font-semibold text-ink"
            : "text-sage hover:bg-surface-warm hover:text-ink",
        )}
      >
        <span className="truncate">{section.title}</span>
        <span className="shrink-0 font-mono text-[0.65rem] text-sage">
          {String(index + 1).padStart(2, "0")}
        </span>
      </a>
    );
  });

  if (compact) {
    return (
      <details className="group rounded-[16px] border border-line bg-surface p-4 lg:hidden">
        <summary className="flex list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
          <span className="flex items-center gap-2">
            <ListTree aria-hidden="true" className="size-4 text-clay" />
            Mục lục bài viết
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-sage transition-transform group-open:rotate-180"
          />
        </summary>
        <nav className="mt-3 flex flex-col gap-0.5 border-t border-line pt-3">
          {links}
        </nav>
      </details>
    );
  }

  return (
    <div className="hidden rounded-[16px] border border-line bg-surface p-5 lg:block">
      <h2 className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-ink uppercase">
        <ListTree aria-hidden="true" className="size-4 text-clay" />
        Mục lục bài viết
      </h2>
      <nav className="mt-3 flex flex-col gap-0.5 border-t border-line pt-3">
        {links}
      </nav>
    </div>
  );
}
