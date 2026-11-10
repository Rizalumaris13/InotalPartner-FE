import { CalendarDays, Clock, MapPin, ImagePlus } from "lucide-react";

// Komponen preview bersama: dipakai di CreatePost dan PostListPage
// supaya tampilannya selalu sama.
export default function PostPreview({
  title,
  content,
  category,
  postType,
  tags = [],
  featuredImage,
  eventDate,
  eventTime,
  location,
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-600">Landing Page Preview</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{title || "Your Post Title"}</h2>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">{postType}</span>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {featuredImage ? (
          <img src={featuredImage} alt={title || "Featured"} className="max-h-[420px] w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
            <ImagePlus size={40} />
          </div>
        )}

        <div className="p-6 sm:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {category || "Uncategorized"}
            </span>
            {postType === "Event" && eventDate && <span className="text-xs text-slate-500">{eventDate}</span>}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title || "Your Post Title"}
          </h1>

          {postType === "Event" && (eventDate || eventTime || location) && (
            <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
              {eventDate && <div className="flex items-center gap-2"><CalendarDays size={17} />{eventDate}</div>}
              {eventTime && <div className="flex items-center gap-2"><Clock size={17} />{eventTime}</div>}
              {location && <div className="flex items-center gap-2 sm:col-span-2"><MapPin size={17} />{location}</div>}
            </div>
          )}

          <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-600">
            {content || "Your post content will appear here..."}
          </div>

          {tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}