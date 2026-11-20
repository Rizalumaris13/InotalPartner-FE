// Admin retains its legacy includes/slice rules; public pages validate differently.
function readYouTubeId(parsed) {
  if (parsed.hostname.includes('youtu.be')) {
    return parsed.pathname.slice(1).split('/')[0]
  }
  if (parsed.hostname.includes('youtube.com')) {
    if (parsed.pathname.startsWith('/watch')) return parsed.searchParams.get('v')
    if (
      parsed.pathname.startsWith('/embed/') ||
      parsed.pathname.startsWith('/shorts/') ||
      parsed.pathname.startsWith('/live/')
    ) {
      return parsed.pathname.split('/')[2]
    }
  }
  return null
}

export function extractYouTubeId(input) {
  if (!input) return null
  try {
    return readYouTubeId(new URL(input.trim()))
  } catch {
    // Input can be an unfinished URL while the user is typing.
    return null
  }
}

export function getYouTubeThumbnail(input) {
  if (!input) return null
  try {
    // Stored list URLs are parsed as received, unlike trimmed form drafts.
    const videoId = readYouTubeId(new URL(input))
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  } catch {
    return null
  }
}
