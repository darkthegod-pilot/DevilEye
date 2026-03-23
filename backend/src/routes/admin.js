const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// Middleware que verifica se é admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito a administradores.' })
  }
  next()
}

// GET /api/admin/users — lista todos os usuários com detalhes
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, initials: true, username: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (err) {
    console.error('[admin/users/list]', err)
    res.status(500).json({ message: 'Erro ao listar usuários.' })
  }
})

// POST /api/admin/users — criar novo usuário
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, initials, username, password, role = 'operator' } = req.body
    if (!name || !initials || !username || !password)
      return res.status(400).json({ message: 'Nome, iniciais, usuário e senha são obrigatórios.' })
    if (password.length < 6)
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' })

    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return res.status(409).json({ message: 'Nome de usuário já está em uso.' })

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, initials: initials.toUpperCase(), username, password: hash, role },
      select: { id: true, name: true, initials: true, username: true, role: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err) {
    console.error('[admin/users/create]', err)
    res.status(500).json({ message: 'Erro ao criar usuário.' })
  }
})

// PUT /api/admin/users/:id — atualizar usuário
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, initials, username, password, role } = req.body
    const data = {}
    if (name) data.name = name
    if (initials) data.initials = initials.toUpperCase()
    if (username) data.username = username
    if (role) data.role = role
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' })
      data.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, initials: true, username: true, role: true, createdAt: true },
    })
    res.json(user)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Usuário não encontrado.' })
    if (err.code === 'P2002') return res.status(409).json({ message: 'Nome de usuário já está em uso.' })
    console.error('[admin/users/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar usuário.' })
  }
})

// DELETE /api/admin/users/:id — remover usuário
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'Não é possível excluir seu próprio usuário.' })
    await prisma.user.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Usuário não encontrado.' })
    console.error('[admin/users/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir usuário.' })
  }
})

// GET /api/admin/stats — estatísticas do sistema
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [users, cases, notes, tasks, profiles] = await Promise.all([
      prisma.user.count(),
      prisma.case.count(),
      prisma.note.count(),
      prisma.task.count(),
      prisma.profile.count(),
    ])
    res.json({ users, cases, notes, tasks, profiles })
  } catch (err) {
    console.error('[admin/stats]', err)
    res.status(500).json({ message: 'Erro ao obter estatísticas.' })
  }
})

module.exports = router
