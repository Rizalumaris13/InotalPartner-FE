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
} from 'lucide-react'

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
    label: 'Kontak',
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
    label: 'Kemitraan',
    icon: Handshake,
    roles: ['super_admin', 'admin'],
  },
  {
    key: 'aboutCards',
    label: 'Kartu Tentang',
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
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['super_admin', 'admin', 'operator', 'guest'],
  },
]
