// ============================================================
// Sincronização de sessão entre abas do mesmo navegador
//
// Cookies de sessão já são compartilhados entre abas (mesmo perfil
// de navegador), mas uma aba já carregada não sabe que outra aba
// fez login ou logout até navegar de novo. Isto avisa todas as abas
// abertas imediatamente via localStorage, para que acompanhem juntas.
// ============================================================

const LOGOUT_EVENT_KEY = 'xd_logout_broadcast'
const LOGIN_EVENT_KEY = 'xd_login_broadcast'

export function broadcastLogout(): void {
  broadcast(LOGOUT_EVENT_KEY)
}

export function onLogoutBroadcast(callback: () => void): () => void {
  return onBroadcast(LOGOUT_EVENT_KEY, callback)
}

export function broadcastLogin(): void {
  broadcast(LOGIN_EVENT_KEY)
}

export function onLoginBroadcast(callback: () => void): () => void {
  return onBroadcast(LOGIN_EVENT_KEY, callback)
}

function broadcast(key: string): void {
  try {
    localStorage.setItem(key, String(Date.now()))
  } catch {
    // localStorage indisponível (modo privado etc.) — ignora
  }
}

function onBroadcast(key: string, callback: () => void): () => void {
  function handler(e: StorageEvent) {
    if (e.key === key) callback()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
