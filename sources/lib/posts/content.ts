import { toSlug } from "@/lib/slug";

export type ParsedArticleSection = {
  id: string;
  title: string;
  body: string;
};

export type ParsedArticle = {
  intro: string[];
  sections: ParsedArticleSection[];
  closing: string[];
};

export function parseArticleContent(content: string): ParsedArticle {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const intro: string[] = [];
  const sections: ParsedArticleSection[] = [];
  const closing: string[] = [];
  const seenIds = new Map<string, number>();

  for (const paragraph of paragraphs) {
    const heading = paragraph.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);

    if (heading) {
      const title = heading[1]!.trim().replace(/[.:]\s*$/, "");
      const baseId = toSlug(title) || "noi-dung";
      const count = (seenIds.get(baseId) ?? 0) + 1;
      seenIds.set(baseId, count);

      sections.push({
        id: count === 1 ? baseId : `${baseId}-${count}`,
        title,
        body: heading[2]!.trim(),
      });
      continue;
    }

    if (sections.length === 0) intro.push(paragraph);
    else closing.push(paragraph);
  }

  return { intro, sections, closing };
}
