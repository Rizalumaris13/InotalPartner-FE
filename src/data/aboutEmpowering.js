import schema from '../contracts/aboutEmpowering.schema.json'

export const DEFAULT_ABOUT_EMPOWERING = Object.freeze({ ...schema.default })
export const ABOUT_EMPOWERING_RULES = schema.properties
export const ABOUT_EMPOWERING_FIELDS = schema.required
export const ABOUT_EMPOWERING_ROLES = schema['x-http'].roles
export const ABOUT_EMPOWERING_LABELS = {
  label: 'Label kecil',
  title: 'Judul utama',
  title_accent: 'Judul aksen (warna biru)',
}
export const ABOUT_EMPOWERING_NAV = {
  key: 'aboutEmpoweringGroup',
  label: 'Memberdayakan Bisnis',
  roles: ABOUT_EMPOWERING_ROLES,
  subItems: [
    { key: 'aboutEmpowering', label: 'Pengaturan Bagian' },
    { key: 'aboutCards', label: 'Kelola Kartu' },
  ],
}
