import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import MonthlyActivityChart from '../components/MonthlyActivityChart'
import ServiceDistributionChart from '../components/ServiceDistributionChart'
import ActivePartnersList from '../components/ActivePartnersList'
import CollaborationProjectsList from '../components/CollaborationProjectsList'
import PlaceholderPage from '../components/PlaceholderPage'
import ChangePasswordPage from './ChangePasswordPage'
import UserPage from './UserPage'
import CreatePost from './CreatePost'
import PostList from './PostListPage'
import CreateSlider from './CreateSlider'
import ListSliderPage from './ListSliderPage'
import FormTestimonialPage from './FormTestimonialPage'
import ListTestimonialPage from './ListTestimonialPage'
import CreateAboutPage from './CreateAboutPage'
import ListAboutPage from './ListAboutPage'
import FormTeamMemberPage from './FormTeamMemberPage'
import FormVideoPage from './FormVideoPage'
import ListVideoPage from './ListVideoPage'
import FormFAQPage from './FormFAQPage'
import ListFAQPage from './ListFAQPage'
import FormVideoSettingPage from './FormVideoSettingPage'
import FormVideoHighlightPage from './FormVideoHighlightPage'
import ListVideoHighlightPage from './ListVideoHighlightPage'
import KontakInboxPage from './KontakInboxPage'
import KemitraanPage from './KemitraanPage'
import KartuTentangPage from './KartuTentangPage'
import AboutIntroPage from './AboutIntroPage'
import PageBannerPage from './PageBannerPage'
import HomepageJoinImagesPage from './HomepageJoinImagesPage'
import HomepageJoinCardsPage from './HomepageJoinCardsPage'
import HomepageServicesPage from './HomepageServicesPage'
import { PAGE_BANNER_PAGES } from '../data/pageBanners'

import { useAuth } from '../hooks/useAuth'

const EDITOR_ROUTES = {
  post: { form: 'createPost', list: 'listPost' },
  slider: { form: 'createSlider', list: 'listSlider' },
  testimonial: { form: 'createTestimonial', list: 'listTestimonial' },
  member: { form: 'formAboutMember', list: 'listAbout' },
  video: { form: 'createVideo', list: 'listVideo' },
  highlight: { form: 'createVideoHighlight', list: 'listVideoHighlight' },
  faq: { form: 'createFAQ', list: 'listFAQ' },
}
const EMPTY_EDITING = Object.fromEntries(Object.keys(EDITOR_ROUTES).map((kind) => [kind, null]))

