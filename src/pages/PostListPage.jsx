import { useFeedback } from '../hooks/useFeedback';
import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, Eye, Send, ArrowDownCircle, AlertCircle, ShieldAlert, X } from 'lucide-react';
import { getPostsApi, publishPostApi, takedownPostApi, resolveImageUrl } from '../api/posts';
import PostPreview from '../components/Postpreview';
import { useAuth } from '../hooks/useAuth';

const POST_TYPES = [
  { key: 'news', label: 'News' },
  { key: 'event', label: 'Event' },
  { key: 'article', label: 'Article' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Dipublikasi' },
  { key: 'taken_down', label: 'Diturunkan' },
];

const PAGE_SIZE = 10;

const getPostCategories = (post) =>
  post.categories?.length ? post.categories : post.category?.name ? [post.category] : [];

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

const StatusBadge = ({ status }) => {
  const styles = {
    draft: 'text-amber-700 bg-amber-100',
    published: 'text-emerald-700 bg-emerald-100',
    taken_down: 'text-red-700 bg-red-100',
  };
  const labels = { draft: 'Draft', published: 'Dipublikasi', taken_down: 'Diturunkan' };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${styles[status] || 'text-gray-700 bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

export default function PostListPage({ onEdit }) {
  const { notify, confirmAction, feedback } = useFeedback();
  const { role, user: currentUser } = useAuth();

  const isOperator = role === 'operator';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [postType, setPostType] = useState('news');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Post yang sedang di-preview (format sama seperti Preview di CreatePost)
  const [previewPost, setPreviewPost] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setLoading(true);
      setError('');
      try {
        // Backend membatasi limit maksimal 100; filter status & pagination dilakukan di sisi klien
        const response = await getPostsApi(postType, 1, 100);
        if (isMounted) setPosts(response.data || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Gagal mengambil data post');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, [postType, refreshKey]);

  const changePostType = (value) => {
    if (value === postType) return;
    setPostType(value);
    setPage(1);
  };

  const changeStatusFilter = (value) => {
    if (value === statusFilter) return;
    setStatusFilter(value);
    setPage(1);
  };

  const changeSearch = (value) => {
    if (value === search) return;
    setSearch(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchSearch = !keyword || p.title?.toLowerCase().includes(keyword);
      return matchStatus && matchSearch;
    });
  }, [posts, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Permission helper ─────────────────────────────────────────────
  const canEdit = (p) =>
  isOperator &&
  ['draft', 'taken_down'].includes(p.status) &&
  p.author_id === currentUser?.id;
  const canPublish = (p) =>
  isAdmin && ['draft', 'taken_down'].includes(p.status);  
  const canTakedown = (p) => isAdmin && p.status === 'published';

  // ── Actions ───────────────────────────────────────────────────────
  const closePreview = () => setPreviewPost(null);

  const categoryNames = (p) =>
    getPostCategories(p).map((c) => c.name).join(', ');

  const handlePublish = async (p) => {
    if (!(await confirmAction(`Publikasikan "${p.title}" ke Landing Page?`, {
      title: 'Publikasikan post', confirmLabel: 'Ya, publikasikan', danger: false,
    }))) return;
    try {
      await publishPostApi(postType, p.id);
      notify('Post berhasil dipublikasikan ke Landing Page.');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.response?.data?.message || 'Gagal mempublikasikan post', 'error');
    }
  };

  const handleTakedown = async (p) => {
    if (!(await confirmAction(`Turunkan "${p.title}" dari Landing Page? Post yang diturunkan tidak bisa dipublikasikan lagi.`, {
      title: 'Turunkan post', confirmLabel: 'Ya, turunkan',
    }))) return;
    try {
      await takedownPostApi(postType, p.id);
      notify('Post berhasil diturunkan dari Landing Page.');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.response?.data?.message || 'Gagal menurunkan post', 'error');
    }
  };

  const iconBtn = 'p-1.5 rounded-lg transition-colors text-gray-400';

  return (
    <div className="flex flex-col h-full relative">
      {feedback}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
          {isOperator ? 'Daftar Post Saya' : 'Review Post'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isOperator
            ? 'Post yang sudah kamu simpan. Hanya post berstatus draft yang bisa diedit.'
            : 'Tinjau draft dari operator, lalu publikasikan ke Landing Page.'}
        </p>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Tabs tipe post */}
        <div className="px-4 pt-3 border-b border-gray-100 flex gap-1">
          {POST_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => changePostType(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                postType === t.key
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Cari judul post..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                onClick={() => changeStatusFilter(s.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === s.key
                    ? 'bg-sky-50 text-sky-600 border-sky-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-500 gap-2">
              <ShieldAlert size={32} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <AlertCircle size={32} />
              <p className="text-sm">
                {posts.length === 0 ? 'Belum ada post. Buat post pertama lewat menu Buat Post.' : 'Tidak ada post yang cocok dengan filter.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  {isAdmin && <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penulis</th>}
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibuat</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageItems.map((p) => {
                  const cats = getPostCategories(p);
                  return (
                    <tr key={p.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                        <p className="text-xs text-gray-400 truncate">/{p.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        {cats.length ? (
                          <div className="flex flex-wrap gap-1">
                            {cats.map((c) => (
                              <span key={c.id} className="px-2 py-0.5 text-[11px] font-medium text-sky-700 bg-sky-50 rounded-full">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-sm">-</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-sm text-gray-600">{p.author?.full_name || '-'}</td>
                      )}
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setPreviewPost(p)}
                          className={`${iconBtn} hover:text-sky-500 hover:bg-sky-50`}
                          title="Preview post"
                        >
                          <Eye size={16} />
                        </button>

                        {isOperator && (
                          <button
                            onClick={() => canEdit(p) && onEdit?.(postType, p)}
                            disabled={!canEdit(p)}
                            className={`${iconBtn} ${
                              canEdit(p) ? 'hover:text-sky-500 hover:bg-sky-50' : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={canEdit(p) ? 'Edit post' : 'Hanya post milikmu yang bisa diedit'}
                          >
                            <Edit size={16} />
                          </button>
                        )}

                        {canPublish(p) && (
                          <button
                            onClick={() => handlePublish(p)}
                            className={`${iconBtn} hover:text-emerald-600 hover:bg-emerald-50`}
                            title="Publikasikan ke Landing Page"
                          >
                            <Send size={16} />
                          </button>
                        )}

                        {canTakedown(p) && (
                          <button
                            onClick={() => handleTakedown(p)}
                            className={`${iconBtn} hover:text-red-500 hover:bg-red-50`}
                            title="Turunkan dari Landing Page"
                          >
                            <ArrowDownCircle size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Halaman <span className="font-semibold text-gray-700">{page}</span> dari{' '}
              <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview — memakai komponen yang sama dengan CreatePost */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-slate-50 rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <StatusBadge status={previewPost.status} />
                <span>oleh {previewPost.author?.full_name || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                {canPublish(previewPost) && (
                  <button
                    onClick={() => { const p = previewPost; closePreview(); handlePublish(p); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Publikasikan
                  </button>
                )}
                <button onClick={closePreview} className="p-2 text-gray-400 hover:text-gray-700" aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6">
              <PostPreview
                title={previewPost.title}
                content={previewPost.content}
                category={categoryNames(previewPost)}
                postType={POST_TYPES.find((t) => t.key === postType)?.label}
                tags={previewPost.tags?.map((t) => t.name) || []}
                featuredImage={resolveImageUrl(previewPost.thumbnail_url)}
                eventDate={previewPost.event_date?.slice(0, 10)}
                eventTime={previewPost.event_time?.slice(0, 5)}
                location={previewPost.event_location}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}