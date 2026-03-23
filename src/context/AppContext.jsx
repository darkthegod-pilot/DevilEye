import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import {
  casesApi, usersApi, profilesApi, notesApi, tasksApi,
  queriesApi, attachmentsApi, timelineApi, organogramApi, muralApi,
  getToken, clearToken
} from '@/api/index'

const AppContext = createContext(null)

const initialState = {
  // Auth
  currentUser: null,
  isAuthChecked: false,

  // Data
  cases: [],
  users: [],
  // por caseId
  profiles: {},
  notes: {},
  tasks: {},
  queries: {},
  attachments: {},
  timelineEvents: {},

  // UI
  isLoaded: false,
  activeCase: null,
  activeCaseTab: 'overview',
  sidePanel: { open: false, contentType: null, data: null },
  globalSearch: '',
  caseViewMode: 'cards',

  // Toast notifications
  toasts: [],
}

function reducer(state, action) {
  switch (action.type) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    case 'SET_USER':
      return { ...state, currentUser: action.payload, isAuthChecked: true }
    case 'AUTH_CHECKED':
      return { ...state, isAuthChecked: true }
    case 'LOGOUT':
      return { ...initialState, isAuthChecked: true }

    // ── Users ─────────────────────────────────────────────────────────────────
    case 'SET_USERS':
      return { ...state, users: action.payload }

    // ── Cases ─────────────────────────────────────────────────────────────────
    case 'SET_CASES':
      return { ...state, cases: action.payload, isLoaded: true }
    case 'ADD_CASE':
      return { ...state, cases: [action.payload, ...state.cases] }
    case 'UPDATE_CASE':
      return { ...state, cases: state.cases.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'REMOVE_CASE':
      return { ...state, cases: state.cases.filter(c => c.id !== action.payload) }

    // ── By caseId ─────────────────────────────────────────────────────────────
    case 'SET_PROFILES':
      return { ...state, profiles: { ...state.profiles, [action.caseId]: action.payload } }
    case 'ADD_PROFILE':
      return { ...state, profiles: { ...state.profiles, [action.caseId]: [action.payload, ...(state.profiles[action.caseId] || [])] } }
    case 'UPDATE_PROFILE': {
      const arr = (state.profiles[action.caseId] || []).map(p => p.id === action.payload.id ? action.payload : p)
      return { ...state, profiles: { ...state.profiles, [action.caseId]: arr } }
    }
    case 'REMOVE_PROFILE': {
      const arr = (state.profiles[action.caseId] || []).filter(p => p.id !== action.payload)
      return { ...state, profiles: { ...state.profiles, [action.caseId]: arr } }
    }

    case 'SET_NOTES':
      return { ...state, notes: { ...state.notes, [action.caseId]: action.payload } }
    case 'ADD_NOTE':
      return { ...state, notes: { ...state.notes, [action.caseId]: [action.payload, ...(state.notes[action.caseId] || [])] } }
    case 'UPDATE_NOTE': {
      const arr = (state.notes[action.caseId] || []).map(n => n.id === action.payload.id ? action.payload : n)
      return { ...state, notes: { ...state.notes, [action.caseId]: arr } }
    }
    case 'REMOVE_NOTE': {
      const arr = (state.notes[action.caseId] || []).filter(n => n.id !== action.payload)
      return { ...state, notes: { ...state.notes, [action.caseId]: arr } }
    }

    case 'SET_TASKS':
      return { ...state, tasks: { ...state.tasks, [action.caseId]: action.payload } }
    case 'ADD_TASK':
      return { ...state, tasks: { ...state.tasks, [action.caseId]: [...(state.tasks[action.caseId] || []), action.payload] } }
    case 'UPDATE_TASK': {
      const arr = (state.tasks[action.caseId] || []).map(t => t.id === action.payload.id ? action.payload : t)
      return { ...state, tasks: { ...state.tasks, [action.caseId]: arr } }
    }
    case 'REMOVE_TASK': {
      const arr = (state.tasks[action.caseId] || []).filter(t => t.id !== action.payload)
      return { ...state, tasks: { ...state.tasks, [action.caseId]: arr } }
    }

    case 'SET_QUERIES':
      return { ...state, queries: { ...state.queries, [action.caseId]: action.payload } }
    case 'ADD_QUERY':
      return { ...state, queries: { ...state.queries, [action.caseId]: [action.payload, ...(state.queries[action.caseId] || [])] } }
    case 'UPDATE_QUERY': {
      const arr = (state.queries[action.caseId] || []).map(q => q.id === action.payload.id ? action.payload : q)
      return { ...state, queries: { ...state.queries, [action.caseId]: arr } }
    }
    case 'REMOVE_QUERY': {
      const arr = (state.queries[action.caseId] || []).filter(q => q.id !== action.payload)
      return { ...state, queries: { ...state.queries, [action.caseId]: arr } }
    }

    case 'SET_ATTACHMENTS':
      return { ...state, attachments: { ...state.attachments, [action.caseId]: action.payload } }
    case 'ADD_ATTACHMENT':
      return { ...state, attachments: { ...state.attachments, [action.caseId]: [action.payload, ...(state.attachments[action.caseId] || [])] } }
    case 'REMOVE_ATTACHMENT': {
      const arr = (state.attachments[action.caseId] || []).filter(a => a.id !== action.payload)
      return { ...state, attachments: { ...state.attachments, [action.caseId]: arr } }
    }

    case 'SET_TIMELINE':
      return { ...state, timelineEvents: { ...state.timelineEvents, [action.caseId]: action.payload } }
    case 'ADD_TIMELINE_EVENT':
      return { ...state, timelineEvents: { ...state.timelineEvents, [action.caseId]: [action.payload, ...(state.timelineEvents[action.caseId] || [])] } }

    // ── UI ────────────────────────────────────────────────────────────────────
    case 'SET_ACTIVE_CASE':
      return { ...state, activeCase: action.payload, activeCaseTab: 'overview' }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeCaseTab: action.payload }
    case 'OPEN_SIDE_PANEL':
      return { ...state, sidePanel: { open: true, contentType: action.payload.contentType, data: action.payload.data } }
    case 'CLOSE_SIDE_PANEL':
      return { ...state, sidePanel: { ...state.sidePanel, open: false } }
    case 'SET_SEARCH':
      return { ...state, globalSearch: action.payload }
    case 'SET_VIEW_MODE':
      return { ...state, caseViewMode: action.payload }

    // ── Toasts ────────────────────────────────────────────────────────────────
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ── Verificar auth ao montar ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken()
    const savedUser = localStorage.getItem('devileye-user')
    if (token && savedUser) {
      try {
        dispatch({ type: 'SET_USER', payload: JSON.parse(savedUser) })
      } catch {
        dispatch({ type: 'AUTH_CHECKED' })
      }
    } else {
      dispatch({ type: 'AUTH_CHECKED' })
    }
  }, [])

  // ── Carregar dados iniciais quando autenticado ────────────────────────────
  useEffect(() => {
    if (!state.currentUser) return
    Promise.all([
      casesApi.list().then(data => dispatch({ type: 'SET_CASES', payload: data })),
      usersApi.list().then(data => dispatch({ type: 'SET_USERS', payload: data })),
    ]).catch(err => console.error('[AppContext] Erro ao carregar dados iniciais:', err))
  }, [state.currentUser])

  // ── Ações de UI ──────────────────────────────────────────────────────────
  const openSidePanel = useCallback((contentType, data) =>
    dispatch({ type: 'OPEN_SIDE_PANEL', payload: { contentType, data } }), [])

  const closeSidePanel = useCallback(() =>
    dispatch({ type: 'CLOSE_SIDE_PANEL' }), [])

  const setActiveTab = useCallback((tab) =>
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }), [])

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000)
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken()
    dispatch({ type: 'LOGOUT' })
  }, [])

  // ── Cases ─────────────────────────────────────────────────────────────────
  const createCase = useCallback(async (data) => {
    const newCase = await casesApi.create(data)
    dispatch({ type: 'ADD_CASE', payload: newCase })
    toast('Caso criado com sucesso!', 'success')
    return newCase
  }, [toast])

  const updateCase = useCallback(async (id, data) => {
    const updated = await casesApi.update(id, data)
    dispatch({ type: 'UPDATE_CASE', payload: updated })
    return updated
  }, [])

  const deleteCase = useCallback(async (id) => {
    await casesApi.delete(id)
    dispatch({ type: 'REMOVE_CASE', payload: id })
    toast('Caso excluído.', 'info')
  }, [toast])

  // ── Perfis ─────────────────────────────────────────────────────────────────
  const loadProfiles = useCallback(async (caseId) => {
    if (state.profiles[caseId]) return
    const data = await profilesApi.list(caseId)
    dispatch({ type: 'SET_PROFILES', caseId, payload: data })
  }, [state.profiles])

  const addProfile = useCallback(async (caseId, data) => {
    const profile = await profilesApi.create(caseId, data)
    dispatch({ type: 'ADD_PROFILE', caseId, payload: profile })
    return profile
  }, [])

  const updateProfile = useCallback(async (caseId, profileId, data) => {
    const updated = await profilesApi.update(profileId, data)
    dispatch({ type: 'UPDATE_PROFILE', caseId, payload: updated })
    return updated
  }, [])

  const deleteProfile = useCallback(async (caseId, profileId) => {
    await profilesApi.delete(profileId)
    dispatch({ type: 'REMOVE_PROFILE', caseId, payload: profileId })
  }, [])

  // ── Notas ──────────────────────────────────────────────────────────────────
  const loadNotes = useCallback(async (caseId) => {
    if (state.notes[caseId]) return
    const data = await notesApi.list(caseId)
    dispatch({ type: 'SET_NOTES', caseId, payload: data })
  }, [state.notes])

  const addNote = useCallback(async (caseId, data) => {
    const note = await notesApi.create(caseId, data)
    dispatch({ type: 'ADD_NOTE', caseId, payload: note })
    return note
  }, [])

  const updateNote = useCallback(async (caseId, noteId, data) => {
    const updated = await notesApi.update(noteId, data)
    dispatch({ type: 'UPDATE_NOTE', caseId, payload: updated })
    return updated
  }, [])

  const deleteNote = useCallback(async (caseId, noteId) => {
    await notesApi.delete(noteId)
    dispatch({ type: 'REMOVE_NOTE', caseId, payload: noteId })
  }, [])

  // ── Tarefas ────────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async (caseId) => {
    if (state.tasks[caseId]) return
    const data = await tasksApi.list(caseId)
    dispatch({ type: 'SET_TASKS', caseId, payload: data })
  }, [state.tasks])

  const addTask = useCallback(async (caseId, data) => {
    const task = await tasksApi.create(caseId, data)
    dispatch({ type: 'ADD_TASK', caseId, payload: task })
    return task
  }, [])

  const updateTask = useCallback(async (caseId, taskId, data) => {
    const updated = await tasksApi.update(taskId, data)
    dispatch({ type: 'UPDATE_TASK', caseId, payload: updated })
    return updated
  }, [])

  // ── Consultas ─────────────────────────────────────────────────────────────
  const loadQueries = useCallback(async (caseId) => {
    if (state.queries[caseId]) return
    const data = await queriesApi.list(caseId)
    dispatch({ type: 'SET_QUERIES', caseId, payload: data })
  }, [state.queries])

  const addQuery = useCallback(async (caseId, data) => {
    const q = await queriesApi.create(caseId, data)
    dispatch({ type: 'ADD_QUERY', caseId, payload: q })
    return q
  }, [])

  const updateQuery = useCallback(async (caseId, queryId, data) => {
    const updated = await queriesApi.update(queryId, data)
    dispatch({ type: 'UPDATE_QUERY', caseId, payload: updated })
    return updated
  }, [])

  // ── Anexos ────────────────────────────────────────────────────────────────
  const loadAttachments = useCallback(async (caseId) => {
    if (state.attachments[caseId]) return
    const data = await attachmentsApi.list(caseId)
    dispatch({ type: 'SET_ATTACHMENTS', caseId, payload: data })
  }, [state.attachments])

  const uploadAttachment = useCallback(async (caseId, formData) => {
    const att = await attachmentsApi.upload(caseId, formData)
    dispatch({ type: 'ADD_ATTACHMENT', caseId, payload: att })
    return att
  }, [])

  const deleteAttachment = useCallback(async (caseId, id) => {
    await attachmentsApi.delete(id)
    dispatch({ type: 'REMOVE_ATTACHMENT', caseId, payload: id })
  }, [])

  // ── Timeline ─────────────────────────────────────────────────────────────
  const loadTimeline = useCallback(async (caseId) => {
    if (state.timelineEvents[caseId]) return
    const data = await timelineApi.list(caseId)
    dispatch({ type: 'SET_TIMELINE', caseId, payload: data })
  }, [state.timelineEvents])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getUserById = useCallback((id) => state.users.find(u => u.id === id), [state.users])

  const value = {
    ...state,
    dispatch,
    // Auth
    logout,
    // UI
    openSidePanel,
    closeSidePanel,
    setActiveTab,
    toast,
    // Cases
    createCase,
    updateCase,
    deleteCase,
    // Profiles
    loadProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    // Notes
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    // Tasks
    loadTasks,
    addTask,
    updateTask,
    // Queries
    loadQueries,
    addQuery,
    updateQuery,
    // Attachments
    loadAttachments,
    uploadAttachment,
    deleteAttachment,
    // Timeline
    loadTimeline,
    // Helpers
    getUserById,
    // Organogram & Mural via API direto nos componentes
    organogramApi,
    muralApi,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
