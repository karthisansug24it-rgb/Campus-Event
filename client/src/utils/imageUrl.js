/**
 * Resolves poster image URL cleanly.
 * If URL is already absolute (http/https/data:), returns it directly.
 * If URL is relative like /uploads/..., returns /uploads/... (served by client/public or Vite proxy).
 */
export function getPosterUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : '';
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Handles image error with automatic fallback to direct backend URL before hiding
 */
export function handleImageError(e, fallbackPosterUrl) {
  const img = e.currentTarget;
  if (!img.dataset.retried && fallbackPosterUrl) {
    img.dataset.retried = 'true';
    const cleanPath = fallbackPosterUrl.startsWith('/') ? fallbackPosterUrl : `/${fallbackPosterUrl}`;
    const fallbackBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
      : 'http://localhost:5000';
    if (!img.src.includes(fallbackBase)) {
      img.src = `${fallbackBase}${cleanPath}`;
      return;
    }
  }
  img.style.display = 'none';
  if (img.nextElementSibling) {
    img.nextElementSibling.classList.remove('hidden');
    img.nextElementSibling.style.display = 'flex';
  }
}
