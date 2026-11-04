import type { ParsedArticle, ParsedArticleSection } from "@/lib/posts/content";

type ArticleBodyProps = {
  article: ParsedArticle;
};

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

function ArticleSection({
  section,
  number,
}: {
  section: ParsedArticleSection;
  number: number;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 border-t border-line pt-7"
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[0.7rem] text-clay">
          {String(number).padStart(2, "0")} /
        </span>
        <h2 className="font-display text-2xl leading-tight font-semibold text-ink">
          {section.title}
        </h2>
      </div>
      <p className="mt-3 max-w-[70ch] text-base leading-7 text-sage">
        {renderInline(section.body)}
      </p>
    </section>
  );
}

export function ArticleBody({ article }: ArticleBodyProps) {
  return (
    <div className="flex flex-col gap-7">
      {article.intro.length > 0 ? (
        <div className="max-w-[70ch] text-base leading-8 text-ink md:text-lg">
          {article.intro.map((paragraph, index) => (
            <p key={`intro-${index}`} className={index > 0 ? "mt-4" : undefined}>
              {renderInline(paragraph)}
            </p>
          ))}
        </div>
      ) : null}

      {article.sections.map((section, index) => (
        <div key={section.id}>
          {index === 0 ? (
            <span className="mb-1 block text-[0.68rem] font-semibold tracking-[0.1em] text-sage uppercase">
              Nội dung thực địa
            </span>
          ) : null}
          <ArticleSection section={section} number={index + 1} />
        </div>
      ))}

      {article.closing.length > 0 ? (
        <div className="border-t border-line pt-7">
          {article.closing.map((paragraph, index) => (
            <p
              key={`closing-${index}`}
              className="max-w-[70ch] text-base leading-7 text-sage"
            >
              {renderInline(paragraph)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
