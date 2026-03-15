import { randomUUID } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const clientOriginsFromEnv = (process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = new Set(clientOriginsFromEnv)

const TASK_STATUSES = new Set(['Bekliyor', 'Devam Ediyor', 'Tamamlandi'])

/** @type {Array<{id: string, title: string, description: string, status: string, createdAt: string, updatedAt: string}>} */
const tasks = []
const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Gorev Yonetim API',
    version: '1.0.0',
    description:
      'API panelindeki verileri yonetmek icin kullanilir. UI tarafi API verisini sadece listeler, mutation islemleri Swagger uzerinden yapilir.',
  },
  servers: [{ url: `http://localhost:${port}` }],
  tags: [{ name: 'Tasks', description: 'Gorev CRUD endpointleri' }],
  paths: {
    '/api/health': {
      get: {
        summary: 'Servis saglik kontrolu',
        responses: {
          200: {
            description: 'Servis ayakta',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                  required: ['status'],
                },
              },
            },
          },
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Tum gorevleri listeler',
        responses: {
          200: {
            description: 'Gorev listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Yeni gorev olusturur',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskPayload' },
            },
          },
        },
        responses: {
          201: {
            description: 'Olusan gorev',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          400: {
            description: 'Gecersiz veri',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/tasks/{id}': {
      put: {
        tags: ['Tasks'],
        summary: 'Gorevi gunceller',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskPayload' },
            },
          },
        },
        responses: {
          200: {
            description: 'Guncellenmis gorev',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          400: {
            description: 'Gecersiz veri',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Gorev bulunamadi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Gorevi siler',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Silinen gorev bilgisi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string', format: 'uuid' } },
                  required: ['id'],
                },
              },
            },
          },
          404: {
            description: 'Gorev bulunamadi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['Bekliyor', 'Devam Ediyor', 'Tamamlandi'] },
          createdAt: { type: 'string', example: '15.03.2026 20:30' },
          updatedAt: { type: 'string', example: '15.03.2026 20:30' },
        },
        required: ['id', 'title', 'description', 'status', 'createdAt', 'updatedAt'],
      },
      TaskPayload: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['Bekliyor', 'Devam Ediyor', 'Tamamlandi'] },
        },
        required: ['title', 'status'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
    },
  },
}

function formatDate(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeTaskPayload(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  const status = body?.status

  if (!title) {
    return { error: 'Baslik alani zorunludur.' }
  }

  if (!TASK_STATUSES.has(status)) {
    return { error: 'Gecersiz durum degeri gonderildi.' }
  }

  return {
    value: {
      title,
      description,
      status,
    },
  }
}

function isOriginAllowed(origin) {
  if (allowedOrigins.has(origin)) {
    return true
  }

  try {
    const parsedOrigin = new URL(origin)
    return parsedOrigin.hostname === 'localhost' || parsedOrigin.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Bu origin icin API erisimi engellendi.'), false)
    },
  }),
)
app.use(express.json())

app.get('/api/openapi.json', (_request, response) => {
  response.json(openApiDocument)
})
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/tasks', (_request, response) => {
  response.json(tasks)
})

app.post('/api/tasks', (request, response) => {
  const parsedPayload = normalizeTaskPayload(request.body)
  if (parsedPayload.error) {
    response.status(400).json({ message: parsedPayload.error })
    return
  }

  const now = formatDate(new Date())
  const task = {
    id: randomUUID(),
    ...parsedPayload.value,
    createdAt: now,
    updatedAt: now,
  }

  tasks.unshift(task)
  response.status(201).json(task)
})

app.put('/api/tasks/:id', (request, response) => {
  const parsedPayload = normalizeTaskPayload(request.body)
  if (parsedPayload.error) {
    response.status(400).json({ message: parsedPayload.error })
    return
  }

  const taskIndex = tasks.findIndex((task) => task.id === request.params.id)
  if (taskIndex < 0) {
    response.status(404).json({ message: 'Gorev bulunamadi.' })
    return
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...parsedPayload.value,
    updatedAt: formatDate(new Date()),
  }

  tasks[taskIndex] = updatedTask
  response.json(updatedTask)
})

app.delete('/api/tasks/:id', (request, response) => {
  const taskIndex = tasks.findIndex((task) => task.id === request.params.id)
  if (taskIndex < 0) {
    response.status(404).json({ message: 'Gorev bulunamadi.' })
    return
  }

  const [deletedTask] = tasks.splice(taskIndex, 1)
  response.json({ id: deletedTask.id })
})

app.listen(port, () => {
  console.log(`API server ${port} portunda calisiyor.`)
})
