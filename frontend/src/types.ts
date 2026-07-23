export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type SortField = '' | 'priority' | 'due_date'
export type SortOrder = 'asc' | 'desc'

export type Task = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export type TaskList = {
  items: Task[]
  pagination: {
    offset: number
    limit: number
    total: number
  }
}

export type Filters = {
  status: '' | TaskStatus
  sort: SortField
  order: SortOrder
  limit: number
  offset: number
}
