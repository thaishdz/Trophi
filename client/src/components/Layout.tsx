import { ReactNode } from 'react'
import Sidebar from './Sidebar'

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pt-14 sm:pt-0 sm:ml-[72px] min-h-screen px-4 py-6 sm:px-10 sm:py-10">
        {children}
      </main>
    </div>
  )
}

export default Layout
