const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/cases/:caseId/queries
router.get('/', authMiddleware, async (req, res) => {
  try {
    const queries = await prisma.query.findMany({
      where: { caseId: req.params.caseId },
      include: { author: { select: { id: true, name: true, initials: true } } },
      orderBy: { timestamp: 'desc' },
    })
    res.json(queries)
  } catch (err) {
    console.error('[queries/list]', err)
    res.status(500).json({ message: 'Erro ao listar consultas.' })
  }
})

// POST /api/cases/:caseId/queries
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { source, queryType, queryParam, status = 'pending', reliability, resultSummary, notes: notesTxt, linkedProfileId } = req.body
    if (!source || !queryType || !queryParam)
      return res.status(400).json({ message: 'Fonte, tipo e parâmetro são obrigatórios.' })

    const query = await prisma.query.create({
      data: {
        caseId: req.params.caseId, source, queryType, queryParam,
        status, reliability: reliability || null,
        resultSummary: resultSummary || null,
        notes: notesTxt || null,
        linkedProfileId: linkedProfileId || null,
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true, initials: true } } },
    })

    await prisma.timelineEvent.create({
      data: {
        caseId: req.params.caseId, type: 'query_added',
        title: 'Consulta registrada',
        description: `${queryType} consultado em ${source}.`,
        authorId: req.user.id, entityType: 'query', entityId: query.id,
      },
    })

    res.status(201).json(query)
  } catch (err) {
    console.error('[queries/create]', err)
    res.status(500).json({ message: 'Erro ao criar consulta.' })
  }
})

// PUT /api/queries/:queryId
router.put('/:queryId', authMiddleware, async (req, res) => {
  try {
    const allowed = ['source', 'queryType', 'queryParam', 'status', 'reliability', 'resultSummary', 'notes', 'linkedProfileId']
    const data = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f] || null })

    const query = await prisma.query.update({
      where: { id: req.params.queryId },
      data,
      include: { author: { select: { id: true, name: true, initials: true } } },
    })
    res.json(query)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Consulta não encontrada.' })
    console.error('[queries/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar consulta.' })
  }
})

// DELETE /api/queries/:queryId
router.delete('/:queryId', authMiddleware, async (req, res) => {
  try {
    await prisma.query.delete({ where: { id: req.params.queryId } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Consulta não encontrada.' })
    console.error('[queries/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir consulta.' })
  }
})

module.exports = router
