const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/cases/:caseId/tasks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { caseId: req.params.caseId },
      include: { assignedTo: { select: { id: true, name: true, initials: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
    res.json(tasks)
  } catch (err) {
    console.error('[tasks/list]', err)
    res.status(500).json({ message: 'Erro ao listar tarefas.' })
  }
})

// POST /api/cases/:caseId/tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, assignedToId, priority = 'medium', dueDate, status = 'pending' } = req.body
    if (!title) return res.status(400).json({ message: 'O título é obrigatório.' })

    const task = await prisma.task.create({
      data: {
        caseId: req.params.caseId, title, description,
        assignedToId: assignedToId || req.user.id,
        priority, dueDate: dueDate || null, status,
      },
      include: { assignedTo: { select: { id: true, name: true, initials: true } } },
    })

    await prisma.timelineEvent.create({
      data: {
        caseId: req.params.caseId, type: 'task_added',
        title: 'Tarefa criada',
        description: `"${title}" criada por ${req.user.username}.`,
        authorId: req.user.id, entityType: 'task', entityId: task.id,
      },
    })

    res.status(201).json(task)
  } catch (err) {
    console.error('[tasks/create]', err)
    res.status(500).json({ message: 'Erro ao criar tarefa.' })
  }
})

// PUT /api/tasks/:taskId
router.put('/:taskId', authMiddleware, async (req, res) => {
  try {
    const { title, description, assignedToId, priority, dueDate, status } = req.body
    const data = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (assignedToId !== undefined) data.assignedToId = assignedToId
    if (priority !== undefined) data.priority = priority
    if (dueDate !== undefined) data.dueDate = dueDate || null
    if (status !== undefined) data.status = status

    const task = await prisma.task.update({
      where: { id: req.params.taskId },
      data,
      include: { assignedTo: { select: { id: true, name: true, initials: true } } },
    })
    res.json(task)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Tarefa não encontrada.' })
    console.error('[tasks/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar tarefa.' })
  }
})

// DELETE /api/tasks/:taskId
router.delete('/:taskId', authMiddleware, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.taskId } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Tarefa não encontrada.' })
    console.error('[tasks/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir tarefa.' })
  }
})

module.exports = router
