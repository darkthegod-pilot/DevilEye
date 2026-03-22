import { useCallback, useRef, useState, useMemo } from 'react'
import {
  ReactFlow, addEdge, useNodesState, useEdgesState,
  Background, Controls, MiniMap, Panel,
  BackgroundVariant, MarkerType, Handle, Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  User, Building2, Phone, MapPin, Car, CreditCard,
  Calendar, FileSearch, Compass, AlertTriangle, Plus, Trash2, Info
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp } from '@/context/AppContext'

const NODE_TYPE_CONFIG = {
  person:     { icon: User,          label: 'Pessoa',     color: '#00c2e0', bg: 'rgba(0,194,224,0.08)', border: 'rgba(0,194,224,0.3)' },
  company:    { icon: Building2,     label: 'Empresa',    color: '#1d7da3', bg: 'rgba(30,107,138,0.08)', border: 'rgba(30,107,138,0.3)' },
  phone:      { icon: Phone,         label: 'Telefone',   color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)' },
  address:    { icon: MapPin,        label: 'Endereço',   color: '#64748b', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.2)' },
  vehicle:    { icon: Car,           label: 'Veículo',    color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.2)' },
  account:    { icon: CreditCard,    label: 'Conta',      color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.25)' },
  event:      { icon: Calendar,      label: 'Evento',     color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
  evidence:   { icon: FileSearch,    label: 'Prova',      color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)' },
  location:   { icon: Compass,       label: 'Local',      color: '#0891b2', bg: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.25)' },
  occurrence: { icon: AlertTriangle, label: 'Ocorrência', color: '#b45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.25)' },
}

function BaseNode({ data, selected, type }) {
  const config = NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG.person
  const Icon = config.icon
  const { openSidePanel } = useApp()

  return (
    <div
      style={{
        background: config.bg,
        borderColor: selected ? config.color : config.border,
        boxShadow: selected ? `0 0 0 1px ${config.color}40, 0 0 12px ${config.color}15` : 'none',
        minWidth: 140,
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
      onDoubleClick={() => openSidePanel('organogram-node', { ...data, type })}
    >
      {/* Top accent stripe */}
      <div style={{ height: 2, background: config.color, position: 'absolute', top: 0, left: 0, right: 0 }} />

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#1a2030', border: `2px solid ${config.border}`, width: 8, height: 8, top: -4 }}
      />

      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Icon size={12} style={{ color: config.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#dde6f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {data.label}
          </span>
        </div>
        {data.subtitle && (
          <p style={{ fontSize: 10, color: '#546a82', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.subtitle}
          </p>
        )}
      </div>

      {data.critical && (
        <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#1a2030', border: `2px solid ${config.border}`, width: 8, height: 8, bottom: -4 }}
      />
    </div>
  )
}

// Create separate components for each type to avoid re-registration issues
const nodeTypes = Object.keys(NODE_TYPE_CONFIG).reduce((acc, type) => {
  acc[type] = (props) => <BaseNode {...props} type={type} />
  return acc
}, {})

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#252d3d', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#252d3d', width: 14, height: 14 },
}

function loadLayout(caseId) {
  try {
    const saved = localStorage.getItem(`organogram-${caseId}`)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

let saveTimer = null
function debouncedSave(caseId, nodes, edges) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    localStorage.setItem(`organogram-${caseId}`, JSON.stringify({ nodes, edges }))
  }, 500)
}

const NODE_TYPE_LIST = Object.entries(NODE_TYPE_CONFIG).map(([id, cfg]) => ({ id, ...cfg }))

export function Organogram({ caseId }) {
  const { organogramLayouts, openSidePanel } = useApp()
  const [selectedType, setSelectedType] = useState('person')
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const saved = loadLayout(caseId)
  const defaultLayout = organogramLayouts[caseId] || { nodes: [], edges: [] }
  const initialNodes = (saved?.nodes || defaultLayout.nodes).map(n => ({ ...n, draggable: true }))
  const initialEdges = saved?.edges || defaultLayout.edges

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params) => {
    setEdges(eds => {
      const updated = addEdge({ ...params, ...defaultEdgeOptions }, eds)
      debouncedSave(caseId, nodes, updated)
      return updated
    })
  }, [caseId, nodes, setEdges])

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    setNodes(nds => { debouncedSave(caseId, nds, edges); return nds })
  }, [onNodesChange, caseId, edges, setNodes])

  const addNode = useCallback(() => {
    const config = NODE_TYPE_CONFIG[selectedType]
    const newNode = {
      id: `node-${Date.now()}`,
      type: selectedType,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: { label: `Novo ${config.label}`, subtitle: '', critical: false, tags: [] },
      draggable: true,
    }
    setNodes(nds => {
      const updated = [...nds, newNode]
      debouncedSave(caseId, updated, edges)
      return updated
    })
  }, [selectedType, caseId, edges, setNodes])

  const deleteSelected = useCallback(() => {
    setNodes(nds => {
      const updated = nds.filter(n => !n.selected)
      debouncedSave(caseId, updated, edges)
      return updated
    })
    setEdges(eds => eds.filter(e => !e.selected))
  }, [caseId, edges, setNodes, setEdges])

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0d12' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1d2433" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const config = NODE_TYPE_CONFIG[node.type]
            return config ? config.color : '#252d3d'
          }}
          maskColor="rgba(30, 107, 138, 0.12)"
          style={{ background: '#0f1318', border: '1px solid #252d3d', borderRadius: 8 }}
        />

        {/* Top toolbar */}
        <Panel position="top-center">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#1a2030', border: '1px solid #252d3d',
            borderRadius: 10, padding: '8px 10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <span style={{ fontSize: 10, color: '#546a82', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo:</span>
            {NODE_TYPE_LIST.map(({ id, label, color, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', border: 'none',
                  background: selectedType === id ? `rgba(${color === '#00c2e0' ? '0,194,224' : '30,107,138'},0.15)` : 'transparent',
                  color: selectedType === id ? color : '#546a82',
                  transition: 'all 0.15s',
                  outline: selectedType === id ? `1px solid ${color}40` : 'none',
                }}
              >
                <Icon size={11} style={{ color: selectedType === id ? color : '#546a82' }} />
                <span>{label}</span>
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: '#252d3d', margin: '0 4px' }} />
            <button
              onClick={addNode}
              title="Adicionar nó"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: 'rgba(0,194,224,0.12)', color: '#00c2e0',
                border: '1px solid rgba(0,194,224,0.25)', fontWeight: 600,
              }}
            >
              <Plus size={12} />
              Adicionar
            </button>
            <button
              onClick={deleteSelected}
              title="Excluir selecionado (Delete)"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: 'transparent', color: '#546a82',
                border: '1px solid transparent',
              }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </Panel>

        {/* Hint */}
        <Panel position="bottom-left">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(26,32,48,0.8)', border: '1px solid #1d2433',
            borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#546a82',
          }}>
            <Info size={10} />
            Duplo-clique num nó para ver detalhes · Delete para excluir · Shift para multi-seleção
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
