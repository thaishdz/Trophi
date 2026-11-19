import { ReactNode } from 'react'

type NavItemProps = {
  href: string
  label: string
  active: boolean
  children: ReactNode
}

function NavItem({ href, label, active, children }: NavItemProps) {
  return (
    <a
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`relative w-11 h-11 flex items-center justify-center rounded-lg transition-colors ${
        active ? 'text-text' : 'text-muted hover:text-text hover:bg-raised'
      }`}
    >
      {/* Active indicator: amber bar on the rail edge (bottom edge in the top bar) */}
      {active && (
        <span className="absolute bg-gold rounded-r sm:left-[-14px] sm:top-0.5 sm:w-1 sm:h-10 max-sm:inset-x-1 max-sm:bottom-[-6px] max-sm:h-1 max-sm:rounded-t" />
      )}
      {children}
    </a>
  )
}

// Slim rail on the left with the items centered and spaced out (there are only two); on small screens it becomes a top bar
function Sidebar() {
  const path = window.location.pathname
  const inLibrary = path.startsWith('/library')
  const inProfile = path.startsWith('/profile')

  return (
    <nav
      aria-label="Principal"
      className="fixed z-40 inset-x-0 top-0 h-14 sm:inset-y-0 sm:right-auto sm:h-auto sm:w-[72px] bg-panel border-b sm:border-b-0 sm:border-r border-line flex flex-row sm:flex-col items-center justify-center gap-8 sm:gap-10"
    >
      <NavItem href="/dashboard" label="Dashboard" active={!inLibrary && !inProfile}>
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </NavItem>

      <NavItem href="/library" label="Biblioteca" active={inLibrary}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M9.5 12a2 2 0 0 0-0.59-1.42l-1.5-1.5A2 2 0 0 06 8.5H1.5A1.5 1.5 0 0 00 10v4a1.5 1.5 0 0 01.5 1.5H6a2 2 0 0 01.41-0.59l1.5-1.5A2 2 0 0 09.5 12Z" />
          <path d="M22.5 8.5H18a2 2 0 0 0-1.41 0.58l-1.5 1.5a2 2 0 0 00 2.83l1.5 1.5a2 2 0 0 01.41 0.59h4.5A1.5 1.5 0 0 024 14v-4a1.5 1.5 0 0 0-1.5-1.5Z" />
          <path d="M13.41 15.08a2 2 0 0 0-2.82 0l-1.5 1.5A2 2 0 0 08.5 18v4.5A1.5 1.5 0 0 010 24h4a1.5 1.5 0 0 01.5-1.5V18a2 2 0 0 0-0.59-1.42Z" />
          <path d="M10.59 8.91a2 2 0 0 0 2.82 0l1.51 -1.5A2 2 0 0 015.5 6V1.5A1.5 1.5 0 0 014 0h-4a1.5 1.5 0 0 0-1.5 1.5V6a2 2 0 0 0 0.59 1.41Z" />
        </svg>
      </NavItem>
    </nav>
  )
}

export default Sidebar
