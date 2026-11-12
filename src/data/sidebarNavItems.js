import {
  LayoutDashboard, Building2, Users, Settings, Pin, House,
  MessageSquare, Info, Handshake, LayoutList, PanelsTopLeft,
} from 'lucide-react'
import { PAGE_BANNER_PAGES, PAGE_BANNER_ROLES } from './pageBanners'
import { JOIN_SECTION_NAV_GROUP } from './homepageJoinSection'
import { ABOUT_INTRO_NAV } from './aboutIntro'
import { HOMEPAGE_SERVICES_NAV } from './homepageServices'
import { ABOUT_EMPOWERING_NAV } from './aboutEmpowering'

export const navItems = [
  { key: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard, roles: ['super_admin','admin','operator','guest'] },
  { key: 'company',   label: 'Input Company', icon: Building2,       roles: ['super_admin','admin','operator'] },
  {
    key: 'post',
    label: 'Post',
    icon: Pin,
    roles: ['super_admin','admin','operator'],
    subItems: [
      { key: 'createPost', label: 'Create Post' },
      { key: 'listPost',   label: 'List Post' },
    ],
  },
  { key: 'contact',   label: 'Kontak',        icon: MessageSquare,   roles: ['super_admin','admin','operator'] },
  {
    key: 'slider',
    label: 'Home Page',
    icon: House,
    roles: ['super_admin','admin'],
    subGroups: [
      {
        key: 'homeSliderGroup',
        label: 'Slider',
        items: [
          { key: 'createSlider', label: 'Create Slider' },
          { key: 'listSlider',   label: 'List Slider' },
        ],
      },
      {
        key: 'homeTestimonialGroup',
        label: 'Testimoni',
        items: [
          { key: 'createTestimonial', label: 'Create Testimoni' },
          { key: 'listTestimonial',   label: 'List Testimoni' },
        ],
      },
      JOIN_SECTION_NAV_GROUP,
      {
        key: 'homeServicesGroup',
        label: HOMEPAGE_SERVICES_NAV.group,
        items: [
          { key: HOMEPAGE_SERVICES_NAV.key, label: HOMEPAGE_SERVICES_NAV.label },
        ],
      },
    ],
  },
  {
    key: 'about',
    label: 'About',
    icon: Info,
    roles: ['super_admin','admin'],
    subGroups: [
      {
        key: 'aboutIntroGroup',
        label: ABOUT_INTRO_NAV.group,
        items: [
          { key: ABOUT_INTRO_NAV.key, label: ABOUT_INTRO_NAV.label },
        ],
      },
      {
        key: 'aboutSettingsGroup',
        label: 'Tim Kami',
        items: [
          { key: 'createAbout', label: 'Tambah Tim Kami' },
          { key: 'listAbout',   label: 'List Tim Kami' },
        ],
      },
      {
        key: 'aboutVideoGroup',
        label: 'Video Profil',
        items: [
          { key: 'createVideo', label: 'Create Video' },
          { key: 'listVideo',   label: 'List Video' },
          { key: 'videoSetting', label: 'Deskripsi Video' },
          {
            key: 'aboutHighlightGroup',
            label: 'Poin Video',
            isSubGroup: true,
            items: [
              { key: 'createVideoHighlight', label: 'Tambah Poin Video' },
              { key: 'listVideoHighlight',   label: 'Daftar Poin Video' },
            ],
          },
        ],
      },
      {
        key: 'aboutFAQGroup',
        label: 'FAQ',
        items: [
          { key: 'createFAQ',   label: 'Create FAQ' },
          { key: 'listFAQ',     label: 'List FAQ' },
        ],
      },
    ],
  },
  {
    key: 'partners',
    label: 'Kemitraan',
    icon: Handshake,
    roles: ['super_admin', 'admin'],
  },
  {
    ...ABOUT_EMPOWERING_NAV,
    icon: LayoutList,
  },
  { key: 'users',     label: 'Users',         icon: Users,           roles: ['super_admin','admin'] },
  {
    key: 'pageBanners',
    label: 'Banner Halaman',
    icon: PanelsTopLeft,
    roles: PAGE_BANNER_ROLES,
    subItems: PAGE_BANNER_PAGES.map((page) => ({
      key: page.navKey,
      label: page.name,
    })),
  },
  { key: 'settings',  label: 'Settings',      icon: Settings,        roles: ['super_admin','admin','operator','guest'] },
]
