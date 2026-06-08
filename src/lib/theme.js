const THEME_KEY = 'pko_theme'
const THEMES = ['amber', 'light', 'mega']

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'light' } catch { return 'light' }
}

export function setTheme(t) {
  if (!THEMES.includes(t)) return
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem(THEME_KEY, t) } catch {}
}

export function initTheme() {
  setTheme(getTheme())
}

export { THEMES }
