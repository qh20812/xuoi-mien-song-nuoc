import type {
  AdminPostRow,
  PostTourCode,
} from "@/server/content/admin-posts";
import { POST_TOPICS } from "@/lib/posts/listing";

type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  post?: AdminPostRow;
  tourCodes: PostTourCode[];
  mediaUrls: string[];
  submitLabel: string;
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const textareaClass =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

export function PostForm({
  action,
  post,
  tourCodes,
  mediaUrls,
  submitLabel,
}: PostFormProps) {
  const isEdit = Boolean(post);

  return (
    <form action={action} className="flex flex-col gap-5">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="post-title" className={labelClass}>
            Tiêu đề
          </label>
          <input
            id="post-title"
            name="title"
            required
            maxLength={255}
            defaultValue={post?.title ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-slug" className={labelClass}>
            Slug {isEdit ? "(không đổi)" : ""}
          </label>
          <input
            id="post-slug"
            name="slug"
            required
            maxLength={200}
            readOnly={isEdit}
            aria-readonly={isEdit}
            defaultValue={post?.slug ?? ""}
            className={
              isEdit
                ? `${fieldClass} cursor-not-allowed bg-surface-warm text-sage`
                : fieldClass
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-topic" className={labelClass}>
            Chủ đề
          </label>
          <select
            id="post-topic"
            name="topic"
            defaultValue={post?.topic ?? "hanh-ly"}
            className={fieldClass}
          >
            {POST_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-status" className={labelClass}>
            Trạng thái
          </label>
          <select
            id="post-status"
            name="status"
            defaultValue={post?.status ?? "draft"}
            className={fieldClass}
          >
            <option value="draft">Nháp</option>
            <option value="published">Đã đăng</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-published" className={labelClass}>
            Ngày đăng
          </label>
          <input
            id="post-published"
            name="publishedAt"
            type="date"
            defaultValue={post?.publishedAt?.slice(0, 10) ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-excerpt" className={labelClass}>
          Tóm tắt
        </label>
        <textarea
          id="post-excerpt"
          name="excerpt"
          rows={3}
          maxLength={500}
          defaultValue={post?.excerpt ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-content" className={labelClass}>
          Nội dung (dùng **tiêu đề mục** cho heading)
        </label>
        <textarea
          id="post-content"
          name="content"
          rows={12}
          maxLength={60_000}
          defaultValue={post?.content ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="post-image" className={labelClass}>
            Ảnh bìa (/images/…)
          </label>
          <input
            id="post-image"
            name="coverImageUrl"
            list="post-media-images"
            maxLength={500}
            defaultValue={post?.coverImageUrl ?? ""}
            className={fieldClass}
          />
          <datalist id="post-media-images">
            {mediaUrls.map((url) => (
              <option key={url} value={url} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-tags" className={labelClass}>
            Tags (cách nhau bằng dấu phẩy)
          </label>
          <input
            id="post-tags"
            name="tags"
            defaultValue={post?.tags.join(", ") ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-related" className={labelClass}>
            Mã tour liên quan (cách nhau bằng dấu phẩy)
          </label>
          <input
            id="post-related"
            name="relatedTourCodes"
            list="post-tour-codes"
            defaultValue={post?.relatedTourCodes.join(", ") ?? ""}
            className={fieldClass}
          />
          <datalist id="post-tour-codes">
            {tourCodes.map((tour) => (
              <option key={tour.code} value={tour.code}>
                {tour.name}
              </option>
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="post-checklist" className={labelClass}>
            Checklist (mỗi dòng một mục)
          </label>
          <textarea
            id="post-checklist"
            name="checklist"
            rows={6}
            defaultValue={post?.checklist.join("\n") ?? ""}
            className={textareaClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-seo-title" className={labelClass}>
            SEO title
          </label>
          <input
            id="post-seo-title"
            name="seoTitle"
            maxLength={200}
            defaultValue={post?.seoTitle ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-seo-description" className={labelClass}>
            SEO description
          </label>
          <input
            id="post-seo-description"
            name="seoDescription"
            maxLength={320}
            defaultValue={post?.seoDescription ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={post?.isFeatured}
          className="size-4 rounded border-line text-clay focus-visible:ring-2 focus-visible:ring-clay/40"
        />
        Bài viết nổi bật (hiện ở vị trí lead)
      </label>

      <div>
        <button type="submit" className={primaryButtonClass}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
