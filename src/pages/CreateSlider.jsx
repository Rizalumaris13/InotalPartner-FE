import { useFeedback } from '../hooks/useFeedback';
import { useRef, useState } from 'react';
import {
  Image,
  Link,
  Save,
  Trash2,
  Upload,
  X,
  List,
  ShieldAlert,
} from 'lucide-react';

import {
  createBannerApi,
  getBannersApi,
  updateBannerApi,
  uploadBannerImageApi,
} from '../api/homepageBanners';

import { useAuth } from '../hooks/useAuth';
import { createSliderDraft, unwrapBannerList } from '../utils/sliders';

const EMPTY_BUTTON = {
  label: '',
  url: '',
};

export default function CreateSlider({
  editingSlider = null,
  onFinishEdit,
  onOpenList,
}) {
  const { notify, feedback } = useFeedback();
  const { role } = useAuth();

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isEditing = !!editingSlider;

  const [sourceSlider, setSourceSlider] = useState(editingSlider);
  const [draft, setDraft] = useState(() => createSliderDraft(editingSlider));
  const { title, buttons, imageUrl, imageFile, imagePreview, order } = draft;

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Record pengganti dengan ID sama juga membuang draf, tanpa melepas fokus input.
  if (sourceSlider !== editingSlider) {
    setSourceSlider(editingSlider);
    setDraft(createSliderDraft(editingSlider));
    setError('');
  }

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
            Hanya admin yang dapat membuat dan mengelola slider
            Landing Page.
          </p>
        </div>
      </div>
    );
  }

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateButton = (index, field, value) => {
    setDraft((prev) => ({
      ...prev,
      buttons: prev.buttons.map((button, i) =>
        i === index ? { ...button, [field]: value } : button
      ),
    }));
  };

  const clearButton = (index) => {
    setDraft((prev) => ({
      ...prev,
      buttons: prev.buttons.map((button, i) => i === index ? { ...EMPTY_BUTTON } : button),
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('File harus berupa gambar.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify('Ukuran gambar maksimal 5MB.', 'error');
      return;
    }

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    const preview = URL.createObjectURL(file);
    setDraft((prev) => ({ ...prev, imageFile: file, imagePreview: preview, imageUrl: '' }));
  };

  const removeImage = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setDraft((prev) => ({ ...prev, imageFile: null, imagePreview: '', imageUrl: '' }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const buildPayload = (backgroundImage) => {
    const validButtons = buttons
      .map((button, index) => ({
        label: button.label.trim(),
        url: button.url.trim(),
        description: '',
        order: index + 1,
      }))
      .filter((button) => button.label && button.url);

    return {
      title: title.trim(),
      background_image: backgroundImage || '',
      order: Number(order) || 1,
      is_active: isEditing
        ? editingSlider?.is_active ?? false
        : false,
      buttons: validButtons,
    };
  };

  const handleSubmit = async () => {
    setError('');

    // Judul, gambar, dan tombol memang boleh kosong.

    setSaving(true);

    try {
      const normalizedOrder = Number(order);

      if (!Number.isInteger(normalizedOrder) || normalizedOrder < 1) {
        throw new Error('Nomor urut slider harus berupa angka bulat minimal 1.');
      }

      // Cek lebih awal agar pengguna mendapat feedback sebelum proses upload gambar.
      const response = await getBannersApi();
      const existingBanners = unwrapBannerList(response);

      const duplicateOrder = existingBanners.find(
        (banner) =>
          Number(banner.order) === normalizedOrder &&
          Number(banner.id) !== Number(editingSlider?.id)
      );

      if (duplicateOrder) {
        throw new Error(
          `Nomor urut ${normalizedOrder} sudah digunakan oleh slider lain. Silakan pilih nomor urut lain.`
        );
      }

      let backgroundImage = imageUrl;

      if (imageFile) {
        setUploading(true);

        backgroundImage = await uploadBannerImageApi(imageFile);

        setUploading(false);

        if (!backgroundImage) {
          throw new Error(
            'Upload berhasil tetapi URL gambar tidak ditemukan dari response server.'
          );
        }
      }

      const payload = buildPayload(backgroundImage);

      if (isEditing) {
        await updateBannerApi(editingSlider.id, payload);

        notify('Slider berhasil diperbarui.');

        onFinishEdit?.();
      } else {
        await createBannerApi(payload);

        notify('Slider berhasil dibuat.');

        setDraft(createSliderDraft());

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          err.response?.data?.message ||
          'Terjadi kesalahan saat menyimpan slider.'
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {feedback}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            {isEditing ? 'Edit Slider' : 'Create Slider'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenList}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <List size={17} />
          Lihat List Slider
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error: </strong>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">

        <div className="space-y-6">

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Judul
              </h2>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => updateDraft('title', e.target.value)}
              placeholder="Contoh: Kreativitas"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-lg font-semibold outline-none transition placeholder:font-normal focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Tombol Action
              </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Kosongkan tombol yang tidak digunakan.
                </p>
            </div>

            <div className="space-y-4">
              {buttons.map((button, index) => (
                <div
                  key={index}
                  className=" p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      Tombol {index + 1}
                    </span>

                    {(button.label || button.url) && (
                      <button
                        type="button"
                        onClick={() => clearButton(index)}
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Kosongkan tombol"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Nama Tombol
                      </label>

                      <input
                        type="text"
                        value={button.label}
                        onChange={(e) =>
                          updateButton(
                            index,
                            'label',
                            e.target.value
                          )
                        }
                        placeholder="Contoh: Gabung Sekarang"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Link
                      </label>

                      <div className="relative">
                        <Link
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          value={button.url}
                          onChange={(e) =>
                            updateButton(
                              index,
                              'url',
                              e.target.value
                            )
                          }
                          placeholder="/register"
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <aside className="space-y-6">

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Image size={19} className="text-gray-500" />

              <h2 className="font-bold text-gray-900">
                Image
              </h2>
            </div>

            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Slider preview"
                  className="aspect-video w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 rounded-lg bg-white p-2 text-red-500 shadow-md transition hover:bg-red-50"
                  title="Hapus gambar"
                >
                  <Trash2 size={18} />
                </button>

                {imageFile && (
                  <div className="border-t border-gray-100 bg-white px-4 py-3">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {imageFile.name}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 transition hover:border-sky-400 hover:bg-sky-50/40"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-sky-500 shadow-sm">
                  <Upload size={24} />
                </div>

                <p className="text-sm font-semibold text-gray-700">
                  Click to upload image
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  PNG, JPG, WEBP — maksimal 5MB
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">
              Urutan Slider
            </h2>

            <input
              type="number"
              min="1"
              step="1"
              value={order}
              onChange={(e) =>
                updateDraft('order', e.target.value)
              }
              className="w-full max-w-xs rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Nomor urut harus unik. Dua slider tidak boleh menggunakan nomor urut yang sama.
            </p>
          </section>
        </aside>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || uploading}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {uploading
                ? 'Uploading...'
                : 'Saving...'}
            </>
          ) : (
            <>
              <Save size={17} />
              {isEditing
                ? 'Simpan Perubahan'
                : 'Buat Slider'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}