type GameStatusTabsProps = {
  activeStatus: string;
  onStatusChange: (status: string) => void;
};

function GameStatusTabs({ activeStatus, onStatusChange }: GameStatusTabsProps) {
  const statusList = ['All', 'Tracked', 'In Progress', 'Completed', 'Not Started']
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-text/30">
      {statusList.map((status) => {
        const active = status === activeStatus
        return (
          <button
            key={status}
            aria-pressed={active}
            className={`-mb-px pb-3 text-sm font-medium border-b-2 cursor-pointer transition-colors ${
              active
                ? 'border-ink-text text-ink-text'
                : 'border-transparent text-ink-text/65 hover:text-ink-text'
            }`}
            onClick={() => onStatusChange(status)}
          >
            {status}
          </button>
        )
      })}
    </div>
  )
}


export default GameStatusTabs
