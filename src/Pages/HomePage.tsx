import { useCallback, useEffect, useMemo, useState } from 'react'
import { TaskSection } from '../Components/TaskSection'
import { TaskList } from '../Components/TaskList'
import type { Task, TaskFormValues } from '../Interfaces'

const STORAGE_KEY = 'task-manager-items-v1'
const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const API_BASE_ROOT = ENV_API_BASE_URL.replace(/\/$/, '')
const API_PREFIX = API_BASE_ROOT ? `${API_BASE_ROOT}/api` : import.meta.env.DEV ? '/api' : ''
const SWAGGER_URL = API_PREFIX ? `${API_PREFIX}/docs` : ''

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function loadTasksFromStorage(): Task[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawTasks = localStorage.getItem(STORAGE_KEY)
  if (!rawTasks) {
    return []
  }

  try {
    const parsedTasks = JSON.parse(rawTasks) as Task[]
    return Array.isArray(parsedTasks) ? parsedTasks : []
  } catch {
    return []
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return 'API sunucusuna ulasilamadi. `cd server && npm run dev` komutunu calistirin.'
  }

  if (error instanceof SyntaxError) {
    return 'API yaniti JSON formatinda degil. `VITE_API_BASE_URL` ayarini kontrol edin.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Beklenmeyen bir hata olustu.'
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_PREFIX) {
    throw new Error('API adresi tanimli degil. Netlify ortamina `VITE_API_BASE_URL` ekleyin.')
  }

  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = 'API istegi basarisiz oldu.'

    const responseContentType = response.headers.get('content-type') ?? ''
    if (responseContentType.includes('application/json')) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null
      if (payload?.message) {
        message = payload.message
      }
    } else {
      message = `API istegi basarisiz oldu (HTTP ${response.status}).`
    }

    throw new Error(message)
  }

  const responseContentType = response.headers.get('content-type') ?? ''
  if (!responseContentType.includes('application/json')) {
    throw new Error('API JSON yerine farkli bir yanit dondurdu. API URL ayarini kontrol edin.')
  }

  return (await response.json()) as T
}

export function HomePage() {
  const [localTasks, setLocalTasks] = useState<Task[]>(() => loadTasksFromStorage())
  const [apiTasks, setApiTasks] = useState<Task[]>([])
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localTasks))
  }, [localTasks])

  const loadApiTasks = useCallback(async (signal?: AbortSignal) => {
    if (!API_PREFIX) {
      setApiError('API paneli icin `VITE_API_BASE_URL` tanimlayip yeniden deploy edin.')
      setApiTasks([])
      return
    }

    setIsApiLoading(true)
    setApiError(null)

    try {
      const apiData = await requestApi<Task[]>('/tasks', {
        method: 'GET',
        signal,
      })
      setApiTasks(apiData)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setApiError(getErrorMessage(error))
    } finally {
      setIsApiLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadApiTasks(controller.signal)

    return () => {
      controller.abort()
    }
  }, [loadApiTasks])

  const totalSummary = useMemo(() => {
    const allTasks = [...localTasks, ...apiTasks]
    const completedCount = allTasks.filter((task) => task.status === 'Tamamlandi').length

    return {
      localCount: localTasks.length,
      apiCount: apiTasks.length,
      overallCount: allTasks.length,
      completedCount,
    }
  }, [apiTasks, localTasks])

  const createLocalTask = async (values: TaskFormValues) => {
    const now = formatDate(new Date())

    const newTask: Task = {
      id: crypto.randomUUID(),
      ...values,
      createdAt: now,
      updatedAt: now,
    }

    setLocalTasks((prevTasks) => [newTask, ...prevTasks])
    return true
  }

  const updateLocalTask = async (taskId: string, values: TaskFormValues) => {
    const now = formatDate(new Date())

    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...values,
              updatedAt: now,
            }
          : task,
      ),
    )

    return true
  }

  const deleteLocalTask = async (taskId: string) => {
    setLocalTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
    return true
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
        <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-wider text-slate-300">Fullstack CRUD Projesi</p>
          <h1 className="mt-2 text-3xl font-bold">Gorev Yonetim Sistemi</h1>
          <p className="mt-3 text-sm text-slate-300">
            Gorev ekleme/guncelleme/silme islemleri localStorage panelinden, API CRUD islemleri Swagger'dan yapilir.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="text-xs text-slate-300">LocalStorage Gorevleri</p>
              <p className="text-xl font-semibold">{totalSummary.localCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="text-xs text-slate-300">API Gorevleri</p>
              <p className="text-xl font-semibold">{totalSummary.apiCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="text-xs text-slate-300">Toplam Gorev</p>
              <p className="text-xl font-semibold">{totalSummary.overallCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="text-xs text-slate-300">Tamamlanan</p>
              <p className="text-xl font-semibold text-emerald-300">{totalSummary.completedCount}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <TaskSection
            title="LocalStorage Paneli"
            description="Bu panel tarayicida saklanan gorevleri yonetir."
            tasks={localTasks}
            emptyMessage="LocalStorage kaynagi icin gorev bulunamadi."
            onCreate={createLocalTask}
            onUpdate={updateLocalTask}
            onDelete={deleteLocalTask}
          />

          <section className="space-y-4 rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
            <header className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">API Paneli (Salt Okunur)</h2>
              <p className="mt-1 text-sm text-slate-500">
                API verileri burada listelenir; ekleme, guncelleme ve silme islemleri Swagger ekranindan yapilir.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadApiTasks()}
                  disabled={isApiLoading || !API_PREFIX}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                >
                  API'den Yenile
                </button>
                {SWAGGER_URL ? (
                  <a
                    href={SWAGGER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Swagger UI Ac
                  </a>
                ) : (
                  <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Swagger icin `VITE_API_BASE_URL` tanimlayin.
                  </span>
                )}
              </div>
            </header>

            {apiError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {apiError}
              </p>
            )}

            {isApiLoading && (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                API verileri yukleniyor...
              </p>
            )}

            <TaskList
              tasks={apiTasks}
              emptyMessage="API kaynagi icin gorev bulunamadi."
              showActions={false}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
