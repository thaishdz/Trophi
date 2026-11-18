import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import UserAvatar from './UserAvatar'

function Layout({ children }: { children: ReactNode }) {
  // The profile page already shows the avatar, so the shortcut would point at itself
  const onProfile = window.location.pathname.startsWith('/profile')
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pt-20 sm:pt-12 sm:ml-[72px] min-h-screen px-4 pb-10 sm:px-10 sm:pb-14">
        {!onProfile && (
          <div className="mb-6 flex justify-end sm:mb-8">
            <UserAvatar />
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export default Layout
