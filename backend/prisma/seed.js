const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpa dados existentes na ordem correta (cascade)
  await prisma.muralItem.deleteMany()
  await prisma.organogramLayout.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.query.deleteMany()
  await prisma.task.deleteMany()
  await prisma.note.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.case.deleteMany()
  await prisma.user.deleteMany()

  // Usuários
  const hash = await bcrypt.hash('devileye123', 10)
  const adminHash = await bcrypt.hash('admin123', 10)
  const [u0, u1, u2, u3] = await Promise.all([
    prisma.user.create({ data: { name: 'Administrador', initials: 'AD', username: 'admin', password: adminHash, role: 'admin' } }),
    prisma.user.create({ data: { name: 'Ag. Carvalho', initials: 'AC', username: 'carvalho', password: hash, role: 'operator' } }),
    prisma.user.create({ data: { name: 'Ana Soares', initials: 'AS', username: 'ana', password: hash, role: 'analyst' } }),
    prisma.user.create({ data: { name: 'Dir. Melo', initials: 'DM', username: 'melo', password: hash, role: 'supervisor' } }),
  ])
  console.log('  ✓ 4 usuários criados (incluindo admin)')

  // Casos
  const c1 = await prisma.case.create({
    data: {
      ref: 'INV-2024-001', title: 'Operação Espelho Negro', status: 'active',
      priority: 'high', risk: 'critical', assignedToId: u1.id,
      summary: 'Investigação de rede de fraude fiscal estruturada em múltiplas jurisdições com uso de empresas offshore e laranjas identificados.',
      tags: JSON.stringify(['fraude', 'fiscal', 'multinacional', 'offshore']),
      createdAt: new Date('2024-11-15T09:00:00Z'),
    },
  })
  const c2 = await prisma.case.create({
    data: {
      ref: 'INV-2024-002', title: 'Operação Nó Duplo', status: 'active',
      priority: 'high', risk: 'high', assignedToId: u2.id,
      summary: 'Apuração de organização criminosa voltada à lavagem de dinheiro via setor imobiliário em quatro municípios.',
      tags: JSON.stringify(['lavagem', 'imobiliário', 'organização criminosa']),
      createdAt: new Date('2024-10-08T10:30:00Z'),
    },
  })
  const c3 = await prisma.case.create({
    data: {
      ref: 'INV-2024-003', title: 'Operação Sombra Verde', status: 'pending',
      priority: 'medium', risk: 'medium', assignedToId: u1.id,
      summary: 'Investigação de desvio de recursos públicos em contratos de fornecimento de insumos hospitalares.',
      tags: JSON.stringify(['desvio', 'saúde pública', 'licitação']),
      createdAt: new Date('2024-09-22T08:00:00Z'),
    },
  })
  const c4 = await prisma.case.create({
    data: {
      ref: 'INV-2024-004', title: 'Operação Rede Silenciosa', status: 'active',
      priority: 'high', risk: 'critical', assignedToId: u3.id,
      summary: 'Mapeamento de rede de influência política com indícios de financiamento eleitoral ilícito.',
      tags: JSON.stringify(['político', 'financiamento', 'influência']),
      createdAt: new Date('2024-08-14T11:20:00Z'),
    },
  })
  const c5 = await prisma.case.create({
    data: {
      ref: 'INV-2023-017', title: 'Operação Conta Dupla', status: 'closed',
      priority: 'medium', risk: 'high', assignedToId: u2.id,
      summary: 'Investigação concluída de sonegação fiscal sistemática por empresa de médio porte.',
      tags: JSON.stringify(['sonegação', 'fiscal', 'concluído']),
      closureStatus: 'encerrado',
      createdAt: new Date('2023-07-10T14:00:00Z'),
    },
  })
  const c6 = await prisma.case.create({
    data: {
      ref: 'INV-2024-005', title: 'Operação Fio Condutor', status: 'pending',
      priority: 'low', risk: 'medium', assignedToId: u1.id,
      summary: 'Apuração preliminar de irregularidades em contratos municipais de obra pública.',
      tags: JSON.stringify(['obras', 'municipal', 'contrato']),
      createdAt: new Date('2024-12-01T08:30:00Z'),
    },
  })
  const c7 = await prisma.case.create({
    data: {
      ref: 'INV-2024-006', title: 'Operação Corrente Oculta', status: 'suspended',
      priority: 'medium', risk: 'high', assignedToId: u3.id,
      summary: 'Investigação suspensa por decisão judicial. Envolve possível participação de funcionários públicos em esquema de extorsão.',
      tags: JSON.stringify(['extorsão', 'suspensa', 'funcional']),
      createdAt: new Date('2024-06-18T09:00:00Z'),
    },
  })
  const c8 = await prisma.case.create({
    data: {
      ref: 'INV-2023-024', title: 'Operação Arquivo Morto', status: 'closed',
      priority: 'low', risk: 'low', assignedToId: u2.id,
      summary: 'Caso encerrado por insuficiência de provas. Irregularidades contábeis sem indício criminal.',
      tags: JSON.stringify(['previdência', 'encerrado', 'arquivado']),
      closureStatus: 'arquivado',
      createdAt: new Date('2023-03-05T10:00:00Z'),
    },
  })
  console.log('  ✓ 8 casos criados')

  // Perfis do caso 1
  const p1 = await prisma.profile.create({
    data: {
      caseId: c1.id, type: 'person', name: 'Ricardo Fonseca',
      aliases: JSON.stringify(['Ricardão', 'RF', 'O Contador']),
      document: '***.***.***-47',
      phones: JSON.stringify(['+55 11 98765-4321', '+55 11 3456-7890']),
      emails: JSON.stringify(['rfonseca.adv@protonmail.com']),
      addresses: JSON.stringify(['R. Augusta, 1200, cj. 84 — São Paulo/SP']),
      classification: 'primary',
      notes: 'Principal suspeito. Advogado tributarista com histórico de consultorias para empresas envolvidas em planejamentos fiscais agressivos.',
      tags: JSON.stringify(['advogado', 'sócio', 'principal']),
      links: JSON.stringify([{ targetId: 'p2', type: 'socio', label: 'Sócio em 3 empresas' }]),
    },
  })
  const p2 = await prisma.profile.create({
    data: {
      caseId: c1.id, type: 'company', name: 'FONSECA & ASSOCIADOS LTDA',
      aliases: JSON.stringify(['Fonseca Adv', 'FA']),
      document: '12.345.678/0001-99',
      phones: JSON.stringify(['+55 11 3456-7890']),
      emails: JSON.stringify(['contato@fonsecaadv.com.br']),
      addresses: JSON.stringify(['Av. Paulista, 800, andar 12 — São Paulo/SP']),
      classification: 'secondary',
      notes: 'Escritório de advocacia usado como fachada para movimentação de recursos.',
      tags: JSON.stringify(['empresa', 'fachada', 'advocacia']),
      links: JSON.stringify([]),
    },
  })
  const p3 = await prisma.profile.create({
    data: {
      caseId: c1.id, type: 'person', name: 'Mariana Velloso',
      aliases: JSON.stringify(['Mari', 'MV']),
      document: '***.***.***-82',
      phones: JSON.stringify(['+55 21 97654-3210']),
      emails: JSON.stringify(['m.velloso@empresaxy.com']),
      addresses: JSON.stringify(['R. Visconde de Pirajá, 550 — Rio de Janeiro/RJ']),
      classification: 'associate',
      notes: 'Sócia oculta em três das empresas offshore. Parente de segundo grau de Ricardo Fonseca.',
      tags: JSON.stringify(['sócia oculta', 'offshore', 'familiar']),
      links: JSON.stringify([]),
    },
  })
  console.log('  ✓ Perfis criados')

  // Timeline caso 1
  const events = [
    { type: 'case_created', title: 'Caso aberto', description: 'Investigação iniciada após denúncia anônima recebida pela ouvidoria.', timestamp: new Date('2024-11-15T09:00:00Z'), authorId: u1.id },
    { type: 'profile_added', title: 'Investigado cadastrado', description: 'Ricardo Fonseca incluído como alvo principal do caso.', timestamp: new Date('2024-11-15T10:30:00Z'), authorId: u1.id },
    { type: 'query_added', title: 'Consulta realizada', description: 'CPF do investigado consultado na Receita Federal. Retorno: regular, sócio em 4 empresas.', timestamp: new Date('2024-11-18T10:30:00Z'), authorId: u1.id },
    { type: 'note_added', title: 'Nota analítica registrada', description: 'Padrão de movimentação financeira atípico identificado.', timestamp: new Date('2024-11-20T11:00:00Z'), authorId: u2.id },
    { type: 'profile_added', title: 'Empresa cadastrada', description: 'Fonseca & Associados Ltda identificada como fachada. Incluída no caso.', timestamp: new Date('2024-11-22T14:00:00Z'), authorId: u1.id },
    { type: 'attachment_added', title: 'Documento anexado', description: 'Extrato bancário de novembro/2024 obtido via autorização judicial.', timestamp: new Date('2024-11-25T15:00:00Z'), authorId: u1.id },
    { type: 'status_change', title: 'Status atualizado', description: 'Caso elevado para prioridade CRÍTICA após identificação de estrutura offshore.', timestamp: new Date('2024-12-01T09:00:00Z'), authorId: u3.id },
    { type: 'profile_added', title: 'Novo investigado', description: 'Mariana Velloso identificada como sócia oculta. Incluída no caso.', timestamp: new Date('2024-12-05T11:00:00Z'), authorId: u2.id },
    { type: 'note_added', title: 'Hipótese registrada', description: 'Levantada hipótese de esquema de triangulação financeira envolvendo Ilhas Cayman.', timestamp: new Date('2024-12-10T16:30:00Z'), authorId: u2.id },
    { type: 'query_added', title: 'Consulta CNPJ realizada', description: 'Dados societários da Fonseca & Associados consultados. Confirmada incompatibilidade de faturamento.', timestamp: new Date('2024-12-12T09:00:00Z'), authorId: u1.id },
    { type: 'task_added', title: 'Tarefa criada', description: 'Solicitação de informações bancárias via Coaf registrada como tarefa urgente.', timestamp: new Date('2024-12-15T10:00:00Z'), authorId: u3.id },
    { type: 'note_added', title: 'Resumo parcial elaborado', description: 'Resumo operacional das evidências coletadas elaborado e revisado pelo supervisor.', timestamp: new Date('2024-12-20T14:30:00Z'), authorId: u2.id },
  ]
  await prisma.timelineEvent.createMany({ data: events.map(e => ({ ...e, caseId: c1.id })) })
  console.log('  ✓ Timeline criada')

  // Notas caso 1
  await prisma.note.createMany({
    data: [
      { caseId: c1.id, type: 'analytical', title: 'Padrão de Movimentação Financeira', content: 'Observado padrão recorrente de transferências de valores fracionados realizadas em intervalos regulares de 3-7 dias. No período de janeiro a outubro de 2024, foram identificadas 47 transferências com valor médio de R$ 48.300,00 saindo da conta jurídica da Fonseca & Associados para duas contas PF distintas.\n\nOs beneficiários finais não apresentam atividade econômica compatível com os valores recebidos. Hipótese de estruturação (smurfing) deve ser investigada com prioridade.', authorId: u2.id, pinned: true, linkedProfileId: p1.id, createdAt: new Date('2024-11-20T11:00:00Z') },
      { caseId: c1.id, type: 'hypothesis', title: 'Hipótese: Triangulação via Cayman', content: 'Com base nos dados coletados até o momento, formulada a seguinte hipótese operacional:\n\n1. Recursos originários de sonegação fiscal são transferidos para a empresa offshore XY Holdings Ltd. nas Ilhas Cayman via contratos fictícios.\n2. Da offshore, os recursos retornam ao Brasil disfarçados de aportes de capital estrangeiro.\n3. O circuito é fechado pela compra de ativos registrados em nome de terceiros.\n\nPrioridade: Confirmar titularidade real da XY Holdings Ltd. via OCDE.', authorId: u2.id, pinned: true, createdAt: new Date('2024-12-10T16:30:00Z') },
      { caseId: c1.id, type: 'sensitive', title: 'Informação Confidencial — Fonte Protegida', content: 'Fonte interna confirmou existência de um terceiro participante ainda não identificado com acesso privilegiado a informações do sistema financeiro. Identidade não pode ser divulgada por motivo de segurança operacional.', authorId: u1.id, private: true, createdAt: new Date('2024-12-08T09:00:00Z') },
      { caseId: c1.id, type: 'pending', title: 'Aguardando Retorno do Coaf', content: 'Solicitação formal de relatório de inteligência financeira (RIF) encaminhada ao Coaf em 15/12/2024. Prazo de retorno: 30 dias úteis. Responsável: Ag. Carvalho.', authorId: u1.id, createdAt: new Date('2024-12-15T10:00:00Z') },
      { caseId: c1.id, type: 'summary', title: 'Resumo Parcial — Dez/2024', content: 'Estado atual da investigação ao final de dezembro de 2024:\n\nAlvos identificados: 3 (1 principal, 2 secundários)\nEmpresas mapeadas: 5 (3 nacionais, 2 offshore)\nConsultas realizadas: 8\nValor estimado movimentado: R$ 4,7M\n\nPróximos passos:\n- Aguardar RIF do Coaf\n- Solicitar cooperação jurídica internacional\n- Agendar oitiva com testemunha protegida', authorId: u3.id, pinned: true, createdAt: new Date('2024-12-20T14:30:00Z') },
    ],
  })
  console.log('  ✓ Notas criadas')

  // Tarefas caso 1
  await prisma.task.createMany({
    data: [
      { caseId: c1.id, title: 'Solicitar RIF ao Coaf', description: 'Formalizar pedido de Relatório de Inteligência Financeira ao Coaf.', assignedToId: u1.id, status: 'done', priority: 'high', dueDate: '2024-12-20', createdAt: new Date('2024-12-15T10:00:00Z') },
      { caseId: c1.id, title: 'Identificar titularidade da XY Holdings Ltd.', description: 'Solicitar informações via canal OCDE sobre os beneficiários finais reais da empresa offshore nas Ilhas Cayman.', assignedToId: u2.id, status: 'in_progress', priority: 'high', dueDate: '2025-01-31', createdAt: new Date('2024-12-10T11:00:00Z') },
      { caseId: c1.id, title: 'Localizar terceiro participante não identificado', description: 'Cruzar dados da fonte interna com registros de acesso ao sistema financeiro.', assignedToId: u1.id, status: 'pending', priority: 'high', dueDate: '2025-02-15', createdAt: new Date('2024-12-08T09:30:00Z') },
      { caseId: c1.id, title: 'Validar vínculos societários atualizados', description: 'Consultar Junta Comercial para verificar alterações societárias nas empresas mapeadas após novembro de 2024.', assignedToId: u2.id, status: 'pending', priority: 'medium', dueDate: '2025-01-15', createdAt: new Date('2024-12-18T14:00:00Z') },
      { caseId: c1.id, title: 'Elaborar relatório de inteligência intermediário', description: 'Consolidar todas as evidências coletadas em relatório intermediário para revisão do supervisor.', assignedToId: u2.id, status: 'pending', priority: 'medium', dueDate: '2025-01-30', createdAt: new Date('2024-12-20T15:00:00Z') },
    ],
  })
  console.log('  ✓ Tarefas criadas')

  // Consultas caso 1
  await prisma.query.createMany({
    data: [
      { caseId: c1.id, source: 'Receita Federal', queryType: 'CPF', queryParam: '***.***.***-47', status: 'completed', reliability: 'high', resultSummary: 'CPF regular. Sócio em 4 empresas ativas. Declarações de IR em dia com patrimônio declarado de R$ 1,8M.', notes: 'Patrimônio declarado incompatível com movimentações financeiras identificadas.', linkedProfileId: p1.id, authorId: u1.id, timestamp: new Date('2024-11-18T10:30:00Z') },
      { caseId: c1.id, source: 'Junta Comercial', queryType: 'CNPJ', queryParam: '12.345.678/0001-99', status: 'completed', reliability: 'high', resultSummary: 'Empresa ativa. Capital social: R$ 80.000,00. Faturamento declarado 2023: R$ 420.000,00.', notes: 'Faturamento incompatível com movimentação bancária de R$ 2,3M no mesmo período.', linkedProfileId: p2.id, authorId: u1.id, timestamp: new Date('2024-12-12T09:00:00Z') },
      { caseId: c1.id, source: 'DETRAN-SP', queryType: 'Veículos por CPF', queryParam: '***.***.***-47', status: 'completed', reliability: 'high', resultSummary: 'Nenhum veículo registrado em nome do investigado.', notes: 'Ausência de bens móveis declarados reforça hipótese de utilização de laranjas.', linkedProfileId: p1.id, authorId: u2.id, timestamp: new Date('2024-12-05T14:00:00Z') },
      { caseId: c1.id, source: 'Coaf', queryType: 'RIF', queryParam: 'Operação Espelho Negro — caso INV-2024-001', status: 'pending', resultSummary: 'Aguardando retorno. Prazo: 30 dias úteis a partir de 15/12/2024.', notes: 'Pedido formal encaminhado com base no Art. 11-B da Lei 9.613/98.', authorId: u1.id, timestamp: new Date('2024-12-15T10:30:00Z') },
    ],
  })
  console.log('  ✓ Consultas criadas')

  // Anexos caso 1
  await prisma.attachment.createMany({
    data: [
      { caseId: c1.id, name: 'extrato_bancario_nov2024.pdf', type: 'pdf', size: '2.4 MB', description: 'Extrato bancário da conta PJ da Fonseca & Associados — novembro/2024. Obtido via mandado judicial.', uploadedById: u1.id, linkedProfileId: p2.id },
      { caseId: c1.id, name: 'contrato_servicos_xylondon.pdf', type: 'pdf', size: '840 KB', description: 'Cópia de contrato de prestação de serviços firmado entre Fonseca & Associados e XY Holdings Ltd.', uploadedById: u1.id, linkedProfileId: p2.id },
      { caseId: c1.id, name: 'declaracao_ir_rfonseca_2023.png', type: 'image', size: '1.1 MB', description: 'Declaração de IR 2023 de Ricardo Fonseca. Patrimônio declarado: R$ 1,8M.', uploadedById: u2.id, linkedProfileId: p1.id },
      { caseId: c1.id, name: 'registro_empresas_cayman.pdf', type: 'pdf', size: '3.2 MB', description: 'Documentação obtida via OCDE sobre registro da XY Holdings Ltd. nas Ilhas Cayman.', uploadedById: u2.id },
    ],
  })
  console.log('  ✓ Anexos criados')

  // Organograma caso 1
  await prisma.organogramLayout.create({
    data: {
      caseId: c1.id,
      nodes: JSON.stringify([
        { id: 'n1', type: 'person',   position: { x: 400, y: 200 }, data: { label: 'Ricardo Fonseca', subtitle: 'Alvo Principal', critical: true } },
        { id: 'n2', type: 'company',  position: { x: 650, y: 350 }, data: { label: 'Fonseca & Associados', subtitle: 'CNPJ: 12.345.678/0001-99' } },
        { id: 'n3', type: 'person',   position: { x: 150, y: 350 }, data: { label: 'Mariana Velloso', subtitle: 'Sócia Oculta' } },
        { id: 'n4', type: 'company',  position: { x: 700, y: 520 }, data: { label: 'XY Holdings Ltd.', subtitle: 'Offshore — Ilhas Cayman', critical: true } },
        { id: 'n5', type: 'account',  position: { x: 900, y: 380 }, data: { label: 'Conta BCO Suíço', subtitle: 'CHF 2.4M suspeito', critical: true } },
        { id: 'n6', type: 'phone',    position: { x: 200, y: 180 }, data: { label: '+55 11 98765-4321', subtitle: 'Tel. Ricardo' } },
        { id: 'n7', type: 'address',  position: { x: 400, y: 50  }, data: { label: 'R. Augusta, 1200', subtitle: 'São Paulo/SP' } },
        { id: 'n8', type: 'evidence', position: { x: 150, y: 520 }, data: { label: 'Extrato Bancário Nov/24', subtitle: 'Transferências suspeitas', critical: true } },
      ]),
      edges: JSON.stringify([
        { id: 'e1', source: 'n1', target: 'n2', label: 'sócio-admin' },
        { id: 'e2', source: 'n1', target: 'n3', label: 'parente' },
        { id: 'e3', source: 'n2', target: 'n4', label: 'controla' },
        { id: 'e4', source: 'n4', target: 'n5', label: 'movimenta' },
        { id: 'e5', source: 'n3', target: 'n4', label: 'sócia oculta' },
        { id: 'e6', source: 'n1', target: 'n6', label: '' },
        { id: 'e7', source: 'n1', target: 'n7', label: '' },
        { id: 'e8', source: 'n3', target: 'n8', label: 'referenciada' },
      ]),
    },
  })
  console.log('  ✓ Organograma criado')

  console.log('\n✅ Seed concluído com sucesso!')
  console.log('\n👥 Credenciais de acesso:')
  console.log('   Usuário: admin    / Senha: admin123    (Administrador)')
  console.log('   Usuário: carvalho / Senha: devileye123 (Operador)')
  console.log('   Usuário: ana      / Senha: devileye123 (Analista)')
  console.log('   Usuário: melo     / Senha: devileye123 (Supervisor)')
}

main()
  .catch(e => { console.error('❌ Erro no seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
