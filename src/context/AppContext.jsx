import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { CASES, USERS, PROFILES, NOTES, TASKS, QUERIES, ATTACHMENTS, TIMELINE_EVENTS, ORGANOGRAM_LAYOUTS } from '@/data/mockData'

const AppContext = createContext(null)

const initialState = {
  cases: [],
  profiles: PROFILES,
  notes: NOTES,
  tasks: TASKS,
  queries: QUERIES,
  attachments: ATTACHMENTS,
  timelineEvents: TIMELINE_EVENTS,
  organogramLayouts: ORGANOGRAM_LAYOUTS,
  activeCase: null,
  activeCaseTab: 'overview',
  sidePanel: { open: false, contentType: null, data: null },
  globalSearch: '',
  currentUser: USERS[0],
  caseViewMode: 'cards',
  isLoaded: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, cases: action.payload, isLoaded: true }

    case 'CREATE_CASE': {
      const newCases = [action.payload, ...state.cases]
      localStorage.setItem('devileye-cases', JSON.stringify(newCases))
      return { ...state, cases: newCases }
    }

    case 'UPDATE_CASE': {
      const newCases = state.cases.map(c => c.id === action.payload.id ? { ...c, ...action.payload.updates, updatedAt: new Date().toISOString() } : c)
      localStorage.setItem('devileye-cases', JSON.stringify(newCases))
      return { ...state, cases: newCases }
    }

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

    case 'ADD_NOTE': {
      const caseId = action.payload.caseId
      const updated = {
        ...state.notes,
        [caseId]: [action.payload, ...(state.notes[caseId] || [])],
      }
      return { ...state, notes: updated }
    }

    case 'ADD_TASK': {
      const caseId = action.payload.caseId
      const updated = {
        ...state.tasks,
        [caseId]: [...(state.tasks[caseId] || []), action.payload],
      }
      return { ...state, tasks: updated }
    }

    case 'UPDATE_TASK': {
      const { caseId, taskId, updates } = action.payload
      const updated = {
        ...state.tasks,
        [caseId]: (state.tasks[caseId] || []).map(t => t.id === taskId ? { ...t, ...updates } : t),
      }
      return { ...state, tasks: updated }
    }

    case 'ADD_TIMELINE_EVENT': {
      const caseId = action.payload.caseId
      const updated = {
        ...state.timelineEvents,
        [caseId]: [...(state.timelineEvents[caseId] || []), action.payload],
      }
      return { ...state, timelineEvents: updated }
    }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const saved = localStorage.getItem('devileye-cases')
    if (saved) {
      try {
        dispatch({ type: 'INIT', payload: JSON.parse(saved) })
      } catch {
        dispatch({ type: 'INIT', payload: CASES })
      }
    } else {
      dispatch({ type: 'INIT', payload: CASES })
    }
  }, [])

  const openSidePanel = useCallback((contentType, data) => {
    dispatch({ type: 'OPEN_SIDE_PANEL', payload: { contentType, data } })
  }, [])

  const closeSidePanel = useCallback(() => {
    dispatch({ type: 'CLOSE_SIDE_PANEL' })
  }, [])

  const setActiveTab = useCallback((tab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }, [])

  const createCase = useCallback((caseData) => {
    const newCase = {
      ...caseData,
      id: `case-${Date.now()}`,
      ref: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closureStatus: null,
      tags: caseData.tags || [],
    }
    dispatch({ type: 'CREATE_CASE', payload: newCase })
    return newCase
  }, [])

  const updateCase = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_CASE', payload: { id, updates } })
  }, [])

  const addNote = useCallback((note) => {
    const newNote = { ...note, id: `note-${Date.now()}`, createdAt: new Date().toISOString() }
    dispatch({ type: 'ADD_NOTE', payload: newNote })
  }, [])

  const addTask = useCallback((task) => {
    const newTask = { ...task, id: `task-${Date.now()}`, createdAt: new Date().toISOString() }
    dispatch({ type: 'ADD_TASK', payload: newTask })
  }, [])

  const updateTask = useCallback((caseId, taskId, updates) => {
    dispatch({ type: 'UPDATE_TASK', payload: { caseId, taskId, updates } })
  }, [])

  const getUserById = useCallback((id) => USERS.find(u => u.id === id), [])

  const value = {
    ...state,
    dispatch,
    openSidePanel,
    closeSidePanel,
    setActiveTab,
    createCase,
    updateCase,
    addNote,
    addTask,
    updateTask,
    getUserById,
    users: USERS,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
