import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Users, GitBranch, PenLine, Clock,
  Search, FileText, Paperclip, CheckSquare, Archive
} from 'lucide-react'
import { ReactFlowProvider } from '@xyflow/react'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'
import { CaseHeader } from './CaseHeader'
import { Overview } from './tabs/Overview'
import { Profiles } from './tabs/Profiles'
import { Organogram } from './tabs/Organogram'
import { FreeMural } from './tabs/FreeMural'
import { Timeline } from './tabs/Timeline'
import { Queries } from './tabs/Queries'
import { Notes } from './tabs/Notes'
import { Attachments } from './tabs/Attachments'
import { Tasks } from './tabs/Tasks'
import { Closure } from './tabs/Closure'

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'profiles', label: 'Investigados', icon: Users },
  { id: 'organogram', label: 'Organograma', icon: GitBranch },
  { id: 'mural', label: 'Mural Livre', icon: PenLine },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'queries', label: 'Consultas', icon: Search },
  { id: 'notes', label: 'Notas', icon: FileText },
  { id: 'attachments', label: 'Anexos', icon: Paperclip },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'closure', label: 'Fechamento', icon: Archive },
]

const TAB_COMPONENTS = {
  overview: Overview,
  profiles: Profiles,
  timeline: Timeline,
  queries: Queries,
  notes: Notes,
  attachments: Attachments,
  tasks: Tasks,
  closure: Closure,
  mural: FreeMural,
}

export function CaseDetail() {
  const { caseId, tab } = useParams()
  const navigate = useNavigate()
  const { cases, activeCaseTab, setActiveTab } = useApp()

  const c = cases.find(x => x.id === caseId)

  useEffect(() => {
    if (tab && TABS.find(t => t.id === tab)) {
      setActiveTab(tab)
    } else {
      setActiveTab('overview')
    }
  }, [tab, setActiveTab])

  if (!c) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Caso não encontrado.
      </div>
    )
  }

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    navigate(`/cases/${caseId}/${tabId}`, { replace: true })
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <CaseHeader c={c} />

      {/* Tab bar */}
      <div className="border-b border-border-main bg-bg-secondary overflow-x-auto shrink-0">
        <div className="flex px-6 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={cn('tab-btn', activeCaseTab === id ? 'tab-btn-active' : 'tab-btn-inactive')}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — use hidden/block to preserve state */}
      <div className="flex-1 overflow-hidden">
        {TABS.map(({ id }) => {
          const TabComponent = id === 'organogram' ? null : TAB_COMPONENTS[id]
          return (
            <div key={id} className={cn('h-full', activeCaseTab === id ? 'block' : 'hidden')}>
              {id === 'organogram' ? (
                <ReactFlowProvider>
                  <Organogram caseId={caseId} />
                </ReactFlowProvider>
              ) : TabComponent ? (
                <TabComponent caseId={caseId} c={c} />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
