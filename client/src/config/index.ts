const API_URL = import.meta.env.VITE_API_URL // solo sirve si .env está en la raíz del directorio

// /auth lives at the server root, not under /api/v1
const STEAM_LOGIN_URL = new URL('/auth/steam', API_URL).href

export { API_URL, STEAM_LOGIN_URL }
