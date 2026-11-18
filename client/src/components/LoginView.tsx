import { STEAM_LOGIN_URL } from '../config'

function LoginView() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-[#FBF7EC] border-[3px] border-black neo-shadow p-8 max-w-sm w-full text-center">
        <h1 className="text-4xl font-extrabold mb-2">TrophyLogger</h1>
        <p className="mb-6">Tus logros de Steam en un solo lugar.</p>
        <a
          href={STEAM_LOGIN_URL}
          className="inline-block bg-[#e9b872] px-4 py-2 border-[3px] border-black neo-shadow neo-press font-bold"
        >
          Iniciar sesión con Steam
        </a>
      </div>
    </div>
  )
}

export default LoginView
