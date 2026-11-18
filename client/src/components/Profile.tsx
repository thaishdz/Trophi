import { Avatar } from './UserAvatar'
import { useSession } from '../hooks/useSession'
import { useSearchHistory } from '../lib/searchHistory'
import TintedPage from './TintedPage'

// Placeholder: only the name and photo for now
function Profile() {
  const { data: user } = useSession()
  const current = useSearchHistory()[0]

  return (
    <TintedPage game={current?.game}>
      <div className="flex flex-col items-center gap-5 pt-10 sm:pt-20 text-center">
        <Avatar size="lg" />
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight">{user?.displayName}</h1>
      </div>
    </TintedPage>
  )
}

export default Profile
