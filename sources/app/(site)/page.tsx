import type { Metadata } from "next";
import { CuisineSection } from "@/components/home/cuisine-section";
import { DestinationsSection } from "@/components/home/destinations-section";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturedToursSection } from "@/components/home/featured-tours-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { JourneySection } from "@/components/home/journey-section";
import { PromiseStrip } from "@/components/home/promise-strip";
import { homePageData } from "@/lib/fixtures/home";
import { closingImage, heroImage } from "@/lib/fixtures/home-media";
import { siteSettings } from "@/lib/fixtures/site";

export const metadata: Metadata = {
  title: "Tour miền Tây, U Minh Hạ, Đất Mũi",
  description:
    "Khám phá tour Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi: chợ nổi Cái Răng, rừng tràm, mốc tọa độ cực Nam. Đặt giữ chỗ online, xác nhận qua điện thoại/Zalo.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection image={heroImage} />
      <PromiseStrip />
      <FeaturedToursSection tours={homePageData.tours} />
      <JourneySection legs={homePageData.journey} />
      <DestinationsSection destinations={homePageData.destinations} />
      <CuisineSection cuisines={homePageData.cuisines} />
      <FaqSection faqs={homePageData.faqs} settings={siteSettings} />
      <HomeCtaSection image={closingImage} settings={siteSettings} />
    </>
  );
}
