// Data contoh dari beranda lama, bukan klaim kemitraan resmi.
// Ganti dengan data resmi melalui dashboard setelah API kemitraan tersedia.
// Fallback ini hanya dipakai saat endpoint publik mengembalikan 404.
const legacyPartnerNames = [
  'Kementerian Kominfo',
  'Kementerian BUMN',
  'RSUP Fatmawati',
  'RS Siloam Group',
  'Telkom Indonesia',
  'Bank BRI',
  'Pertamina',
  'PLN',
  'Bulog',
  'Kemenkes RI',
  'Gojek',
  'Tokopedia',
  'Traveloka',
  'OVO',
  'Dana',
  'Shopee',
  'Blibli',
  'Lazada',
]

export const legacyPartners = legacyPartnerNames.map((name, index) => ({
  id: `legacy-${index}`,
  name,
  logo_url: '',
  website_url: '',
  sort_order: index,
  is_active: true,
}))
