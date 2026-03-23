require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ─── Arquivos de Upload (acesso estático) ────────────────────────────────────
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsDir))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', env: process.env.NODE_ENV })
})

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'))
app.use('/api/users',       require('./routes/users'))
app.use('/api/cases',       require('./routes/cases'))

// Rotas aninhadas nos casos
const caseRouter = require('./routes/cases')
app.use('/api/cases/:caseId/profiles',    require('./routes/profiles'))
app.use('/api/cases/:caseId/notes',       require('./routes/notes'))
app.use('/api/cases/:caseId/tasks',       require('./routes/tasks'))
app.use('/api/cases/:caseId/queries',     require('./routes/queries'))
app.use('/api/cases/:caseId/attachments', require('./routes/attachments'))
app.use('/api/cases/:caseId/timeline',    require('./routes/timeline'))
app.use('/api/cases/:caseId/organogram',  require('./routes/organogram'))
app.use('/api/cases/:caseId/mural',       require('./routes/mural'))

// Rotas diretas (para atualização/deleção sem caseId)
app.use('/api/profiles',    require('./routes/profiles'))
app.use('/api/notes',       require('./routes/notes'))
app.use('/api/tasks',       require('./routes/tasks'))
app.use('/api/queries',     require('./routes/queries'))
app.use('/api/attachments', require('./routes/attachments'))
app.use('/api/mural',       require('./routes/mural'))

// ─── Handler de erros global ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Erro interno no servidor.' })
})

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.url}` })
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 DevilEye API rodando na porta ${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})

module.exports = app
