import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Image, File, Upload, Download, Eye } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

const TYPE_CONFIG = {
  pdf:   { icon: FileText, color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/20' },
  image: { icon: Image,    color: 'text-primary-hover', bg: 'bg-primary/10', border: 'border-primary/20' },
  doc:   { icon: FileText, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  default: { icon: File,   color: 'text-text-muted', bg: 'bg-bg-surface', border: 'border-border-main' },
}

function AttachmentCard({ att }) {
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
        <button className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors" title="Visualizar">
          <Eye size={13} />
        </button>
        <button className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-bg-hover transition-colors" title="Baixar">
          <Download size={13} />
        </button>
      </div>
    </div>
  )
}

export function Attachments({ caseId }) {
  const { attachments } = useApp()
  const caseAttachments = attachments[caseId] || []

  const pdfs = caseAttachments.filter(a => a.type === 'pdf')
  const images = caseAttachments.filter(a => a.type === 'image')
  const others = caseAttachments.filter(a => a.type !== 'pdf' && a.type !== 'image')

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Anexos e Evidências</h2>
          <p className="text-xs text-text-muted mt-0.5">{caseAttachments.length} arquivo{caseAttachments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="accent" size="sm">
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
          action={{ label: 'Anexar Arquivo', onClick: () => {} }}
        />
      ) : (
        <div className="space-y-3">
          {caseAttachments.map(att => <AttachmentCard key={att.id} att={att} />)}
        </div>
      )}
    </div>
  )
}
