import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Pin,
  GalleryVerticalEnd,
  MessageSquare,
  Handshake,
  LayoutList,
  PanelsTopLeft,
} from 'lucide-react'
import { PAGE_BANNER_PAGES, PAGE_BANNER_ROLES } from './pageBanners'

export const navItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'operator', 'guest'],
  },
  {
    key: 'company',
    label: 'Input Company',
    icon: Building2,
    roles: ['super_admin', 'admin', 'operator'],
  },
  {
    key: 'post',
    label: 'Post',
    icon: Pin,
    roles: ['super_admin', 'admin', 'operator'],
    subItems: [
      { key: 'createPost', label: 'Create Post' },
      { key: 'listPost', label: 'List Post' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: MessageSquare,
    roles: ['super_admin', 'admin', 'operator'],
  },
  {
    key: 'slider',
    label: 'Slider',
    icon: GalleryVerticalEnd,
    roles: ['super_admin', 'admin'],
    subItems: [
      { key: 'createSlider', label: 'Create Slider' },
      { key: 'listSlider', label: 'List Slider' },
    ],
  },
  {
    key: 'partners',
    label: 'Partnership',
    icon: Handshake,
    roles: ['super_admin', 'admin'],
  },
  {
    key: 'aboutCards',
    label: 'About Cards',
    icon: LayoutList,
    roles: ['super_admin', 'admin'],
  },
  {
    key: 'users',
    label: 'Users',
    icon: Users,
    roles: ['super_admin', 'admin'],
  },
  {
    key: 'pageBanners',
    label: 'Page Banners',
    icon: PanelsTopLeft,
    roles: PAGE_BANNER_ROLES,
    subItems: PAGE_BANNER_PAGES.map((page) => ({
      key: page.navKey,
      label: page.name,
    })),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['super_admin', 'admin', 'operator', 'guest'],
  },
]