export default function DashboardPage({ onNavigate }) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editing, setEditing] = useState(EMPTY_EDITING)
  const {
    post: editingPost,
    slider: editingSlider,
    testimonial: editingTestimonial,
    member: editingMember,
    video: editingVideo,
    highlight: editingHighlight,
    faq: editingFAQ,
  } = editing
  const { user } = useAuth()

  const handleNav = (key) => {
    setEditing(EMPTY_EDITING)
    setActiveNav(key)
  }

  const selectRecord = (kind, value) => {
    setEditing((current) => (
      Object.is(current[kind], value) ? current : { ...current, [kind]: value }
    ))
  }

  const beginEdit = (kind, value) => {
    selectRecord(kind, value)
    setActiveNav(EDITOR_ROUTES[kind].form)
  }

  const finishEditing = (kind) => {
    selectRecord(kind, null)
    setActiveNav(EDITOR_ROUTES[kind].list)
  }

  const finishEdit = () => finishEditing('post')
  const finishEditSlider = () => finishEditing('slider')
  const finishEditTestimonial = () => finishEditing('testimonial')
  const finishEditMember = () => finishEditing('member')
  const finishEditVideo = () => finishEditing('video')
  const finishEditHighlight = () => finishEditing('highlight')
  const finishEditFAQ = () => finishEditing('faq')
  const handleEditMember = (member) => beginEdit('member', member)
  const addMember = () => beginEdit('member', null)

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-gray-400 mt-0.5">Monitor partnership activities and ongoing projects.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mb-5">
              <MonthlyActivityChart />
              <ServiceDistributionChart />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <ActivePartnersList />
              <CollaborationProjectsList />
            </div>
          </>
        )
      case 'changePassword':
        return <ChangePasswordPage />
      case 'users':
        return <UserPage />

      case 'contact':
        return <KontakInboxPage />

      case 'partners':
        return <KemitraanPage role={user?.role} />

      case 'aboutCards':
        return <KartuTentangPage role={user?.role} />

      case 'aboutIntro':
        return <AboutIntroPage role={user?.role} />

      case 'bannerTentang':
      case 'bannerEvent':
      case 'bannerBerita':
      case 'bannerArtikel':
      case 'bannerKontak':
        return (
          <PageBannerPage
            key={activeNav}
            pageKey={PAGE_BANNER_PAGES.find((page) => page.navKey === activeNav)?.key}
            role={user?.role}
          />
        )
        
      case 'createPost':
        return (
          <CreatePost
            // Key memaksa form direset setiap kali beralih antar post yang diedit atau ke post baru
            key={editingPost ? `edit-${editingPost.post.id}` : 'new'}
            editingPost={editingPost}
            onFinishEdit={finishEdit}
          />
        )
        
      case 'listPost':
        return <PostList onEdit={(postType, post) => beginEdit('post', { postType, post })} />

      case 'homeJoinImages':
        return <HomepageJoinImagesPage role={user?.role} />

      case 'homeJoinCards':
        return <HomepageJoinCardsPage role={user?.role} />

      case 'homeServices':
        return <HomepageServicesPage role={user?.role} />

      case 'createSlider':
        return (
          <CreateSlider
            key={
              editingSlider
                ? `edit-slider-${editingSlider.id}`
                : 'new-slider'
            }
            editingSlider={editingSlider}
            onFinishEdit={finishEditSlider}
            onOpenList={finishEditSlider}
          />
        )

      case 'listSlider':
        return (
          <ListSliderPage
            onEdit={(slider) => beginEdit('slider', slider)}
          />
        )

      case 'createTestimonial':
        return (
          <FormTestimonialPage
            key={editingTestimonial ? `edit-testi-${editingTestimonial.id}` : 'new-testi'}
            editingTestimonial={editingTestimonial}
            onFinish={finishEditTestimonial}
            onOpenList={finishEditTestimonial}
          />
        )

      case 'listTestimonial':
        return (
          <ListTestimonialPage
            onAddNew={() => beginEdit('testimonial', null)}
            onEdit={(testimonial) => beginEdit('testimonial', testimonial)}
          />
        )

      case 'createAbout':
        return (
          <CreateAboutPage
            onFinishEdit={finishEditMember}
            onCancelEdit={() => selectRecord('member', null)}
            onAddNew={addMember}
            onEdit={handleEditMember}
            onOpenList={() => setActiveNav('listAbout')}
          />
        )

      case 'listAbout':
        return (
          <ListAboutPage
            onAddNew={addMember}
            onEdit={handleEditMember}
          />
        )

      case 'formAboutMember':
        return (
          <FormTeamMemberPage
            key={editingMember ? `edit-member-${editingMember.id}` : 'new-member'}
            editingMember={editingMember}
            onFinish={finishEditMember}
            onOpenList={finishEditMember}
          />
        )

      case 'createVideo':
        return (
          <FormVideoPage
            key={editingVideo ? `edit-video-${editingVideo.id}` : 'new-video'}
            editingVideo={editingVideo}
            onFinish={finishEditVideo}
            onOpenList={finishEditVideo}
          />
        )

      case 'listVideo':
        return (
          <ListVideoPage
            onAddNew={() => beginEdit('video', null)}
            onEdit={(video) => beginEdit('video', video)}
          />
        )

      case 'videoSetting':
        return <FormVideoSettingPage />

      case 'createVideoHighlight':
        return (
          <FormVideoHighlightPage
            key={editingHighlight ? 'edit-highlight-' + editingHighlight.id : 'new-highlight'}
            editingHighlight={editingHighlight}
            onFinish={finishEditHighlight}
            onOpenList={finishEditHighlight}
          />
        )

      case 'listVideoHighlight':
        return (
          <ListVideoHighlightPage
            onAddNew={() => beginEdit('highlight', null)}
            onEdit={(highlight) => beginEdit('highlight', highlight)}
          />
        )

      case 'createFAQ':
        return (
          <FormFAQPage
            key={editingFAQ ? `edit-faq-${editingFAQ.id}` : 'new-faq'}
            editingFAQ={editingFAQ}
            onFinish={finishEditFAQ}
            onOpenList={finishEditFAQ}
          />
        )

      case 'listFAQ':
        return (
          <ListFAQPage
            onAddNew={() => beginEdit('faq', null)}
            onEdit={(faq) => beginEdit('faq', faq)}
          />
        )

      default:
        return <PlaceholderPage activeNav={activeNav} />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      <Sidebar 
        user={user} 
        activeNav={activeNav} 
        setActiveNav={handleNav}
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        onNavigate={onNavigate} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar 
          activeNav={activeNav} 
          setSidebarOpen={setSidebarOpen} 
        />

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}