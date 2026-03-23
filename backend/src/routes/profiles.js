const router = require('express').Router({ mergeParams: true })
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

const JSON_FIELDS = ['aliases', 'phones', 'emails', 'addresses', 'tags', 'links']
function parseProfile(p) {
  const out = { ...p }
  JSON_FIELDS.forEach(f => { try { out[f] = JSON.parse(out[f] || '[]') } catch { out[f] = [] } })
  return out
}
function serializeProfile(data) {
  const out = { ...data }
  JSON_FIELDS.forEach(f => { if (Array.isArray(out[f])) out[f] = JSON.stringify(out[f]) })
  return out
}

// GET /api/cases/:caseId/profiles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { caseId: req.params.caseId },
      orderBy: [{ classification: 'asc' }, { name: 'asc' }],
    })
    res.json(profiles.map(parseProfile))
  } catch (err) {
    console.error('[profiles/list]', err)
    res.status(500).json({ message: 'Erro ao listar perfis.' })
  }
})

// POST /api/cases/:caseId/profiles
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, type = 'person', classification = 'secondary', ...rest } = req.body
    if (!name) return res.status(400).json({ message: 'Nome é obrigatório.' })

    const profile = await prisma.profile.create({
      data: serializeProfile({ name, type, classification, caseId: req.params.caseId, ...rest }),
    })

    await prisma.timelineEvent.create({
      data: {
        caseId: req.params.caseId, type: 'profile_added',
        title: 'Investigado cadastrado',
        description: `${name} (${type}) incluído no caso como ${classification}.`,
        authorId: req.user.id, entityType: 'profile', entityId: profile.id,
      },
    })

    res.status(201).json(parseProfile(profile))
  } catch (err) {
    console.error('[profiles/create]', err)
    res.status(500).json({ message: 'Erro ao criar perfil.' })
  }
})

// PUT /api/profiles/:profileId
router.put('/:profileId', authMiddleware, async (req, res) => {
  try {
    const profile = await prisma.profile.update({
      where: { id: req.params.profileId },
      data: serializeProfile(req.body),
    })
    res.json(parseProfile(profile))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Perfil não encontrado.' })
    console.error('[profiles/update]', err)
    res.status(500).json({ message: 'Erro ao atualizar perfil.' })
  }
})

// DELETE /api/profiles/:profileId
router.delete('/:profileId', authMiddleware, async (req, res) => {
  try {
    await prisma.profile.delete({ where: { id: req.params.profileId } })
    res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Perfil não encontrado.' })
    console.error('[profiles/delete]', err)
    res.status(500).json({ message: 'Erro ao excluir perfil.' })
  }
})

module.exports = router
