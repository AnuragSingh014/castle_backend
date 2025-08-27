// Simple client-side investor auth utilities using localStorage

const STORAGE_KEY = 'castle_investor'

export function setCurrentInvestor(investor) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investor))
  } catch {}
}

export function getCurrentInvestor() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearCurrentInvestor() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
