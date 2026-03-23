import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Image, File, Upload, Download, Eye, Trash2, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const TYPE_CONFIG = {
  pdf:   { icon: FileText, color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/20' },
  image: { icon: Image,    color: 'text-primary-hover', bg: 'bg-primary/10', border: 'border-primary/20' },
  doc:   { icon: FileText, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  default: { icon: File,   color: 'text-text-muted', bg: 'bg-bg-surface', border: 'border-border-main' },
}

function UploadModal({ open, onClose, caseId }) {
  const { uploadAttachment, toast } = useApp()
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('description', description)
      await uploadAttachment(caseId, fd)
      toast('Arquivo anexado com sucesso!', 'success')
      onClose()
      setFile(null)
      setDescription('')
    } catch { toast('Erro ao fazer upload.', 'error') }
    finally { setLoading(false) }
  }

  const inputClass = "w-full bg-bg-surface border border-border-main rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none transition-colors"

  return (
    <Modal open={open} onClose={onClose} title="Anexar Arquivo" size="md">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            file ? 'border-primary/40 bg-primary/5' : 'border-border-main hover:border-primary/40 hover:bg-bg-hover'
          )}
        >
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={20} className="text-accent" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="ml-2 text-text-muted hover:text-alert">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Arraste um arquivo ou clique para selecionar</p>
              <p className="text-xs text-text-muted mt-1">PDF, imagens, documentos...</p>
            </>
          )}
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Descrição</label>
          <input className={inputClass} placeholder="Descreva o conteúdo do arquivo..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={!file || loading}>
            {loading ? 'Enviando...' : 'Anexar Arquivo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AttachmentCard({ att, caseId }) {
  const config = TYPE_CONFIG[att.type] || TYPE_CONFIG.default
  const Icon = config.icon

  return (
    <div className="card p-4 flex items-start gap-4 hover:border-border-main transition-all group">
      <div className={cn('p-3 rounded-lg border shrink-0', config.bg, config.border)}>
        <Icon size={20} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">{att.name}</p>
        {att.description && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">{att.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
          <span>{att.size}</span>
          <span>·</span>
          <span>{format(new Date(att.uploadedAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
          {att.linkedProfileId && (
            <>
              <span>·</span>
              <span className="text-accent">Vinculado a investigado</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {att.filePath && (
          <a
            href={`/uploads/${att.filePath.split('/').pop()}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors"
            title="Visualizar"
            onClick={e => e.stopPropagation()}
          >
            <Eye size={13} />
          </a>
        )}
        {att.filePath && (
          <a
            href={`/uploads/${att.filePath.split('/').pop()}`}
            download={att.name}
            className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors"
            title="Baixar"
            onClick={e => e.stopPropagation()}
          >
            <Download size={13} />
          </a>
        )}
        <button
          className="p-1.5 rounded text-text-muted hover:text-alert hover:bg-alert/10 transition-colors"
          title="Remover"
          onClick={() => att.onDelete && att.onDelete(att)}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export function Attachments({ caseId }) {
  const { attachments, loadAttachments, deleteAttachment, toast } = useApp()
  const [uploadOpen, setUploadOpen] = useState(false)
  useEffect(() => { if (caseId) loadAttachments(caseId) }, [caseId])
  const caseAttachments = attachments[caseId] || []

  const pdfs = caseAttachments.filter(a => a.type === 'pdf')
  const images = caseAttachments.filter(a => a.type === 'image')
  const others = caseAttachments.filter(a => a.type !== 'pdf' && a.type !== 'image')

  const handleDelete = async (att) => {
    if (!confirm(`Remover "${att.name}"?`)) return
    try {
      await deleteAttachment(caseId, att.id)
      toast('Arquivo removido.', 'info')
    } catch { toast('Erro ao remover arquivo.', 'error') }
  }

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Anexos e Evidências</h2>
          <p className="text-xs text-text-muted mt-0.5">{caseAttachments.length} arquivo{caseAttachments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setUploadOpen(true)}>
          <Upload size={13} />
          Anexar Arquivo
        </Button>
      </div>

      {/* Stats */}
      {caseAttachments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'PDFs', count: pdfs.length, color: 'text-alert' },
            { label: 'Imagens', count: images.length, color: 'text-primary-hover' },
            { label: 'Outros', count: others.length, color: 'text-text-muted' },
          ].map(stat => (
            <div key={stat.label} className="card p-3 text-center">
              <div className={cn('text-2xl font-bold', stat.color)}>{stat.count}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {caseAttachments.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="Nenhum anexo"
          description="Adicione documentos, imagens, PDFs e outros arquivos relacionados ao caso."
          action={{ label: 'Anexar Arquivo', onClick: () => setUploadOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {caseAttachments.map(att => (
            <AttachmentCard key={att.id} att={{ ...att, onDelete: handleDelete }} caseId={caseId} />
          ))}
        </div>
      )}

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} caseId={caseId} />
    </div>
  )
}
