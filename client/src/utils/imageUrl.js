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
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Handles image error with automatic fallback to direct backend URL before hiding
 */
export function handleImageError(e, fallbackPosterUrl) {
  const img = e.currentTarget;
  if (!img.dataset.retried && fallbackPosterUrl) {
    img.dataset.retried = 'true';
    const cleanPath = fallbackPosterUrl.startsWith('/') ? fallbackPosterUrl : `/${fallbackPosterUrl}`;
    if (!img.src.includes(':5000')) {
      img.src = `http://localhost:5000${cleanPath}`;
      return;
    }
  }
  img.style.display = 'none';
  if (img.nextElementSibling) {
    img.nextElementSibling.classList.remove('hidden');
    img.nextElementSibling.style.display = 'flex';
  }
}
