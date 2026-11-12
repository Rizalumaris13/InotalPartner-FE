import { getPublicAboutEmpoweringApi } from '../api/aboutEmpowering'
import { DEFAULT_ABOUT_EMPOWERING } from '../data/aboutEmpowering'
import usePublicContent from './usePublicContent'

export default function useAboutEmpowering() {
  return usePublicContent(getPublicAboutEmpoweringApi, DEFAULT_ABOUT_EMPOWERING)
}
