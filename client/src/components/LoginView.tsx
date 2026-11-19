import { STEAM_LOGIN_URL } from '../config'

function LoginView() {
  return (
    <main className="relative isolate min-h-screen grid place-items-center overflow-hidden px-4 py-16">
      {/* Soft light from above, like a projector beam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[75vh] bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.3),transparent_65%)]"
      />
      <div className="max-w-4xl text-center">
        <h1 className="font-display text-6xl sm:text-9xl font-bold tracking-tight leading-[0.9]">Trophi</h1>
        <p className="mt-6 text-lg text-ink-text/80">Tus logros de Steam en un solo lugar.</p>
        <a
          href={STEAM_LOGIN_URL}
          className="mt-10 inline-block rounded-md bg-ink-text px-6 py-3 font-semibold text-gold transition hover:brightness-110"
        >
          Iniciar sesión con Steam
        </a>
      </div>
    </main>
  )
}

export default LoginView
