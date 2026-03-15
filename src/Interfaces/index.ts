export type TaskStatus = 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandi'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface TaskFormValues {
  title: string
  description: string
  status: TaskStatus
}
