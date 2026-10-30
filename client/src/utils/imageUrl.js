/**
 * Resolves the backend base URL (without /api or trailing slashes)
 */
export function getBackendBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    // Strip trailing slashes and trailing /api so uploads are reached cleanly at /uploads
    return envUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }
  // When hosted on Netlify or production, default to live Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://fxec-events-backend.onrender.com';
  }
  return '';
}

/**
 * Resolves poster or upload image URL cleanly.
 * If URL is already absolute (http/https/data:), returns it directly.
 * If URL is relative like /uploads/..., prepends backend base URL in production.
 */
export function getPosterUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const base = getBackendBase();
  return base ? `${base}${cleanPath}` : cleanPath;
}

export const getUploadUrl = getPosterUrl;

/**
 * Handles image error with automatic fallback to alternate URL before hiding
 */
export function handleImageError(e, fallbackPosterUrl) {
  const img = e.currentTarget;
  if (!img.dataset.retried && fallbackPosterUrl) {
    img.dataset.retried = 'true';
    const cleanPath = fallbackPosterUrl.startsWith('/') ? fallbackPosterUrl : `/${fallbackPosterUrl}`;
    const liveBackend = 'https://fxec-events-backend.onrender.com';

    // If the image was trying a relative path, retry directly with live Render backend
    if (!img.src.includes('onrender.com')) {
      img.src = `${liveBackend}${cleanPath}`;
      return;
    }
    // If it failed with backend URL, try relative path (Netlify /uploads proxy or public)
    if (img.src.includes('onrender.com')) {
      img.src = cleanPath;
      return;
    }
  }
  img.style.display = 'none';
  if (img.nextElementSibling) {
    img.nextElementSibling.classList.remove('hidden');
    img.nextElementSibling.style.display = 'flex';
  }
}

