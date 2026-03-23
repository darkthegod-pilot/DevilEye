const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/cases/:caseId/mural
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await prisma.muralItem.findMany({
      where: { caseId: req.params.caseId },
      orderBy: { createdAt: 'asc' },
    })
    res.json(items)
  } catch (err) {
    console.error('[mural/list]', err)
    res.status(500).json({ message: 'Erro ao carregar mural.' })
  }
})

// POST /api/cases/:caseId/mural — criar item
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type = 'sticky', color = 'general', x = 0, y = 0, width = 220, content = '' } = req.body
    const item = await prisma.muralItem.create({
      data: { caseId: req.params.caseId, type, color, x, y, width, content },
    })
    res.status(201).json(item)
  } catch (err) {
    console.error('[mural/create]', err)
    res.status(500).json({ message: 'Erro ao criar item do mural.' })
  }
})

// PUT /api/mural/:itemId — atualizar item
router.put('/:itemId', authMiddleware, async (req, res) => {
  try {
    const { color, x, y, width, content } = req.body
    const data = {}
    if (color !== undefined) data.color = color
    if (x !== undefined) data.x = x
    if (y !== undefined) data.y = y
    if (width !== undefined) data.width = width
    if (content !== undefined) data.content = content

    const item = await prisma.muralItem.update({ where: { id: req.params.itemId }, data })
    res.json(item)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Item não encontrado.' })
    console.error('[mural/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar item do mural.' })
  }
})

// DELETE /api/mural/:itemId
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    await prisma.muralItem.delete({ where: { id: req.params.itemId } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Item não encontrado.' })
    console.error('[mural/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir item do mural.' })
  }
})

module.exports = router
