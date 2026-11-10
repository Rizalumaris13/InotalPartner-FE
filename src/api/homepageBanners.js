import api from './axios';

const API_BASE_URL = 'http://localhost:8080/api';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

// GET semua banner (Admin)
export const getBannersApi = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/homepage/banners`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Gagal mengambil data slider.'), { cause: error });
  }
};

// GET banner aktif untuk Landing Page (Public, tanpa auth)
export const getPublicBannersApi = async () => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/public/homepage/banners`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'Gagal mengambil slider Landing Page.'),
      { cause: error }
    );
  }
};

// Upload image
export const uploadBannerImageApi = async (file) => {
  try {
    const formData = new FormData();

    formData.append('image', file);

    const response = await api.post(
      `${API_BASE_URL}/uploads/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );


    const data = response.data;

    if (typeof data === 'string') {
      return data;
    }

    return (
      data?.url ||
      data?.image_url ||
      data?.path ||
      data?.data?.url ||
      data?.data?.image_url ||
      data?.data?.path ||
      ''
    );
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Gagal mengupload gambar.'), { cause: error });
  }
};

// CREATE banner
export const createBannerApi = async (payload) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/homepage/banners`,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Gagal membuat slider.'), { cause: error });
  }
};

// UPDATE banner
export const updateBannerApi = async (id, payload) => {
  try {
    const response = await api.put(
      `${API_BASE_URL}/homepage/banners/${id}`,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Gagal mengubah slider.'), { cause: error });
  }
};

// DELETE / TAKE DOWN banner
export const deleteBannerApi = async (id) => {
  try {
    const response = await api.delete(
      `${API_BASE_URL}/homepage/banners/${id}`
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Gagal menurunkan slider.'), { cause: error });
  }
};

// Membuat URL gambar yang bisa ditampilkan browser
export const resolveBannerImageUrl = (url) => {
  if (!url) return '';

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `http://localhost:8080${url}`;
  }

  return `http://localhost:8080/${url}`;
};