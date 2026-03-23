const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads')

// Garante que o diretório de uploads existe
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|mp4|mp3|zip|txt|csv)$/i
    if (allowed.test(path.extname(file.originalname))) cb(null, true)
    else cb(new Error('Tipo de arquivo não permitido.'))
  },
})

function detectType(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) return 'image'
  if (['.doc', '.docx'].includes(ext)) return 'doc'
  if (['.xls', '.xlsx', '.csv'].includes(ext)) return 'spreadsheet'
  if (['.mp4', '.mov', '.avi'].includes(ext)) return 'video'
  if (['.mp3', '.wav'].includes(ext)) return 'audio'
  return 'file'
}

// GET /api/cases/:caseId/attachments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { caseId: req.params.caseId },
      include: { uploadedBy: { select: { id: true, name: true, initials: true } } },
      orderBy: { uploadedAt: 'desc' },
    })
    res.json(attachments)
  } catch (err) {
    console.error('[attachments/list]', err)
    res.status(500).json({ message: 'Erro ao listar anexos.' })
  }
})

// POST /api/cases/:caseId/attachments (multipart/form-data)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { description, linkedProfileId } = req.body
    let name, size, filePath, type

    if (req.file) {
      name = req.file.originalname
      size = `${(req.file.size / 1024 / 1024).toFixed(1)} MB`
      filePath = req.file.filename
      type = detectType(req.file.originalname)
    } else if (req.body.name) {
      // Metadados sem arquivo real (retrocompat com mock)
      name = req.body.name
      size = req.body.size || null
      filePath = null
      type = req.body.type || detectType(req.body.name)
    } else {
      return res.status(400).json({ message: 'Arquivo ou nome do documento é obrigatório.' })
    }

    const att = await prisma.attachment.create({
      data: {
        caseId: req.params.caseId, name, type, size,
        description: description || null,
        filePath: filePath || null,
        uploadedById: req.user.id,
        linkedProfileId: linkedProfileId || null,
      },
      include: { uploadedBy: { select: { id: true, name: true, initials: true } } },
    })

    await prisma.timelineEvent.create({
      data: {
        caseId: req.params.caseId, type: 'attachment_added',
        title: 'Documento anexado',
        description: `"${name}" adicionado ao caso.`,
        authorId: req.user.id, entityType: 'attachment', entityId: att.id,
      },
    })

    res.status(201).json(att)
  } catch (err) {
    console.error('[attachments/create]', err)
    res.status(500).json({ message: err.message || 'Erro ao criar anexo.' })
  }
})

// GET /api/attachments/:id/download
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const att = await prisma.attachment.findUnique({ where: { id: req.params.id } })
    if (!att) return res.status(404).json({ message: 'Anexo não encontrado.' })
    if (!att.filePath) return res.status(404).json({ message: 'Arquivo não disponível.' })

    const fullPath = path.join(UPLOADS_DIR, att.filePath)
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'Arquivo não encontrado no servidor.' })

    res.download(fullPath, att.name)
  } catch (err) {
    console.error('[attachments/download]', err)
    res.status(500).json({ message: 'Erro ao baixar arquivo.' })
  }
})

// DELETE /api/attachments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const att = await prisma.attachment.findUnique({ where: { id: req.params.id } })
    if (!att) return res.status(404).json({ message: 'Anexo não encontrado.' })

    // Remove arquivo do disco se existir
    if (att.filePath) {
      const fullPath = path.join(UPLOADS_DIR, att.filePath)
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
    }

    await prisma.attachment.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    console.error('[attachments/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir anexo.' })
  }
})

module.exports = router
