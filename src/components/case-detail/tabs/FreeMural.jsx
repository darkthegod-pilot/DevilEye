import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Trash2, Lightbulb, AlertTriangle, CheckCircle, StickyNote, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { useApp } from '@/context/AppContext'

const NOTE_COLORS = {
  general: { bg: '#1a2030', border: '#252d3d', title: '#94a3b8', accent: '#252d3d' },
  hypothesis: { bg: '#1a1500', border: '#d97706', title: '#d97706', accent: '#d97706' },
  alert: { bg: '#1a0a0a', border: '#dc2626', title: '#dc2626', accent: '#dc2626' },
  confirmed: { bg: '#0a1a0d', border: '#16a34a', title: '#16a34a', accent: '#16a34a' },
  info: { bg: '#0a1220', border: '#1e6b8a', title: '#00c2e0', accent: '#1e6b8a' },
}

const NOTE_TYPE_BTN = [
  { id: 'general', icon: StickyNote, label: 'Nota' },
  { id: 'hypothesis', icon: Lightbulb, label: 'Hipótese' },
  { id: 'alert', icon: AlertTriangle, label: 'Alerta' },
  { id: 'confirmed', icon: CheckCircle, label: 'Confirmado' },
  { id: 'info', icon: StickyNote, label: 'Informação' },
]

let updateTimer = {}
function debouncedApiUpdate(muralApi, id, patch) {
  clearTimeout(updateTimer[id])
  updateTimer[id] = setTimeout(() => {
    muralApi.update(id, patch).catch(() => {})
  }, 600)
}

function MuralNote({ note, onUpdate, onDelete, zoom }) {
  const colors = NOTE_COLORS[note.color] || NOTE_COLORS.general
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
    e.preventDefault()
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: note.x, oy: note.y }

    const handleMove = (me) => {
      const dx = (me.clientX - dragStart.current.mx) / zoom
      const dy = (me.clientY - dragStart.current.my) / zoom
      onUpdate(note.id, { x: dragStart.current.ox + dx, y: dragStart.current.oy + dy }, false)
    }
    const handleUp = (me) => {
      setDragging(false)
      const dx = (me.clientX - dragStart.current.mx) / zoom
      const dy = (me.clientY - dragStart.current.my) / zoom
      onUpdate(note.id, { x: dragStart.current.ox + dx, y: dragStart.current.oy + dy }, true)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: note.width || 220,
        cursor: dragging ? 'grabbing' : 'grab',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${colors.border}22`,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar */}
      <div style={{
        padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.border}44`,
        background: `${colors.accent}10`,
        borderRadius: '8px 8px 0 0',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: colors.title, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {note.color || 'nota'}
        </span>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => onDelete(note.id)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#546a82', padding: 2 }}
        >
          <Trash2 size={11} />
        </button>
      </div>
      {/* Content */}
      <textarea
        value={note.content}
        onChange={e => onUpdate(note.id, { content: e.target.value }, true)}
        onMouseDown={e => e.stopPropagation()}
        placeholder="Escreva aqui..."
        style={{
          width: '100%', minHeight: 80, padding: '8px 10px',
          background: 'transparent', border: 'none', resize: 'none',
          color: '#dde6f0', fontSize: 12, lineHeight: 1.5,
          outline: 'none', cursor: 'text', fontFamily: 'Inter, sans-serif',
          userSelect: 'text',
        }}
      />
    </div>
  )
}

export function FreeMural({ caseId }) {
  const { muralApi } = useApp()
  const [items, setItems] = useState([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef(null)
  const containerRef = useRef(null)
  const [selectedColor, setSelectedColor] = useState('general')

  useEffect(() => {
    if (!caseId) return
    muralApi.list(caseId).then(data => setItems(data || [])).catch(() => {})
  }, [caseId])

  const addNote = async () => {
    const newItem = {
      type: 'sticky',
      color: selectedColor,
      x: (300 - pan.x) / zoom + Math.random() * 100,
      y: (200 - pan.y) / zoom + Math.random() * 80,
      width: 220,
      content: '',
    }
    try {
      const created = await muralApi.create(caseId, newItem)
      setItems(prev => [...prev, created])
    } catch {
      // Optimistic fallback
      setItems(prev => [...prev, { ...newItem, id: `mn-${Date.now()}` }])
    }
  }

  const updateItem = useCallback((id, updates, persist = true) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
    if (persist) debouncedApiUpdate(muralApi, id, updates)
  }, [muralApi])

  const deleteItem = useCallback(async (id) => {
    setItems(prev => prev.filter(item => item.id !== id))
    muralApi.delete(id).catch(() => {})
  }, [muralApi])

  const handleCanvasMouseDown = (e) => {
    if (e.target !== containerRef.current && e.target !== containerRef.current.firstChild) return
    setIsPanning(true)
    panStart.current = { mx: e.clientX, my: e.clientY, ox: pan.x, oy: pan.y }

    const handleMove = (me) => {
      setPan({ x: panStart.current.ox + me.clientX - panStart.current.mx, y: panStart.current.oy + me.clientY - panStart.current.my })
    }
    const handleUp = () => {
      setIsPanning(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.min(2, Math.max(0.3, z * delta)))
  }

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0a0d12' }}>
      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
      >
        {/* Dot grid */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, #1d2433 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Transformed canvas */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', width: '100%', height: '100%' }}>
          {items.map(item => (
            <MuralNote key={item.id} note={item} onUpdate={updateItem} onDelete={deleteItem} zoom={zoom} />
          ))}
          {items.length === 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center', color: '#546a82', userSelect: 'none',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>⬜</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Mural de Análise</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Clique em "Adicionar Nota" para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#1a2030', border: '1px solid #252d3d', borderRadius: 12,
        padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}>
        {NOTE_TYPE_BTN.map(({ id, icon: Icon, label }) => {
          const colors = NOTE_COLORS[id]
          return (
            <button
              key={id}
              onClick={() => setSelectedColor(id)}
              title={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                border: selectedColor === id ? `1px solid ${colors.border}` : '1px solid transparent',
                background: selectedColor === id ? `${colors.accent}15` : 'transparent',
                color: selectedColor === id ? colors.accent : '#546a82',
                fontSize: 11, transition: 'all 0.15s',
              }}
            >
              <Icon size={12} style={{ color: selectedColor === id ? colors.accent : '#546a82' }} />
              {label}
            </button>
          )
        })}
        <div style={{ width: 1, height: 20, background: '#252d3d' }} />
        <button
          onClick={addNote}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(0,194,224,0.12)', color: '#00c2e0',
            border: '1px solid rgba(0,194,224,0.25)', fontSize: 11, fontWeight: 600,
          }}
        >
          <Plus size={12} /> Adicionar Nota
        </button>
        <div style={{ width: 1, height: 20, background: '#252d3d' }} />
        <button onClick={() => setZoom(z => Math.min(2, z * 1.2))} title="Aproximar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#546a82', padding: '4px' }}>
          <ZoomIn size={14} />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} title="Afastar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#546a82', padding: '4px' }}>
          <ZoomOut size={14} />
        </button>
        <button onClick={resetView} title="Resetar visão" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#546a82', padding: '4px' }}>
          <Maximize size={14} />
        </button>
        <span style={{ fontSize: 10, color: '#546a82', marginLeft: 4 }}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}
