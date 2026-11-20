import { cacheLife, cacheTag } from "next/cache";
import type { PublicFaqRecord } from "@/lib/contracts/faq";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import { queryContactFaqs, queryHomeFaqs } from "./faqs-query";

export async function listHomeFaqs(): Promise<PublicFaqRecord[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.faqs);

  return queryHomeFaqs();
}

export async function listContactFaqs(): Promise<PublicFaqRecord[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.faqs);

  return queryContactFaqs();
}
