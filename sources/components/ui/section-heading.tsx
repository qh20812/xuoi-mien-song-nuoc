import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <span className="mb-2 block font-sans text-xs font-semibold tracking-[0.14em] text-sage uppercase">
        {eyebrow}
      </span>
      <h2
        className={cn(
          "font-display text-[clamp(2rem,5vw,3rem)] leading-[1.08] font-medium tracking-[-0.02em] text-ink",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-[62ch] text-base leading-[1.65] text-sage md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
