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
import KontakInboxPage from './KontakInboxPage'
import KemitraanPage from './KemitraanPage'
import KartuTentangPage from './KartuTentangPage'


import { useAuth } from '../hooks/useAuth'

export default function DashboardPage({ onNavigate }) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // State untuk mode edit 
  const [editingPost, setEditingPost] = useState(null)
  const [editingSlider, setEditingSlider] = useState(null)

  const { user } = useAuth()

  // Handler navigasi: Batalkan mode edit jika user klik menu sidebar lain
  const handleNav = (key) => { 
    setEditingPost(null);
    setEditingSlider(null);
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