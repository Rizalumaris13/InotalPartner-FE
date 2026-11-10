import { getPublicAboutIntroApi } from '../api/aboutIntro'
import { DEFAULT_ABOUT_INTRO } from '../data/aboutIntro'
import usePublicContent from './usePublicContent'

export default function useAboutIntro() {
  return usePublicContent(getPublicAboutIntroApi, DEFAULT_ABOUT_INTRO)
}
