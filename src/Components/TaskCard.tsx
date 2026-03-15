import type { Task } from '../Interfaces'

interface TaskCardProps {
  task: Task
  isDisabled?: boolean
  showActions?: boolean
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const statusClasses: Record<Task['status'], string> = {
  Bekliyor: 'bg-amber-100 text-amber-800',
  'Devam Ediyor': 'bg-blue-100 text-blue-800',
  Tamamlandi: 'bg-emerald-100 text-emerald-800',
}

export function TaskCard({
  task,
  isDisabled = false,
  showActions = true,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const actionsDisabled = isDisabled || !onEdit || !onDelete

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[task.status]}`}>
          {task.status}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{task.description || 'Aciklama yok.'}</p>

      <p className="mt-3 text-xs text-slate-500">Son guncelleme: {task.updatedAt}</p>

      {showActions && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onEdit?.(task)}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            Guncelle
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onDelete?.(task.id)}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            Sil
          </button>
        </div>
      )}
    </article>
  )
}
