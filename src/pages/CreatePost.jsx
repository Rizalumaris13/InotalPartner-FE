import { useFeedback } from "../hooks/useFeedback";
import { useState, useRef, useEffect } from "react";
import { getCategoriesApi, getTagsApi, createCategoryApi, createTagApi } from "../api/taxonomy";
import { createPostApi, updatePostApi, uploadImageApi, resolveImageUrl } from "../api/posts";
import PostPreview from "../components/Postpreview";
import {
  Bold, CalendarDays, Eye, Hash, Italic, Link, List, Newspaper,
  Send, Tag, Trash2, Underline, Upload, X, BookOpen,
} from "lucide-react";

const toLabel = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "Event");

// editingPost: { postType: 'news' | 'event' | 'article', post } — diisi saat klik Edit di daftar post
export default function CreatePost({ editingPost = null, onFinishEdit }) {
  const { notify, feedback } = useFeedback();
  const isEditing = !!editingPost;
  const editPost = editingPost?.post;

  const [postType, setPostType] = useState(isEditing ? toLabel(editingPost.postType) : "Event");
  const [title, setTitle] = useState(editPost?.title || "");
  const [content, setContent] = useState(editPost?.content || "");

  const [categories, setCategories] = useState([]);       // [{id, name}, ...]
  const [availableTags, setAvailableTags] = useState([]); // [{id, name}, ...]
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    editPost?.categories?.length
      ? editPost.categories.map((c) => c.id)
      : editPost?.category_id
      ? [editPost.category_id]
      : []
  );
  const [tags, setTags] = useState(editPost?.tags?.map((t) => t.name) || []);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [featuredImage, setFeaturedImage] = useState(resolveImageUrl(editPost?.thumbnail_url) || null);
  const [imageFile, setImageFile] = useState(null);

  const [eventDate, setEventDate] = useState(editPost?.event_date ? editPost.event_date.slice(0, 10) : "");
  const [eventTime, setEventTime] = useState(editPost?.event_time ? editPost.event_time.slice(0, 5) : "");
  const [location, setLocation] = useState(editPost?.event_location || "");

  const [status, setStatus] = useState("Draft");
  const [showPreview, setShowPreview] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const catRes = await getCategoriesApi();
        if (catRes) setCategories(catRes);
        const tagRes = await getTagsApi();
        if (tagRes) setAvailableTags(tagRes);
      } catch (error) {
        console.error("Gagal mengambil data kategori/tag:", error);
      }
    };
    fetchTaxonomy();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Silakan pilih file gambar.", "error");
    if (file.size > 5 * 1024 * 1024) return notify("Ukuran gambar maksimal 5MB.", "error");

    setImageFile(file);
    setFeaturedImage(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (featuredImage?.startsWith("blob:")) URL.revokeObjectURL(featuredImage);
    setFeaturedImage(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const addCategory = async () => {
    const formattedCategory = newCategoryName.trim();
    if (!formattedCategory) return;
    if (categories.some((c) => c.name.toLowerCase() === formattedCategory.toLowerCase())) return;

    try {
      const newCat = await createCategoryApi(formattedCategory);
      setCategories((prev) => [...prev, newCat]);
      setSelectedCategoryIds((prev) => [...prev, newCat.id]);
      setNewCategoryName("");
      setShowAddCategory(false);
    } catch (err) {
      notify(err.response?.data?.message || "Gagal membuat kategori baru", "error");
    }
  };

  const addTag = () => {
    const newTag = tagInput.trim().replace(/^#+/, "");
    if (!newTag) return;
    if (!tags.includes(newTag)) setTags([...tags, newTag]);
    setTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove) => setTags(tags.filter((tag) => tag !== tagToRemove));

  const resolveTagIds = async () => {
    const tagIds = [];
    for (const tagName of tags) {
      const existing = availableTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const newTag = await createTagApi(tagName);
        tagIds.push(newTag.id);
        setAvailableTags((prev) => [...prev, newTag]);
      }
    }
    return tagIds;
  };

  const buildPayload = (tagIds, thumbnailUrl) => {
    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: content.trim().slice(0, 150),
      thumbnail_url: thumbnailUrl,
      category_ids: selectedCategoryIds,
      tag_ids: tagIds,
    };
    if (postType === "Event") {
      // Backend menimpa field event di setiap update, jadi selalu kirim nilai terkini
      payload.event_date = eventDate || null;
      payload.event_time = eventTime || null;
      payload.event_location = location || null;
    }
    return payload;
  };

  const submitPost = async (statusLabel) => {
    if (!title.trim()) return notify("Silakan isi judul post.", "error");
    if (!content.trim()) return notify("Silakan isi konten post.", "error");
    if (selectedCategoryIds.length === 0) return notify("Silakan pilih minimal satu kategori.", "error");

    setIsSaving(true);
    setSubmitError("");

    try {
      const tagIds = await resolveTagIds();

      let thumbnailUrl = isEditing ? editPost?.thumbnail_url || "" : "";
      if (imageFile) {
        thumbnailUrl = await uploadImageApi(imageFile);
      } else if (isEditing && !featuredImage) {
        thumbnailUrl = "";
      }

      const payload = buildPayload(tagIds, thumbnailUrl);

      if (isEditing) {
        await updatePostApi(editingPost.postType, editPost.id, payload);
        notify("Perubahan berhasil disimpan.");
        onFinishEdit?.();
        return;
      }

      await createPostApi(postType.toLowerCase(), payload);
      setStatus(statusLabel);
      notify(`Post berhasil disimpan sebagai ${statusLabel}.`);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Terjadi kesalahan saat menyimpan pos.");
    } finally {
      setIsSaving(false);
    }
  };

  const insertFormatting = (format) => {
    const textarea = document.getElementById("post-content");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = selectedText;

    if (format === "bold") formattedText = `**${selectedText || "bold text"}**`;
    if (format === "italic") formattedText = `*${selectedText || "italic text"}*`;
    if (format === "underline") formattedText = `<u>${selectedText || "underlined text"}</u>`;
    if (format === "list") formattedText = `- ${selectedText || "List item"}`;
    if (format === "link") formattedText = `[${selectedText || "Link text"}](url)`;

    setContent(content.substring(0, start) + formattedText + content.substring(end));
    setTimeout(() => textarea.focus(), 0);
  };

  const getSelectedCategoryNames = () =>
    categories
      .filter((cat) => selectedCategoryIds.includes(cat.id))
      .map((cat) => cat.name)
      .join(", ");

  const statusBadge = (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "Pending Review" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );

  return (
    <div className="bg-slate-50 text-slate-900">
      {feedback}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-bold tracking-tight">{isEditing ? "Edit Post" : "Create Post"}</h1>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 pr-2 sm:flex">
              <span className="text-sm font-medium text-slate-500">Status:</span>
              {statusBadge}
            </div>

            <div className="hidden h-6 w-px bg-slate-200 sm:block"></div>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex"
            >
              <Eye size={17} />
              {showPreview ? "Edit Post" : "Preview"}
            </button>

            {isEditing ? (
              <>
                <button
                  onClick={() => onFinishEdit?.()}
                  disabled={isSaving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => submitPost("Draft")}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => submitPost("Pending Review")}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
                >
                  <Send size={16} />
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Status:</span>
          {statusBadge}
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700"
        >
          <Eye size={17} />
          {showPreview ? "Edit Post" : "Preview Post"}
        </button>
      </div>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Error: </strong>
            {submitError}
          </div>
        )}

        {showPreview ? (
          <PostPreview
            title={title}
            content={content}
            category={getSelectedCategoryNames()}
            postType={postType}
            tags={tags}
            featuredImage={featuredImage}
            eventDate={eventDate}
            eventTime={eventTime}
            location={location}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 text-base font-bold">Content Editor</h2>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Post Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your post title..."
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition placeholder:font-normal focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Post Content</label>
                  <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
                      <EditorButton icon={<Bold size={17} />} label="Bold" onClick={() => insertFormatting("bold")} />
                      <EditorButton icon={<Italic size={17} />} label="Italic" onClick={() => insertFormatting("italic")} />
                      <EditorButton icon={<Underline size={17} />} label="Underline" onClick={() => insertFormatting("underline")} />
                      <div className="mx-1 h-5 w-px bg-slate-200" />
                      <EditorButton icon={<List size={17} />} label="List" onClick={() => insertFormatting("list")} />
                      <EditorButton icon={<Link size={17} />} label="Link" onClick={() => insertFormatting("link")} />
                    </div>
                    <textarea
                      id="post-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Start writing your post here..."
                      rows={12}
                      className="block w-full resize-y border-0 px-4 py-4 text-sm leading-7 text-slate-700 outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="min-w-0 space-y-6">
              <section className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Tag size={19} className="text-slate-500" />
                    <h2 className="font-bold">Categories</h2>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="h-5 w-5 cursor-pointer rounded-sm border-slate-300 text-sky-600 accent-sky-600"
                        />
                        <span className="text-sm text-slate-800">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="mt-6 rounded-md border border-sky-500 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-50"
                  >
                    Add Category
                  </button>
                  {showAddCategory && (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New Category"
                        className="w-full border border-slate-400 px-3 py-3 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCategory}
                        disabled={!newCategoryName.trim()}
                        className="mt-5 border border-sky-500 px-4 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-40"
                      >
                        Add Category
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-bold">Featured Image</h2>
                </div>
                {featuredImage ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200">
                    <img src={featuredImage} alt="Featured post" className="max-h-[360px] w-full object-cover" />
                    <button
                      onClick={removeImage}
                      className="absolute right-3 top-3 rounded-lg bg-white p-2 text-red-500 shadow-md hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                    {imageFile && (
                      <div className="bg-white px-4 py-3">
                        <p className="truncate text-sm font-medium text-slate-700">{imageFile.name}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 transition hover:border-sky-400 hover:bg-sky-50/40"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-sky-500 shadow-sm">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Click to upload an image</p>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </section>

              <section className="border border-slate-200 bg-white">
                <div className="flex items-center gap-2 bg-white px-5 py-5">
                  <Hash size={19} className="text-slate-500" />
                  <h2 className="font-bold">Tags</h2>
                </div>
                <div className="px-5 pb-5">
                  <textarea
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    rows={1}
                    placeholder="Press enter to add..."
                    className="block w-full resize-none border border-sky-500 px-3 py-3 text-sm outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-500"
                  />
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700"
                        >
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)} className="rounded-full hover:bg-sky-100">
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-bold">Post Details</h2>
                  {isEditing && <span className="text-xs text-slate-400">Tipe post tidak bisa diubah</span>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["Event", "News", "Article"].map((type) => (
                    <button
                      key={type}
                      onClick={() => !isEditing && setPostType(type)}
                      disabled={isEditing && postType !== type}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition ${
                        postType === type
                          ? "border-sky-500 bg-sky-50 text-sky-700 ring-1 ring-sky-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                      }`}
                    >
                      {type === "Event" ? <CalendarDays size={21} /> : type === "News" ? <Newspaper size={21} /> : <BookOpen size={21} />}
                      <p className="text-xs font-semibold sm:text-sm">{type}</p>
                    </button>
                  ))}
                </div>
              </section>

              {postType === "Event" && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarDays size={19} className="text-slate-500" />
                    <h2 className="font-bold">Event Details</h2>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-500"
                    />
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Event location"
                      className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-500"
                    />
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function EditorButton({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} title={label} className="rounded-md p-2 text-slate-500 hover:bg-slate-200">
      {icon}
    </button>
  );
}