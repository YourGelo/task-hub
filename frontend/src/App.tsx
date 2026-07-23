import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  Database,
  ExternalLink,
  FileJson,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Server,
  Trash2,
  X,
} from 'lucide-react'
import { API_BASE_URL, apiRequest, normalizeApiProblem, type ApiProblem } from './api'
import type {
  Filters,
  SortField,
  SortOrder,
  Task,
  TaskList,
  TaskPriority,
  TaskStatus,
} from './types'
import './App.css'

type HealthState = 'checking' | 'online' | 'offline'

const statuses: TaskStatus[] = ['todo', 'in_progress', 'done']
const priorities: TaskPriority[] = ['low', 'medium', 'high']

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Без срока'
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function getErrorDetails(details: unknown): string[] {
  if (!details) return []
  if (!Array.isArray(details)) return [JSON.stringify(details)]

  return details.map((detail) => {
    if (typeof detail !== 'object' || detail === null) return String(detail)
    const record = detail as Record<string, unknown>
    return [record.field, record.message].filter(Boolean).join(' — ')
  })
}

function Method({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`method method--${tone}`}>{children}</span>
}

function HealthIndicator({
  label,
  icon,
  state,
}: {
  label: string
  icon: React.ReactNode
  state: HealthState
}) {
  const stateLabel = state === 'online' ? 'доступен' : state === 'offline' ? 'недоступен' : 'проверка'

  return (
    <span className={`health health--${state}`} title={`${label}: ${stateLabel}`}>
      {icon}
      <span>{label}</span>
      <i aria-hidden="true" />
    </span>
  )
}

