const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

function parseCase(c) {
  return { ...c, tags: JSON.parse(c.tags || '[]') }
}

// GET /api/cases
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, priority, risk, q } = req.query
    const where = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (risk) where.risk = risk
    if (q) where.OR = [
      { title: { contains: q } },
      { ref: { contains: q } },
      { summary: { contains: q } },
    ]

    const cases = await prisma.case.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true, initials: true, role: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(cases.map(parseCase))
  } catch (err) {
    console.error('[cases/list]', err)
    res.status(500).json({ message: 'Erro ao listar casos.' })
  }
})

// POST /api/cases
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, summary, status = 'active', priority = 'medium', risk = 'medium', assignedToId, tags = [] } = req.body
    if (!title) return res.status(400).json({ message: 'O título é obrigatório.' })

    const year = new Date().getFullYear()
    const count = await prisma.case.count()
    const ref = `INV-${year}-${String(count + 1).padStart(3, '0')}`

    const c = await prisma.case.create({
      data: {
        ref, title, summary, status, priority, risk,
        assignedToId: assignedToId || req.user.id,
        tags: JSON.stringify(tags),
      },
      include: { assignedTo: { select: { id: true, name: true, initials: true, role: true } } },
    })

    // Cria evento de timeline automaticamente
    await prisma.timelineEvent.create({
      data: {
        caseId: c.id, type: 'case_created', title: 'Caso aberto',
        description: `Investigação iniciada por ${req.user.username}.`,
        authorId: req.user.id,
      },
    })

    res.status(201).json(parseCase(c))
  } catch (err) {
    console.error('[cases/create]', err)
    res.status(500).json({ message: 'Erro ao criar caso.' })
  }
})

// GET /api/cases/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const c = await prisma.case.findUnique({
      where: { id: req.params.id },
      include: { assignedTo: { select: { id: true, name: true, initials: true, role: true } } },
    })
    if (!c) return res.status(404).json({ message: 'Caso não encontrado.' })
    res.json(parseCase(c))
  } catch (err) {
    console.error('[cases/get]', err)
    res.status(500).json({ message: 'Erro ao buscar caso.' })
  }
})

// PUT /api/cases/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, summary, status, priority, risk, assignedToId, tags, closureStatus } = req.body
    const existing = await prisma.case.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Caso não encontrado.' })

    const data = {}
    if (title !== undefined) data.title = title
    if (summary !== undefined) data.summary = summary
    if (priority !== undefined) data.priority = priority
    if (risk !== undefined) data.risk = risk
    if (assignedToId !== undefined) data.assignedToId = assignedToId
    if (tags !== undefined) data.tags = JSON.stringify(tags)
    if (closureStatus !== undefined) data.closureStatus = closureStatus

    // Status change — cria evento de timeline
    if (status !== undefined && status !== existing.status) {
      data.status = status
      await prisma.timelineEvent.create({
        data: {
          caseId: req.params.id, type: 'status_change',
          title: 'Status atualizado',
          description: `Status alterado de "${existing.status}" para "${status}".`,
          authorId: req.user.id,
        },
      })
    }

    const c = await prisma.case.update({
      where: { id: req.params.id },
      data,
      include: { assignedTo: { select: { id: true, name: true, initials: true, role: true } } },
    })
    res.json(parseCase(c))
  } catch (err) {
    console.error('[cases/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar caso.' })
  }
})

// DELETE /api/cases/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.case.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Caso não encontrado.' })
    console.error('[cases/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir caso.' })
  }
})

module.exports = router
