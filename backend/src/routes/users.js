const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, initials: true, username: true, role: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (err) {
    console.error('[users/list]', err)
    res.status(500).json({ message: 'Erro ao listar usuários.' })
  }
})

module.exports = router
