import { useMemo, useState } from 'react'
import { TaskForm } from './TaskForm'
import { TaskList } from './TaskList'
import type { Task, TaskFormValues } from '../Interfaces'

const EMPTY_FORM: TaskFormValues = {
  title: '',
  description: '',
  status: 'Bekliyor',
}

interface TaskSectionProps {
  title: string
  description: string
  tasks: Task[]
  emptyMessage: string
  isBusy?: boolean
  errorMessage?: string | null
  onCreate: (values: TaskFormValues) => Promise<boolean>
  onUpdate: (taskId: string, values: TaskFormValues) => Promise<boolean>
  onDelete: (taskId: string) => Promise<boolean>
}

export function TaskSection({
  title,
  description,
  tasks,
  emptyMessage,
  isBusy = false,
  errorMessage = null,
  onCreate,
  onUpdate,
  onDelete,
}: TaskSectionProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formInitialValues, setFormInitialValues] = useState<TaskFormValues>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sectionSummary = useMemo(() => {
    const completedCount = tasks.filter((task) => task.status === 'Tamamlandi').length
    return {
      total: tasks.length,
      completed: completedCount,
      pending: tasks.length - completedCount,
    }
  }, [tasks])

  const isFormBusy = isBusy || isSubmitting

  const resetForm = () => {
    setEditingTaskId(null)
    setFormInitialValues(EMPTY_FORM)
  }

  const handleSaveTask = async (values: TaskFormValues) => {
    if (isFormBusy) {
      return
    }

    setIsSubmitting(true)
    const operationSucceeded = editingTaskId
      ? await onUpdate(editingTaskId, values)
      : await onCreate(values)

    if (operationSucceeded) {
      resetForm()
    }
    setIsSubmitting(false)
  }

  const handleEditTask = (task: Task) => {
    if (isFormBusy) {
      return
    }

    setEditingTaskId(task.id)
    setFormInitialValues({
      title: task.title,
      description: task.description,
      status: task.status,
    })
  }

  const handleDeleteTask = async (taskId: string) => {
    if (isFormBusy) {
      return
    }

    setIsSubmitting(true)
    const operationSucceeded = await onDelete(taskId)

    if (operationSucceeded && editingTaskId === taskId) {
      resetForm()
    }
    setIsSubmitting(false)
  }

  return (
    <section className="space-y-4 rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
      <header className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Toplam</p>
            <p className="text-sm font-semibold text-slate-900">{sectionSummary.total}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Tamam</p>
            <p className="text-sm font-semibold text-emerald-600">{sectionSummary.completed}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Bekliyor</p>
            <p className="text-sm font-semibold text-amber-600">{sectionSummary.pending}</p>
          </div>
        </div>
      </header>

      {errorMessage && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      {isBusy && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Veri yukleniyor...
        </p>
      )}

      <TaskForm
        initialValues={formInitialValues}
        isEditing={Boolean(editingTaskId)}
        isSubmitting={isFormBusy}
        onSubmit={handleSaveTask}
        onCancelEdit={resetForm}
      />

      <TaskList
        tasks={tasks}
        emptyMessage={emptyMessage}
        isDisabled={isFormBusy}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
      />
    </section>
  )
}
