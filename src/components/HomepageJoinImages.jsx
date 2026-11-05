import { useEffect, useState } from 'react'
import { getPublicJoinImagesApi } from '../api/homepageJoinImages'
import { resolveImageUrl } from '../api/posts'
import { DEFAULT_JOIN_IMAGES, JOIN_IMAGE_SLOTS } from '../data/homepageJoinImages'

const photoClasses = {
  top_left_url: 'absolute top-0 left-0 w-2/3 aspect-square object-cover shadow-lg -rotate-6 transition-transform duration-500 hover:scale-105 hover:z-30 cursor-pointer',
  bottom_right_url: 'absolute bottom-0 right-0 w-2/3 aspect-square object-cover shadow-lg rotate-6 transition-transform duration-500 hover:scale-105 hover:z-30 cursor-pointer',
  center_url: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] aspect-[4/3] object-cover shadow-2xl z-20 transition-transform duration-500 hover:scale-105 cursor-pointer',
}

export function JoinImageCollage({ images = DEFAULT_JOIN_IMAGES }) {
  return (
    <div role="group" aria-label="Foto kolase Mengapa Bergabung" className="relative w-full max-w-[320px] h-[340px]">
      {JOIN_IMAGE_SLOTS.map((slot) => (
        <img key={slot.key} src={resolveImageUrl(images[slot.key])} alt={slot.alt} className={photoClasses[slot.key]} />
      ))}
    </div>
  )
}

export default function HomepageJoinImages() {
  const [images, setImages] = useState(DEFAULT_JOIN_IMAGES)

  useEffect(() => {
    const controller = new AbortController()
    getPublicJoinImagesApi({ signal: controller.signal })
      .then((record) => {
        if (!controller.signal.aborted) setImages(record || DEFAULT_JOIN_IMAGES)
      })
      .catch(() => {
        // Gambar lama tetap tampil ketika resource belum tersedia atau gagal dimuat.
        if (!controller.signal.aborted) setImages(DEFAULT_JOIN_IMAGES)
      })
    return () => controller.abort()
  }, [])

  return <JoinImageCollage images={images} />
}
