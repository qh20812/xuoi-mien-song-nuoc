import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1320px] px-5 md:px-8 lg:px-16",
        className,
      )}
    >
      {children}
    </div>
  );
}
