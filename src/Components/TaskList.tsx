import type { Task } from '../Interfaces'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
  isDisabled?: boolean
  showActions?: boolean
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export function TaskList({
  tasks,
  emptyMessage = 'Henuz gorev eklenmedi.',
  isDisabled = false,
  showActions = true,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isDisabled={isDisabled}
          showActions={showActions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
