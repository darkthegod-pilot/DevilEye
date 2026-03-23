const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/cases/:caseId/notes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { caseId: req.params.caseId },
      include: { author: { select: { id: true, name: true, initials: true } } },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    })
    res.json(notes)
  } catch (err) {
    console.error('[notes/list]', err)
    res.status(500).json({ message: 'Erro ao listar notas.' })
  }
})

// POST /api/cases/:caseId/notes
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, type = 'quick', pinned = false, private: priv = false, linkedProfileId } = req.body
    if (!title || !content) return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' })

    const note = await prisma.note.create({
      data: {
        caseId: req.params.caseId, title, content, type,
        pinned, private: priv, linkedProfileId: linkedProfileId || null,
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true, initials: true } } },
    })

    await prisma.timelineEvent.create({
      data: {
        caseId: req.params.caseId, type: 'note_added',
        title: 'Nota registrada',
        description: `"${title}" (${type}) adicionada ao caso.`,
        authorId: req.user.id, entityType: 'note', entityId: note.id,
      },
    })

    res.status(201).json(note)
  } catch (err) {
    console.error('[notes/create]', err)
    res.status(500).json({ message: 'Erro ao criar nota.' })
  }
})

// PUT /api/notes/:noteId
router.put('/:noteId', authMiddleware, async (req, res) => {
  try {
    const { title, content, type, pinned, private: priv, linkedProfileId } = req.body
    const data = {}
    if (title !== undefined) data.title = title
    if (content !== undefined) data.content = content
    if (type !== undefined) data.type = type
    if (pinned !== undefined) data.pinned = pinned
    if (priv !== undefined) data.private = priv
    if (linkedProfileId !== undefined) data.linkedProfileId = linkedProfileId || null

    const note = await prisma.note.update({
      where: { id: req.params.noteId },
      data,
      include: { author: { select: { id: true, name: true, initials: true } } },
    })
    res.json(note)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Nota não encontrada.' })
    console.error('[notes/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar nota.' })
  }
})

// DELETE /api/notes/:noteId
router.delete('/:noteId', authMiddleware, async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: req.params.noteId } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Nota não encontrada.' })
    console.error('[notes/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir nota.' })
  }
})

module.exports = router
