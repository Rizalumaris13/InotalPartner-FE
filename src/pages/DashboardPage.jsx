import React, { useState } from 'react'
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

import { useAuth } from '../hooks/useAuth'

export default function DashboardPage({ onNavigate }) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // State untuk mode edit 
  const [editingPost, setEditingPost] = useState(null)
  const [editingSlider, setEditingSlider] = useState(null)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [editingVideo, setEditingVideo] = useState(null)
  const [editingHighlight, setEditingHighlight] = useState(null)
  const [editingFAQ, setEditingFAQ] = useState(null)

  const { user } = useAuth()

  // Handler navigasi: Batalkan mode edit jika user klik menu sidebar lain
  const handleNav = (key) => { 
    setEditingPost(null);
    setEditingSlider(null);
    setEditingTestimonial(null);
    setEditingMember(null);
    setEditingVideo(null);
    setEditingHighlight(null);
    setEditingFAQ(null);
    setActiveNav(key) 
  }

  // Dipanggil dari PostList ketika tombol Edit ditekan
  const handleEditPost = (postType, post) => {
    setEditingPost({ postType, post })
    setActiveNav('createPost')
  }

  // Dipanggil dari CreatePost ketika berhasil update atau batal edit
  const finishEdit = () => { 
    setEditingPost(null); 
    setActiveNav('listPost') 
  }

  const handleEditSlider = (slider) => {
    setEditingSlider(slider)
    setActiveNav('createSlider')
  }

  const finishEditSlider = () => {
    setEditingSlider(null)
    setActiveNav('listSlider')
  }

  // Testimonial handlers
  const handleEditTestimonial = (testimonial) => {
    setEditingTestimonial(testimonial)
    setActiveNav('createTestimonial')
  }

  const finishEditTestimonial = () => {
    setEditingTestimonial(null)
    setActiveNav('listTestimonial')
  }

  // About member handlers
  const handleEditMember = (member) => {
    setEditingMember(member)
    setActiveNav('formAboutMember')
  }

  const finishEditMember = () => {
    setEditingMember(null)
    setActiveNav('listAbout')
  }

  // Video handlers
  const handleEditVideo = (video) => {
    setEditingVideo(video)
    setActiveNav('createVideo')
  }

  const finishEditVideo = () => {
    setEditingVideo(null)
    setActiveNav('listVideo')
  }

  // Highlight handlers
  const handleEditHighlight = (highlight) => {
    setEditingHighlight(highlight)
    setActiveNav('createVideoHighlight')
  }

  const finishEditHighlight = () => {
    setEditingHighlight(null)
    setActiveNav('listVideoHighlight')
  }

  // FAQ handlers
  const handleEditFAQ = (faq) => {
    setEditingFAQ(faq)
    setActiveNav('createFAQ')
  }

  const finishEditFAQ = () => {
    setEditingFAQ(null)
    setActiveNav('listFAQ')
  }

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
        return <PostList onEdit={handleEditPost} />

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
            onOpenList={() => {
              setEditingSlider(null)
              setActiveNav('listSlider')
            }}
          />
        )

      case 'listSlider':
        return (
          <ListSliderPage
            onEdit={handleEditSlider}
          />
        )

      case 'createTestimonial':
        return (
          <FormTestimonialPage
            key={editingTestimonial ? `edit-testi-${editingTestimonial.id}` : 'new-testi'}
            editingTestimonial={editingTestimonial}
            onFinish={finishEditTestimonial}
            onOpenList={() => {
              setEditingTestimonial(null)
              setActiveNav('listTestimonial')
            }}
          />
        )

      case 'listTestimonial':
        return (
          <ListTestimonialPage
            onAddNew={() => {
              setEditingTestimonial(null)
              setActiveNav('createTestimonial')
            }}
            onEdit={handleEditTestimonial}
          />
        )

      case 'createAbout':
        return (
          <CreateAboutPage
            onFinishEdit={finishEditMember}
            onCancelEdit={() => setEditingMember(null)}
            onAddNew={() => {
              setEditingMember(null)
              setActiveNav('formAboutMember')
            }}
            onEdit={handleEditMember}
            onOpenList={() => setActiveNav('listAbout')}
          />
        )

      case 'listAbout':
        return (
          <ListAboutPage
            onAddNew={() => {
              setEditingMember(null)
              setActiveNav('formAboutMember')
            }}
            onEdit={handleEditMember}
          />
        )

      case 'formAboutMember':
        return (
          <FormTeamMemberPage
            key={editingMember ? `edit-member-${editingMember.id}` : 'new-member'}
            editingMember={editingMember}
            onFinish={finishEditMember}
            onOpenList={() => {
              setEditingMember(null)
              setActiveNav('listAbout')
            }}
          />
        )

      case 'createVideo':
        return (
          <FormVideoPage
            key={editingVideo ? `edit-video-${editingVideo.id}` : 'new-video'}
            editingVideo={editingVideo}
            onFinish={finishEditVideo}
            onOpenList={() => {
              setEditingVideo(null)
              setActiveNav('listVideo')
            }}
          />
        )

      case 'listVideo':
        return (
          <ListVideoPage
            onAddNew={() => {
              setEditingVideo(null)
              setActiveNav('createVideo')
            }}
            onEdit={handleEditVideo}
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
            onOpenList={() => {
              setEditingHighlight(null)
              setActiveNav('listVideoHighlight')
            }}
          />
        )

      case 'listVideoHighlight':
        return (
          <ListVideoHighlightPage
            onAddNew={() => {
              setEditingHighlight(null)
              setActiveNav('createVideoHighlight')
            }}
            onEdit={handleEditHighlight}
          />
        )

      case 'createFAQ':
        return (
          <FormFAQPage
            key={editingFAQ ? `edit-faq-${editingFAQ.id}` : 'new-faq'}
            editingFAQ={editingFAQ}
            onFinish={finishEditFAQ}
            onOpenList={() => {
              setEditingFAQ(null)
              setActiveNav('listFAQ')
            }}
          />
        )

      case 'listFAQ':
        return (
          <ListFAQPage
            onAddNew={() => {
              setEditingFAQ(null)
              setActiveNav('createFAQ')
            }}
            onEdit={handleEditFAQ}
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
        setActiveNav={handleNav} // Gunakan handleNav di sini
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