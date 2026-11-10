import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListVideoPage from '../src/pages/ListVideoPage'
import { getAboutVideosApi } from '../src/api/about'

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ role: 'admin', user: { role: 'admin' } }),
}))
vi.mock('../src/api/about', () => ({
  getAboutVideosApi: vi.fn(),
  deleteAboutVideoApi: vi.fn(),
  updateAboutVideoApi: vi.fn(),
  resolveImageUrl: (value) => value,
}))

beforeEach(() => vi.clearAllMocks())

describe('profile-video thumbnail compatibility', () => {
  it.each([
    ['https://youtu.be/id-one', 'id-one'],
    ['https://www.youtube.com/watch?v=id-one', 'id-one'],
    ['https://youtube.com/embed/id-one', 'id-one'],
    ['https://youtube.com/shorts/id-one', 'id-one'],
    ['https://youtube.com/live/id-one', 'id-one'],
    [' \thttps://youtu.be/id-one\n', 'id-one'],
    ['https://youtube.com.example.test/watch?v=id-one', 'id-one'],
    ['\u00a0https://youtu.be/id-one\u00a0', null],
    ['https://example.test/video', null],
    ['https://youtube.com/watch', null],
    ['', null],
  ])('preserves the stored URL rules for %j', async (videoUrl, expectedId) => {
    getAboutVideosApi.mockResolvedValue([{
      id: 1,
      title: 'Video uji',
      description: 'Deskripsi uji',
      video_url: videoUrl,
      thumbnail_url: '',
      is_active: true,
    }])
    render(<ListVideoPage />)
    await screen.findByText('Video uji')
    const thumbnail = screen.queryByRole('img', { name: 'Video uji' })
    if (expectedId) {
      expect(thumbnail?.getAttribute('src')).toBe(`https://img.youtube.com/vi/${expectedId}/hqdefault.jpg`)
    } else {
      expect(thumbnail).toBeNull()
    }
  })
})
