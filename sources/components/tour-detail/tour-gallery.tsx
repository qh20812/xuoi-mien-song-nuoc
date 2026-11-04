import Image from "next/image";
import type { ImageAsset } from "@/lib/contracts/home";

type TourGalleryProps = {
  images: ImageAsset[];
};

export function TourGallery({ images }: TourGalleryProps) {
  const [main, ...secondary] = images;
  if (!main) return null;

  return (
    <section aria-label="Thư viện ảnh tour" className="pb-10 md:pb-14">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <figure className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-line bg-surface">
            <Image
              src={main.src}
              alt={main.alt}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-sm leading-6 text-sage">
            {main.alt}
          </figcaption>
        </figure>

        {secondary.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
            {secondary.slice(0, 3).map((image) => (
              <figure key={`${image.src}-${image.alt}`}>
                <div className="relative aspect-[16/9] overflow-hidden rounded-[14px] border border-line bg-surface lg:aspect-[16/7]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 38vw, (min-width: 640px) 32vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2 line-clamp-1 text-xs text-sage">
                  {image.alt}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
