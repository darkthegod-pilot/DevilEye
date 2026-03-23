const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/cases/:caseId/organogram
router.get('/', authMiddleware, async (req, res) => {
  try {
    const layout = await prisma.organogramLayout.findUnique({ where: { caseId: req.params.caseId } })
    if (!layout) return res.json({ nodes: [], edges: [] })
    res.json({
      nodes: JSON.parse(layout.nodes || '[]'),
      edges: JSON.parse(layout.edges || '[]'),
    })
  } catch (err) {
    console.error('[organogram/get]', err)
    res.status(500).json({ message: 'Erro ao carregar organograma.' })
  }
})

// PUT /api/cases/:caseId/organogram
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { nodes = [], edges = [] } = req.body
    const layout = await prisma.organogramLayout.upsert({
      where: { caseId: req.params.caseId },
      update: { nodes: JSON.stringify(nodes), edges: JSON.stringify(edges) },
      create: { caseId: req.params.caseId, nodes: JSON.stringify(nodes), edges: JSON.stringify(edges) },
    })
    res.json({
      nodes: JSON.parse(layout.nodes),
      edges: JSON.parse(layout.edges),
    })
  } catch (err) {
    console.error('[organogram/save]', err)
    res.status(500).json({ message: 'Erro ao salvar organograma.' })
  }
})

module.exports = router
