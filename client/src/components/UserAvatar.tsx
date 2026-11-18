import { useSession } from '../hooks/useSession'

type Props = {
  size?: 'sm' | 'lg'
}

// Steam avatar, or the user's initial when there is none
export function Avatar({ size = 'sm' }: Props) {
  const { data: user } = useSession()
  const dimensions = size === 'lg' ? 'w-28 h-28 text-5xl' : 'w-12 h-12 text-lg'

  if (user?.avatar) {
    return <img src={user.avatar} alt="" className={`${dimensions} rounded-full object-cover`} />
  }
  return (
    <span aria-hidden="true" className={`${dimensions} grid place-items-center rounded-full bg-raised font-display font-semibold`}>
      {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
    </span>
  )
}

// Top-right shortcut to the profile
function UserAvatar() {
  return (
    <a
      href="/profile"
      aria-label="Perfil"
      className="shrink-0 rounded-full border border-[var(--p-line,var(--color-line))] transition hover:border-[var(--p-accent,var(--color-gold))]"
    >
      <Avatar />
    </a>
  )
}

export default UserAvatar
