const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' })

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user)
      return res.status(401).json({ message: 'Credenciais inválidas.' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ message: 'Credenciais inválidas.' })

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    const { password: _, ...userData } = user
    res.json({ token, user: userData })
  } catch (err) {
    console.error('[auth/login]', err)
    res.status(500).json({ message: 'Erro interno no servidor.' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, initials: true, username: true, role: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' })
    res.json(user)
  } catch (err) {
    console.error('[auth/me]', err)
    res.status(500).json({ message: 'Erro interno no servidor.' })
  }
})

// PUT /api/auth/password — trocar senha
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' })
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' })

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(401).json({ message: 'Senha atual incorreta.' })

    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hash } })
    res.json({ message: 'Senha alterada com sucesso.' })
  } catch (err) {
    console.error('[auth/password]', err)
    res.status(500).json({ message: 'Erro interno no servidor.' })
  }
})

module.exports = router
