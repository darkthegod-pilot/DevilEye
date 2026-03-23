const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/cases/:caseId/timeline
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query
    const where = { caseId: req.params.caseId }
    if (type && type !== 'all') where.type = type

    const events = await prisma.timelineEvent.findMany({
      where,
      include: { author: { select: { id: true, name: true, initials: true } } },
      orderBy: { timestamp: 'desc' },
    })
    res.json(events)
  } catch (err) {
    console.error('[timeline/list]', err)
    res.status(500).json({ message: 'Erro ao listar eventos.' })
  }
})

// POST /api/cases/:caseId/timeline (evento manual)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type = 'manual', title, description, entityType, entityId } = req.body
    if (!title) return res.status(400).json({ message: 'Título é obrigatório.' })

    const event = await prisma.timelineEvent.create({
      data: {
        caseId: req.params.caseId, type, title,
        description: description || null,
        authorId: req.user.id,
        entityType: entityType || null,
        entityId: entityId || null,
      },
      include: { author: { select: { id: true, name: true, initials: true } } },
    })
    res.status(201).json(event)
  } catch (err) {
    console.error('[timeline/create]', err)
    res.status(500).json({ message: 'Erro ao criar evento.' })
  }
})

module.exports = router
