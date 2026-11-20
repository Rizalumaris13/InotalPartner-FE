import { useFeedback } from '../hooks/useFeedback';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Edit,
  Send,
  ArrowDownCircle,
  AlertCircle,
  ShieldAlert,
  Eye,
  X,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

import {
  deleteBannerApi,
  getBannersApi,
  resolveBannerImageUrl,
  updateBannerApi,
} from '../api/homepageBanners';

import { useAuth } from '../hooks/useAuth';
import { toBannerStatusPayload, unwrapBannerList } from '../utils/sliders';
import { STATUS_FILTERS } from '../data/statusFilters';

const PAGE_SIZE = 10;

const StatusBadge = ({ active }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
      active
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    {active ? 'Aktif' : 'Tidak Aktif'}
  </span>
);

export default function ListSliderPage({ onEdit }) {
  const { notify, confirmAction, feedback } = useFeedback();
  const { role } = useAuth();

  const isAdmin = role === 'admin' || role === 'super_admin';

  const [banners, setBanners] = useState([]);
  const [loadState, setLoadState] = useState({ request: null, error: '' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [page, setPage] = useState(1);

  const [previewBanner, setPreviewBanner] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const request = useMemo(() => ({ refreshKey, isAdmin }), [refreshKey, isAdmin]);
  const loading = isAdmin && loadState.request !== request;
  const error = loading ? '' : loadState.error;

  useEffect(() => {
    if (!request.isAdmin) return;
    let mounted = true;

    const loadBanners = async () => {
      try {
        const response = await getBannersApi();
        if (mounted) {
          setBanners(unwrapBannerList(response));
          setLoadState({ request, error: '' });
        }
      } catch (err) {
        if (mounted) {
          setLoadState({ request, error: err.message || 'Gagal mengambil data slider.' });
        }
      }
    };

    loadBanners();

    return () => {
      mounted = false;
    };
  }, [request]);

  const changeSearch = (value) => {
    if (value === search) return;
    setSearch(value);
    setPage(1);
  };

  const changeStatusFilter = (value) => {
    if (value === statusFilter) return;
    setStatusFilter(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return banners.filter((banner) => {
      const matchesSearch = !keyword || banner.title?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && banner.is_active) ||
        (statusFilter === 'inactive' && !banner.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [banners, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePublish = async (banner) => {
    if (!(await confirmAction(
      `Upload "${banner.title || 'Slider tanpa judul'}" ke Landing Page?`,
      { title: 'Publikasikan slider', confirmLabel: 'Ya, upload', danger: false }
    ))) return;

    try {
      await updateBannerApi(banner.id, toBannerStatusPayload(banner, true));

      notify('Slider berhasil di-upload ke Landing Page.');

      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message || 'Gagal meng-upload slider ke Landing Page.', 'error');
    }
  };

  const handleTakedown = async (banner) => {
    if (!(await confirmAction(
      `Turunkan "${banner.title || 'Slider tanpa judul'}" dari Landing Page?`,
      { title: 'Turunkan slider', confirmLabel: 'Ya, turunkan' }
    ))) return;

    try {
      // PUT mempertahankan data slider saat diturunkan dari halaman publik.
      await updateBannerApi(banner.id, toBannerStatusPayload(banner, false));

      notify('Slider berhasil diturunkan dari Landing Page.');

      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message || 'Gagal menurunkan slider.', 'error');
    }
  };

  const handleDelete = async (banner) => {
    if (!(await confirmAction(
      `Hapus slider "${banner.title || 'Slider tanpa judul'}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      { title: 'Hapus slider permanen', confirmLabel: 'Ya, hapus' }
    ))) return;

    try {
      await deleteBannerApi(banner.id);

      notify('Slider berhasil dihapus.');

      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message || 'Gagal menghapus slider.', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert
            size={42}
            className="mx-auto mb-4 text-red-500"
          />

          <h2 className="text-lg font-bold text-red-700">
            Akses Ditolak
          </h2>

          <p className="mt-2 text-sm text-red-600">
            Hanya admin yang dapat mengelola
            slider Landing Page.
          </p>
        </div>
      </div>
    );
  }

  const iconBtn =
    'rounded-lg p-1.5 text-gray-400 transition-colors';

  return (
    <div className="flex h-full flex-col">
      {feedback}

      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
          List Slider
        </h1>

      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                changeSearch(e.target.value)
              }
              placeholder="Cari judul slider..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status.key}
                onClick={() =>
                  changeStatusFilter(status.key)
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === status.key
                    ? 'border-sky-200 bg-sky-50 text-sky-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-500" />
            </div>
          ) : error ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-red-500">
              <ShieldAlert size={32} />

              <p className="text-sm font-medium">
                {error}
              </p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
              <AlertCircle size={32} />

              <p className="text-sm">
                {banners.length === 0
                  ? 'Belum ada slider.'
                  : 'Tidak ada slider yang cocok dengan filter.'}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Slider
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Tombol
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {pageItems.map((banner) => (
                  <tr
                    key={banner.id}
                    className="transition-colors hover:bg-sky-50/30"
                  >

                    <td className="max-w-md px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {banner.background_image ? (
                            <img
                              src={resolveBannerImageUrl(
                                banner.background_image
                              )}
                              alt={
                                banner.title ||
                                'Slider'
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <ImageIcon
                                size={22}
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {banner.title ||
                              '(Tanpa judul)'}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            ID: {banner.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {banner.buttons?.length ? (
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {banner.buttons
                            .slice(0, 3)
                            .map(
                              (
                                button,
                                index
                              ) => (
                                <span
                                  key={
                                    button.id ||
                                    index
                                  }
                                  className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700"
                                >
                                  {button.label}
                                </span>
                              )
                            )}
                        </div>
                      ) : (
                        <span className="text-sm italic text-gray-300">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {banner.order ?? '-'}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        active={!!banner.is_active}
                      />
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          setPreviewBanner(
                            banner
                          )
                        }
                        className={`${iconBtn} hover:bg-sky-50 hover:text-sky-500`}
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() =>
                          onEdit?.(banner)
                        }
                        className={`${iconBtn} hover:bg-sky-50 hover:text-sky-500`}
                        title="Edit slider"
                      >
                        <Edit size={16} />
                      </button>

                      {!banner.is_active ? (
                        <>
                          <button
                            onClick={() =>
                              handlePublish(
                                banner
                              )
                            }
                            className={`${iconBtn} hover:bg-emerald-50 hover:text-emerald-600`}
                            title="Upload ke Landing Page"
                          >
                            <Send size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                banner
                              )
                            }
                            className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                            title="Hapus slider permanen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            handleTakedown(
                              banner
                            )
                          }
                          className={`${iconBtn} hover:bg-red-50 hover:text-red-500`}
                          title="Take Down"
                        >
                          <ArrowDownCircle
                            size={16}
                          />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading &&
          !error &&
          totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4">
              <span className="text-xs text-gray-500">
                Halaman{' '}
                <span className="font-semibold text-gray-700">
                  {page}
                </span>{' '}
                dari{' '}
                <span className="font-semibold text-gray-700">
                  {totalPages}
                </span>
              </span>

              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.max(1, p - 1)
                    )
                  }
                  disabled={page === 1}
                  className="rounded border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>

                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        totalPages,
                        p + 1
                      )
                    )
                  }
                  disabled={
                    page === totalPages
                  }
                  className="rounded border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>

      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Preview Slider
                </h2>

                <div className="mt-1">
                  <StatusBadge
                    active={
                      !!previewBanner.is_active
                    }
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  setPreviewBanner(null)
                }
                className="p-2 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="relative overflow-hidden rounded-xl bg-slate-900">
                {previewBanner.background_image && (
                  <img
                    src={resolveBannerImageUrl(
                      previewBanner.background_image
                    )}
                    alt={
                      previewBanner.title ||
                      'Slider'
                    }
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                <div className="relative flex min-h-[400px] items-center bg-black/35 p-8 sm:p-12">
                  <div className="max-w-2xl">
                    {previewBanner.title && (
                      <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
                        {previewBanner.title}
                      </h1>
                    )}

                    {previewBanner.buttons
                      ?.length > 0 && (
                      <div className="mt-7 flex flex-wrap gap-3">
                        {previewBanner.buttons.map(
                          (button, index) => (
                            <a
                              key={
                                button.id ||
                                index
                              }
                              href={
                                button.url ||
                                '#'
                              }
                              onClick={(e) => {
                                if (
                                  !button.url
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                            >
                              {button.label}
                            </a>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={() =>
                  setPreviewBanner(null)
                }
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>

              <button
                onClick={() => {
                  const banner =
                    previewBanner;

                  setPreviewBanner(null);

                  onEdit?.(banner);
                }}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
              >
                Edit Slider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}