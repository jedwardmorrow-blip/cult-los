import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { PersonalTodo, PersonalTodoCompletion, PersonalTodoAssignee } from '../types'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function usePersonalTodos(targetOwnerId?: string) {
  const { user, profile } = useAuth()
  const ownerId = targetOwnerId || user?.id

  const [todos, setTodos] = useState<PersonalTodo[]>([])
  const [completions, setCompletions] = useState<PersonalTodoCompletion[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch todos + today's completions + assignees (D2)
  const fetchTodos = useCallback(async () => {
    if (!ownerId) return
    setLoading(true)

    const [todosRes, completionsRes] = await Promise.all([
      supabase
        .from('personal_todos')
        .select('*, profiles(id, full_name, avatar_url), assigned_by_profile:profiles!personal_todos_assigned_by_fkey(id, full_name, avatar_url)')
        .eq('owner_id', ownerId)
        .neq('status', 'dropped')
        .order('sort_order')
        .order('created_at'),
      supabase
        .from('personal_todo_completions')
        .select('*')
        .eq('completed_date', todayStr()),
    ])

    if (todosRes.data) {
      const todayCompletionIds = new Set(
        (completionsRes.data || []).map(c => c.todo_id)
      )
      // D2: Fetch assignees for all todos
      const todoIds = todosRes.data.map(t => t.id)
      let assigneeMap: Record<string, Array<{ id: string; full_name: string; avatar_url?: string }>> = {}
      if (todoIds.length > 0) {
        const { data: assigneeData } = await supabase
          .from('personal_todo_assignees')
          .select('todo_id, profiles(id, full_name, avatar_url)')
          .in('todo_id', todoIds)
        if (assigneeData) {
          for (const a of assigneeData) {
            if (!assigneeMap[a.todo_id]) assigneeMap[a.todo_id] = []
            if (a.profiles) assigneeMap[a.todo_id].push(a.profiles as any)
          }
        }
      }

      const enriched = todosRes.data.map(t => ({
        ...t,
        completed_today: todayCompletionIds.has(t.id),
        assignees: assigneeMap[t.id] || [],
      })) as PersonalTodo[]
      setTodos(enriched)
    }
    if (completionsRes.data) {
      setCompletions(completionsRes.data as PersonalTodoCompletion[])
    }

    setLoading(false)
  }, [ownerId])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Realtime subscription
  useEffect(() => {
    if (!ownerId) return

    const channel = supabase
      .channel('personal-todos-' + ownerId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_todos', filter: `owner_id=eq.${ownerId}` },
        () => fetchTodos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_todo_completions' },
        () => fetchTodos()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ownerId, fetchTodos])

  // Add new todo
  const addTodo = useCallback(
    async (todo: {
      title: string
      description?: string
      due_date?: string
      is_recurring?: boolean
      recurrence_pattern?: string
      priority?: string
      category?: string
      assigned_by?: string
    }) => {
      if (!ownerId) return null
      const maxSort = todos.length > 0 ? Math.max(...todos.map(t => t.sort_order)) : 0
      const { data, error } = await supabase
        .from('personal_todos')
        .insert({
          owner_id: ownerId,
          title: todo.title,
          description: todo.description || null,
          due_date: todo.due_date || null,
          is_recurring: todo.is_recurring || false,
          recurrence_pattern: todo.recurrence_pattern || null,
          priority: todo.priority || 'medium',
          category: todo.category || null,
          assigned_by: todo.assigned_by || null,
          sort_order: maxSort + 1,
        })
        .select()
        .single()

      if (error) console.error('Add todo error:', error)
      return data
    },
    [ownerId, todos]
  )

  // Toggle completion
  const toggleComplete = useCallback(
    async (todoId: string) => {
      const todo = todos.find(t => t.id === todoId)
      if (!todo) return

      if (todo.is_recurring) {
        // For recurring: toggle today's completion
        if (todo.completed_today) {
          await supabase
            .from('personal_todo_completions')
            .delete()
            .eq('todo_id', todoId)
            .eq('completed_date', todayStr())
        } else {
          await supabase
            .from('personal_todo_completions')
            .insert({ todo_id: todoId, completed_date: todayStr() })
        }
      } else {
        // For one-time: toggle status
        if (todo.status === 'complete') {
          await supabase
               .from('personal_todos')
            .update({ status: 'pending', completed_at: null, updated_at: new Date().toISOString() })
            .eq('id', todoId)
        } else {
          await supabase
            .from('personal_todos')
            .update({ status: 'complete', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', todoId)
        }
      }
    },
    [todos]
  )

  // Update todo
  const updateTodo = useCallback(
    async (todoId: string, updates: Partial<Pick<PersonalTodo, 'title' | 'description' | 'due_date' | 'is_recurring' | 'recurrence_pattern' | 'sort_order'>>) => {
      const { error } = await supabase
        .from('personal_todos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', todoId)
      if (error) console.error('Update todo error:', error)
    },
    []
  )

  // Drop (soft-delete) todo
  const dropTodo = useCallback(async (todoId: string) => {
    const { error } = await supabase
      .from('personal_todos')
      .update({ status: 'dropped', updated_at: new Date().toISOString() })
      .eq('id', todoId)
    if (error) console.error('Drop todo error:', error)
  }, [])

  // Check if a todo is "done" for display purposes
  const isDone = useCallback(
    (todo: PersonalTodo) => {
      if (todo.is_recurring) return todo.completed_today || false
      return todo.status === 'complete'
    },
    []
  )

  return {
    todos,
    completions,
    loading,
    addTodo,
    toggleComplete,
    updateTodo,
    dropTodo,
    isDone,
    refetch: fetchTodos,
  }
}

// Hook for admin: assign a todo to any team member (D2: with co-assignees)
export function useAssignTodo() {
  const { user } = useAuth()

  const assignTodo = async (params: {
    owner_id: string
    title: string
    description?: string
    due_date?: string
    is_recurring?: boolean
    recurrence_pattern?: string
    priority?: string
    category?: string
    additional_assignees?: string[] // D2: extra profile IDs
  }) => {
    if (!user?.id) return null

    // Get current max sort_order for the target user
    const { data: existing } = await supabase
      .from('personal_todos')
      .select('sort_order')
      .eq('owner_id', params.owner_id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSort = existing?.[0]?.sort_order ?? 0

    const { data, error } = await supabase
      .from('personal_todos')
      .insert({
        owner_id: params.owner_id,
        title: params.title,
        description: params.description || null,
        due_date: params.due_date || null,
        is_recurring: params.is_recurring || false,
        recurrence_pattern: params.recurrence_pattern || null,
        priority: params.priority || 'medium',
        category: params.category || null,
        assigned_by: user.id,
        sort_order: maxSort + 1,
      })
      .select()
      .single()

    if (error) {
      console.error('Assign todo error:', error)
      return null
    }

    // D2: Insert co-assignees into junction table
    if (data && params.additional_assignees && params.additional_assignees.length > 0) {
      const rows = params.additional_assignees.map(pid => ({
        todo_id: data.id,
        profile_id: pid,
      }))
      const { error: assignErr } = await supabase
        .from('personal_todo_assignees')
        .insert(rows)
      if (assignErr) console.error('Co-assignee insert error:', assignErr)
    }

    // F2: Notify assignees via Slack DM (non-blocking)
    if (data) {
      const allAssigneeIds = [params.owner_id, ...(params.additional_assignees || [])]
        .filter(id => id !== user.id) // Don't notify self
      if (allAssigneeIds.length > 0) {
        supabase.functions.invoke('slack-todo-notify', {
          body: {
            todo_title: params.title,
            todo_type: 'personal',
            assignee_ids: allAssigneeIds,
            assigned_by: user.id,
            due_date: params.due_date,
          },
        }).catch(err => console.warn('[F2] Slack todo notify failed:', err))
      }
    }

    return data
  }

  return { assignTodo }
}

// D5: Fetch todos where current user is a co-assignee (cross-department)
export function useAssignedToMeTodos() {
  const { user } = useAuth()
  const [assignedTodos, setAssignedTodos] = useState<PersonalTodo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAssigned = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    // Get todo IDs where user is an assignee
    const { data: assigneeRows } = await supabase
      .from('personal_todo_assignees')
      .select('todo_id')
      .eq('profile_id', user.id)

    if (!assigneeRows || assigneeRows.length === 0) {
      setAssignedTodos([])
      setLoading(false)
      return
    }

    const todoIds = assigneeRows.map(r => r.todo_id)

    const [todosRes, completionsRes] = await Promise.all([
      supabase
        .from('personal_todos')
        .select('*, profiles(id, full_name, avatar_url)')
        .in('id', todoIds)
        .neq('status', 'dropped')
        .order('created_at', { ascending: false }),
      supabase
        .from('personal_todo_completions')
        .select('*')
        .eq('completed_date', todayStr()),
    ])

    if (todosRes.data) {
      const todayCompletionIds = new Set(
        (completionsRes.data || []).map(c => c.todo_id)
      )
      setAssignedTodos(
        todosRes.data.map(t => ({
          ...t,
          completed_today: todayCompletionIds.has(t.id),
        })) as PersonalTodo[]
      )
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchAssigned()
  }, [fetchAssigned])

  return { assignedTodos, loading, refresh: fetchAssigned }
}

// Hook for admin: fetch all users' todos
export function useAllPersonalTodos() {
  const [allTodos, setAllTodos] = useState<PersonalTodo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const today = todayStr()
    const [todosRes, completionsRes] = await Promise.all([
      supabase
        .from('personal_todos')
        .select('*, profiles(id, full_name, avatar_url), assigned_by_profile:profiles!personal_todos_assigned_by_fkey(id, full_name, avatar_url)')
        .neq('status', 'dropped')
        .order('owner_id')
        .order('sort_order'),
      supabase
        .from('personal_todo_completions')
        .select('*')
        .eq('completed_date', today),
    ])

    if (todosRes.data) {
      const todayCompletionIds = new Set(
        (completionsRes.data || []).map(c => c.todo_id)
      )
      // D2: Fetch assignees for all todos
      const todoIds = todosRes.data.map(t => t.id)
      let assigneeMap: Record<string, Array<{ id: string; full_name: string; avatar_url?: string }>> = {}
      if (todoIds.length > 0) {
        const { data: assigneeData } = await supabase
          .from('personal_todo_assignees')
          .select('todo_id, profiles(id, full_name, avatar_url)')
          .in('todo_id', todoIds)
        if (assigneeData) {
          for (const a of assigneeData) {
            if (!assigneeMap[a.todo_id]) assigneeMap[a.todo_id] = []
            if (a.profiles) assigneeMap[a.todo_id].push(a.profiles as any)
          }
        }
      }

      setAllTodos(
        todosRes.data.map(t => ({
          ...t,
          completed_today: todayCompletionIds.has(t.id),
          assignees: assigneeMap[t.id] || [],
        })) as PersonalTodo[]
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { allTodos, loading, refresh: fetchAll }
}
