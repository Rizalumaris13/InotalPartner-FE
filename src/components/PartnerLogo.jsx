import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { resolveImageUrl } from '../api/posts'
import { isLogoUrl } from '../utils/partners'

export default function PartnerLogo({
  name,
  url,
  compact = false,
  decorative = false,
}) {
  const value = typeof url === 'string' ? url.trim() : ''
  const source = isLogoUrl(value) ? resolveImageUrl(value) : ''
  const [failedSource, setFailedSource] = useState('')

  return source && failedSource !== source ? (
    <img
      src={source}
      alt={decorative ? '' : `Logo ${name}`}
      aria-hidden={decorative || undefined}
      onError={() => setFailedSource(source)}
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center break-words text-center text-xs font-semibold text-gray-500">
      {compact ? (
        <Building2 size={22} className="text-sky-500" />
      ) : (
        name || 'Nama Mitra'
      )}
    </span>
  )
}