function ErrorPanel({ problem, onClose }: { problem: ApiProblem; onClose: () => void }) {
  const details = getErrorDetails(problem.details)

  return (
    <aside className="error-panel" role="alert">
      <CircleAlert aria-hidden="true" />
      <div className="error-content">
        <div className="error-title">
          <code>{problem.code}</code>
          <strong>{problem.message}</strong>
        </div>
        {details.length > 0 && (
          <ul>
            {details.map((detail, index) => <li key={`${detail}-${index}`}>{detail}</li>)}
          </ul>
        )}
        {problem.request_id && (
          <span className="request-id">request_id: {problem.request_id}</span>
        )}
      </div>
      <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть ошибку">
        <X aria-hidden="true" />
      </button>
    </aside>
  )
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [problem, setProblem] = useState<ApiProblem | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [apiHealth, setApiHealth] = useState<HealthState>('checking')
  const [dbHealth, setDbHealth] = useState<HealthState>('checking')
  const [filters, setFilters] = useState<Filters>({
    status: '',
    sort: '',
    order: 'asc',
    limit: 10,
    offset: 0,
  })

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<'' | TaskStatus>('')
  const [dueDate, setDueDate] = useState('')

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const query = useMemo(() => {
    const params = new URLSearchParams({
      offset: String(filters.offset),
      limit: String(filters.limit),
    })
    if (filters.status) params.set('status', filters.status)
    if (filters.sort) {
      params.set('sort', filters.sort)
      params.set('order', filters.order)
    }
    return params.toString()
  }, [filters])

  const pageStart = total === 0 ? 0 : filters.offset + 1
  const pageEnd = Math.min(filters.offset + tasks.length, total)
  const hasPreviousPage = filters.offset > 0
  const hasNextPage = filters.offset + filters.limit < total

  const showSuccess = useCallback((message: string) => {
    setSuccess(message)
    window.setTimeout(() => setSuccess(null), 2800)
  }, [])

  const checkHealth = useCallback(async () => {
    setApiHealth('checking')
    setDbHealth('checking')
    const [api, database] = await Promise.allSettled([
      apiRequest<{ status: string }>('/health'),
      apiRequest<{ status: string }>('/health/db'),
    ])
    setApiHealth(api.status === 'fulfilled' && api.value.status === 'ok' ? 'online' : 'offline')
    setDbHealth(
      database.status === 'fulfilled' && database.value.status === 'ok' ? 'online' : 'offline',
    )
  }, [])

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setProblem(null)
    try {
      const result = await apiRequest<TaskList>(`/tasks?${query}`)
      setTasks(result.items)
      setTotal(result.pagination.total)
    } catch (error) {
      setProblem(normalizeApiProblem(error))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void checkHealth()
  }, [checkHealth])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    if (!editingTask) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditingTask(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [editingTask])

  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch, offset: patch.offset ?? 0 }))
  }

  async function refreshFirstPage() {
    if (filters.offset !== 0) {
      setFilters((current) => ({ ...current, offset: 0 }))
      return
    }
    await loadTasks()
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreating(true)
    setProblem(null)

    const body: Record<string, string> = { title: title.trim(), priority }
    if (status) body.status = status
    if (dueDate) body.due_date = new Date(dueDate).toISOString()

    try {
      await apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) })
      setTitle('')
      setPriority('medium')
      setStatus('')
      setDueDate('')
      showSuccess('201 Created — задача сохранена')
      await refreshFirstPage()
    } catch (error) {
      setProblem(normalizeApiProblem(error))
    } finally {
      setCreating(false)
    }
  }

  async function patchTask(
    id: string,
    patch: Partial<Pick<Task, 'status' | 'priority' | 'due_date'>>,
  ) {
    setBusyTaskId(id)
    setProblem(null)
    try {
      await apiRequest<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      showSuccess('200 OK — PATCH применён')
      await loadTasks()
    } catch (error) {
      setProblem(normalizeApiProblem(error))
    } finally {
      setBusyTaskId(null)
    }
  }

  async function openEditor(id: string) {
    setBusyTaskId(id)
    setProblem(null)
    try {
      const task = await apiRequest<Task>(`/tasks/${id}`)
      setEditingTask(task)
      setEditTitle(task.title)
      setEditStatus(task.status)
      setEditPriority(task.priority)
      setEditDueDate(toDatetimeLocal(task.due_date))
    } catch (error) {
      setProblem(normalizeApiProblem(error))
    } finally {
      setBusyTaskId(null)
    }
  }

  async function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTask) return

    setSavingEdit(true)
    setProblem(null)
    try {
      await apiRequest<Task>(`/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          status: editStatus,
          priority: editPriority,
          due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        }),
      })
      setEditingTask(null)
      showSuccess('200 OK — задача полностью обновлена через PUT')
      await loadTasks()
    } catch (error) {
      setProblem(normalizeApiProblem(error))
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Мягко удалить задачу «${task.title}»?`)) return

    setBusyTaskId(task.id)
    setProblem(null)
    try {
      await apiRequest<void>(`/tasks/${task.id}`, { method: 'DELETE' })
      showSuccess('204 No Content — задача soft-delete удалена')
      await loadTasks()
    } catch (error) {
      setProblem(normalizeApiProblem(error))
    } finally {
      setBusyTaskId(null)
    }
  }

  async function copyId(id: string) {
    await navigator.clipboard.writeText(id)
    showSuccess('UUID скопирован')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Task Hub">
          <span className="brand-mark"><CheckCircle2 aria-hidden="true" /></span>
          <span>
            <strong>Task Hub</strong>
            <small>API demo client</small>
          </span>
        </a>

        <div className="api-address">
          <Server aria-hidden="true" />
          <span>API</span>
          <code>{API_BASE_URL}</code>
        </div>

        <div className="topbar-actions">
          <div className="health-group">
            <HealthIndicator label="API" state={apiHealth} icon={<Activity aria-hidden="true" />} />
            <HealthIndicator label="DB" state={dbHealth} icon={<Database aria-hidden="true" />} />
            <button className="icon-button" type="button" onClick={checkHealth} aria-label="Обновить health">
              <RefreshCw aria-hidden="true" />
            </button>
          </div>
          <nav className="doc-links" aria-label="Документация API">
            <a href={`${API_BASE_URL}/api-docs`} target="_blank" rel="noreferrer">
              <BookOpen aria-hidden="true" /> Swagger <ExternalLink aria-hidden="true" />
            </a>
            <a href={`${API_BASE_URL}/openapi.json`} target="_blank" rel="noreferrer">
              <FileJson aria-hidden="true" /> OpenAPI <ExternalLink aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="page-heading">
          <div>
            <div className="eyebrow"><Code2 aria-hidden="true" /> Backend verification workspace</div>
            <h1>Задачи</h1>
          </div>
        </section>

        {problem && <ErrorPanel problem={problem} onClose={() => setProblem(null)} />}
        {success && (
          <div className="success-toast" role="status">
            <Check aria-hidden="true" /> {success}
          </div>
        )}

        <section className="dashboard">
          <aside className="create-panel">
            <div className="panel-heading">
              <div>
                <Method tone="green">POST</Method>
                <code>/tasks</code>
              </div>
              <span>Создание</span>
            </div>

            <form onSubmit={createTask}>
              <label>
                title <b>обязательно</b>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Название задачи"
                  required
                  autoFocus
                />
              </label>

              <div className="field-grid">
                <label>
                  priority <b>обязательно</b>
                  <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </label>
                <label>
                  status <em>optional</em>
                  <select value={status} onChange={(event) => setStatus(event.target.value as '' | TaskStatus)}>
                    <option value="">default: todo</option>
                    <option value="todo">todo</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                  </select>
                </label>
              </div>

              <label>
                due_date <em>optional · local time</em>
                <input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>

              <button className="primary-button" type="submit" disabled={creating || !title.trim()}>
                {creating ? <LoaderCircle className="spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {creating ? 'POST /tasks…' : 'Создать задачу'}
              </button>
            </form>
          </aside>

          <section className="tasks-panel">
            <div className="list-header">
              <div className="endpoint-title">
                <Method tone="blue">GET</Method>
                <code>/tasks</code>
                <span>{total} всего</span>
              </div>
              <button className="secondary-button" type="button" onClick={loadTasks} disabled={loading}>
                <RefreshCw className={loading ? 'spin' : ''} aria-hidden="true" /> Обновить
              </button>
            </div>

            <div className="filters">
              <div className="filter-label"><Filter aria-hidden="true" /> Query</div>
              <label>
                status
                <select
                  value={filters.status}
                  onChange={(event) => updateFilters({ status: event.target.value as '' | TaskStatus })}
                >
                  <option value="">all</option>
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                </select>
              </label>
              <label>
                sort
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value as SortField })}
                >
                  <option value="">created_at desc</option>
                  <option value="priority">priority</option>
                  <option value="due_date">due_date</option>
                </select>
              </label>
              <label>
                order
                <select
                  value={filters.order}
                  disabled={!filters.sort}
                  onChange={(event) => updateFilters({ order: event.target.value as SortOrder })}
                >
                  <option value="asc">asc</option>
                  <option value="desc">desc</option>
                </select>
              </label>
              <label>
                limit
                <select
                  value={filters.limit}
                  onChange={(event) => updateFilters({ limit: Number(event.target.value) })}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="request-preview">
              <ChevronRight aria-hidden="true" />
              <code>GET /tasks?{query}</code>
            </div>

            {loading ? (
              <div className="empty-state">
                <LoaderCircle className="spin" aria-hidden="true" />
                <strong>Выполняется GET /tasks</strong>
                <span>Получаем данные из PostgreSQL через backend.</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <Clipboard aria-hidden="true" />
                <strong>Задачи не найдены</strong>
                <span>Создайте задачу или измените query-параметры.</span>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map((task) => {
                  const busy = busyTaskId === task.id
                  return (
                    <article className="task-row" key={task.id}>
                      <div className="task-identity">
                        <div className="task-title">
                          <span className={`priority-line priority-line--${task.priority}`} />
                          <strong>{task.title}</strong>
                          {busy && <LoaderCircle className="spin row-loader" aria-label="Запрос выполняется" />}
                        </div>
                        <button className="task-id" type="button" onClick={() => void copyId(task.id)} title={task.id}>
                          <Clipboard aria-hidden="true" /> {task.id}
                        </button>
                        <div className="timestamps">
                          <span>created {formatDate(task.created_at)}</span>
                          <span>updated {formatDate(task.updated_at)}</span>
                        </div>
                      </div>

                      <div className="due-cell">
                        <small>due_date</small>
                        <input
                          type="datetime-local"
                          value={toDatetimeLocal(task.due_date)}
                          disabled={busy}
                          onChange={(event) => void patchTask(task.id, {
                            due_date: event.target.value ? new Date(event.target.value).toISOString() : null,
                          })}
                          aria-label={`Изменить срок задачи ${task.title}`}
                        />
                        {task.due_date && <code title={task.due_date}>{task.due_date}</code>}
                      </div>

                      <div className="quick-actions">
                        <label>
                          <span>status</span>
                          <select
                            value={task.status}
                            disabled={busy}
                            onChange={(event) => void patchTask(task.id, { status: event.target.value as TaskStatus })}
                          >
                            {statuses.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>priority</span>
                          <select
                            value={task.priority}
                            disabled={busy}
                            onChange={(event) => void patchTask(task.id, { priority: event.target.value as TaskPriority })}
                          >
                            {priorities.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="row-actions">
                        <button
                          className="row-button"
                          type="button"
                          disabled={busy}
                          onClick={() => void openEditor(task.id)}
                          title="GET по id, затем редактирование через PUT"
                        >
                          <Pencil aria-hidden="true" /> <span>PUT</span>
                        </button>
                        <button
                          className="row-button row-button--danger"
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteTask(task)}
                          title="DELETE /tasks/:id (soft-delete)"
                        >
                          <Trash2 aria-hidden="true" /> <span>DELETE</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <footer className="pagination">
              <span>Показано {pageStart}–{pageEnd} из {total}</span>
              <div>
                <button
                  className="icon-button"
                  type="button"
                  disabled={!hasPreviousPage || loading}
                  onClick={() => updateFilters({ offset: Math.max(0, filters.offset - filters.limit) })}
                  aria-label="Предыдущая страница"
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
                <code>offset={filters.offset}</code>
                <button
                  className="icon-button"
                  type="button"
                  disabled={!hasNextPage || loading}
                  onClick={() => updateFilters({ offset: filters.offset + filters.limit })}
                  aria-label="Следующая страница"
                >
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </footer>
          </section>
        </section>
      </main>

      {editingTask && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditingTask(null)
        }}>
          <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
            <header>
              <div>
                <span><Method tone="blue">GET</Method> выполнен</span>
                <h2 id="edit-title"><Method tone="violet">PUT</Method> Полное обновление</h2>
                <code>/tasks/{editingTask.id}</code>
              </div>
              <button className="icon-button" type="button" onClick={() => setEditingTask(null)} aria-label="Закрыть">
                <X aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={saveTask}>
              <label>
                title <b>обязательно</b>
                <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required autoFocus />
              </label>
              <div className="field-grid">
                <label>
                  status <b>обязательно</b>
                  <select value={editStatus} onChange={(event) => setEditStatus(event.target.value as TaskStatus)}>
                    <option value="todo">todo</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                  </select>
                </label>
                <label>
                  priority <b>обязательно</b>
                  <select value={editPriority} onChange={(event) => setEditPriority(event.target.value as TaskPriority)}>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </label>
              </div>
              <label>
                due_date <b>обязательный ключ · null допустим</b>
                <input type="datetime-local" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} />
              </label>
              <div className="contract-note">
                <Code2 aria-hidden="true" />
                <span>PUT передаёт все четыре изменяемых поля. Пустой срок отправляется как <code>null</code>; дата в прошлом при обновлении разрешена.</span>
              </div>
              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={() => setEditingTask(null)}>Отмена</button>
                <button className="primary-button" type="submit" disabled={savingEdit || !editTitle.trim()}>
                  {savingEdit ? <LoaderCircle className="spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                  {savingEdit ? 'PUT /tasks/:id…' : 'Сохранить через PUT'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
