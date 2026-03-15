import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { TaskFormValues } from '../Interfaces'

interface TaskFormProps {
  initialValues: TaskFormValues
  isEditing: boolean
  isSubmitting?: boolean
  onSubmit: (values: TaskFormValues) => void | Promise<void>
  onCancelEdit: () => void
}

export function TaskForm({
  initialValues,
  isEditing,
  isSubmitting = false,
  onSubmit,
  onCancelEdit,
}: TaskFormProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(initialValues)

  useEffect(() => {
    // Duzenleme modunda parent'tan gelen veriyi forma yansitir.
    setFormValues(initialValues)
  }, [initialValues])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const normalizedTitle = formValues.title.trim()
    if (!normalizedTitle) {
      window.alert('Baslik alani bos birakilamaz.')
      return
    }

    await onSubmit({
      ...formValues,
      title: normalizedTitle,
      description: formValues.description.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">
        {isEditing ? 'Gorevi Guncelle' : 'Yeni Gorev Ekle'}
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            Baslik
          </label>
          <input
            id="title"
            type="text"
            value={formValues.title}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, title: event.target.value }))
            }
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Orn: React tekrarini tamamla"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
            Aciklama
          </label>
          <textarea
            id="description"
            value={formValues.description}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={4}
            disabled={isSubmitting}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Gorevle ilgili detaylari yazin"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
            Durum
          </label>
          <select
            id="status"
            value={formValues.status}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                status: event.target.value as TaskFormValues['status'],
              }))
            }
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="Bekliyor">Bekliyor</option>
            <option value="Devam Ediyor">Devam Ediyor</option>
            <option value="Tamamlandi">Tamamlandi</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? 'Kaydediliyor...' : isEditing ? 'Kaydet' : 'Ekle'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSubmitting}
            className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            Vazgec
          </button>
        )}
      </div>
    </form>
  )
}
