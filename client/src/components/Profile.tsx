import { Avatar } from './UserAvatar'
import { useSession } from '../hooks/useSession'

// Placeholder: only the name and photo for now
function Profile() {
  const { data: user } = useSession()

  return (
    <div className="flex flex-col items-center gap-5 pt-10 sm:pt-20 text-center text-text">
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-ink-text" />
      <Avatar size="lg" />
      <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight">{user?.displayName}</h1>
    </div>
  )
}

export default Profile
