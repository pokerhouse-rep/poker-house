import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { DEFAULT_ROLES } from '../lib/auth/default-roles'

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🎰 Iniciando seed...')

  // 1. Criar organização
  const org = await prisma.organization.create({
    data: {
      cnpj: '12345678000199',
      razao_social: 'Poker House Ltda',
      nome_fantasia: 'Poker House',
      email: 'admin@pokerhouse.com.br',
      telefone: '11999999999',
    },
  })
  console.log(`✅ Organização criada: ${org.nome_fantasia} (${org.id})`)

  // 2. Criar roles padrão
  const roles = await Promise.all(
    DEFAULT_ROLES.map((role) =>
      prisma.role.create({
        data: {
          organization_id: org.id,
          nome: role.nome,
          descricao: role.descricao,
          permissions: role.permissions,
          is_system: true,
        },
      })
    )
  )
  console.log(`✅ ${roles.length} roles criadas`)

  const adminRole = roles.find((r) => r.nome === 'Admin')!
  const floorRole = roles.find((r) => r.nome === 'Floor')!
  const caixaRole = roles.find((r) => r.nome === 'Caixa')!

  // 3. Criar admin
  const senhaHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      organization_id: org.id,
      tipo: 'ADMIN',
      nome: 'Administrador',
      email: 'admin@pokerhouse.com.br',
      cpf: '11111111111',
      telefone: '11999999999',
      senha_hash: senhaHash,
      data_nascimento: new Date('1990-01-01'),
    },
  })
  await prisma.userRole.create({ data: { user_id: admin.id, role_id: adminRole.id } })
  console.log(`✅ Admin criado: ${admin.email} / admin123`)

  // 4. Criar funcionários
  const funcSenha = await bcrypt.hash('func1234', 12)
  const floor = await prisma.user.create({
    data: {
      organization_id: org.id,
      tipo: 'FUNCIONARIO',
      nome: 'Carlos Floor',
      email: 'floor@pokerhouse.com.br',
      cpf: '22222222222',
      telefone: '11988888888',
      senha_hash: funcSenha,
      data_nascimento: new Date('1992-05-15'),
    },
  })
  await prisma.userRole.create({ data: { user_id: floor.id, role_id: floorRole.id } })

  const caixa = await prisma.user.create({
    data: {
      organization_id: org.id,
      tipo: 'FUNCIONARIO',
      nome: 'Ana Caixa',
      email: 'caixa@pokerhouse.com.br',
      cpf: '33333333333',
      telefone: '11977777777',
      senha_hash: funcSenha,
      data_nascimento: new Date('1995-08-20'),
    },
  })
  await prisma.userRole.create({ data: { user_id: caixa.id, role_id: caixaRole.id } })
  console.log(`✅ Funcionários criados`)

  // 5. Criar jogadores
  const jogadorSenha = await bcrypt.hash('jogador1', 12)
  const jogadores = []
  const nomes = [
    { nome: 'João Silva', nick: 'JokerJS', cpf: '44444444444' },
    { nome: 'Maria Santos', nick: 'QueenM', cpf: '55555555555' },
    { nome: 'Pedro Costa', nick: 'SharkPC', cpf: '66666666666' },
    { nome: 'Ana Oliveira', nick: 'AceAna', cpf: '77777777777' },
    { nome: 'Lucas Souza', nick: 'BluffKing', cpf: '88888888888' },
    { nome: 'Fernanda Lima', nick: 'FerLima', cpf: '99999999999' },
    { nome: 'Ricardo Alves', nick: 'RickAll', cpf: '10101010101' },
    { nome: 'Camila Rocha', nick: 'CamiRock', cpf: '20202020202' },
    { nome: 'Bruno Martins', nick: 'BrunoM', cpf: '30303030303' },
    { nome: 'Juliana Pereira', nick: 'JuPe', cpf: '40404040404' },
  ]

  for (const n of nomes) {
    const jogador = await prisma.user.create({
      data: {
        organization_id: org.id,
        tipo: 'JOGADOR',
        nome: n.nome,
        nickname: n.nick,
        cpf: n.cpf,
        telefone: `119${Math.random().toString().slice(2, 10)}`,
        email: `${n.nick.toLowerCase()}@email.com`,
        senha_hash: jogadorSenha,
        data_nascimento: new Date(`${1985 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`),
        tags: Math.random() > 0.5 ? ['VIP'] : ['Regular'],
      },
    })

    await prisma.wallet.create({
      data: {
        organization_id: org.id,
        jogador_id: jogador.id,
        saldo_disponivel: Math.floor(Math.random() * 5000),
        saldo_premiacoes: Math.floor(Math.random() * 1000),
        saldo_rakeback: Math.floor(Math.random() * 200),
      },
    })

    jogadores.push(jogador)
  }
  console.log(`✅ ${jogadores.length} jogadores criados (senha: jogador1)`)

  // 6. Criar estrutura de blinds
  const blindStructure = await prisma.blindStructure.create({
    data: {
      organization_id: org.id,
      nome: 'Estrutura Padrão 25min',
      is_template: true,
    },
  })

  const levels = [
    { nivel: 1, sb: 25, bb: 50, ante: 0, dur: 25 },
    { nivel: 2, sb: 50, bb: 100, ante: 0, dur: 25 },
    { nivel: 3, sb: 75, bb: 150, ante: 0, dur: 25 },
    { nivel: 4, sb: 100, bb: 200, ante: 25, dur: 25 },
    { nivel: 5, sb: 150, bb: 300, ante: 50, dur: 20 },
    { nivel: 6, sb: 200, bb: 400, ante: 50, dur: 20 },
    { nivel: 7, sb: 300, bb: 600, ante: 75, dur: 20 },
    { nivel: 8, sb: 400, bb: 800, ante: 100, dur: 20 },
    { nivel: 9, sb: 500, bb: 1000, ante: 100, dur: 15 },
    { nivel: 10, sb: 600, bb: 1200, ante: 200, dur: 15 },
    { nivel: 11, sb: 800, bb: 1600, ante: 200, dur: 15 },
    { nivel: 12, sb: 1000, bb: 2000, ante: 300, dur: 15 },
    { nivel: 13, sb: 1500, bb: 3000, ante: 400, dur: 15 },
    { nivel: 14, sb: 2000, bb: 4000, ante: 500, dur: 15 },
    { nivel: 15, sb: 3000, bb: 6000, ante: 1000, dur: 15 },
  ]

  await prisma.blindLevel.createMany({
    data: levels.map((l, i) => ({
      structure_id: blindStructure.id,
      nivel: l.nivel,
      small_blind: l.sb,
      big_blind: l.bb,
      ante: l.ante,
      duracao_minutos: l.dur,
      is_break: i === 3 || i === 7 || i === 11,
      break_duracao_minutos: (i === 3 || i === 7 || i === 11) ? 15 : null,
      ordem: i + 1,
    })),
  })
  console.log(`✅ Estrutura de blinds criada (${levels.length} níveis)`)

  // 7. Criar categorias e produtos do bar
  const catBebidas = await prisma.productCategory.create({
    data: { organization_id: org.id, nome: 'Bebidas', ordem: 1 },
  })
  const catComidas = await prisma.productCategory.create({
    data: { organization_id: org.id, nome: 'Comidas', ordem: 2 },
  })

  const produtos = [
    { nome: 'Água', preco: 5, cat: catBebidas.id },
    { nome: 'Refrigerante', preco: 8, cat: catBebidas.id },
    { nome: 'Cerveja', preco: 12, cat: catBebidas.id },
    { nome: 'Energético', preco: 15, cat: catBebidas.id },
    { nome: 'Café', preco: 6, cat: catBebidas.id },
    { nome: 'Suco Natural', preco: 10, cat: catBebidas.id },
    { nome: 'Whisky (dose)', preco: 25, cat: catBebidas.id },
    { nome: 'Salgado', preco: 8, cat: catComidas.id },
    { nome: 'Sanduíche', preco: 15, cat: catComidas.id },
    { nome: 'Pizza (fatia)', preco: 12, cat: catComidas.id },
  ]

  await prisma.product.createMany({
    data: produtos.map((p) => ({
      organization_id: org.id,
      nome: p.nome,
      categoria_id: p.cat,
      preco: p.preco,
    })),
  })
  console.log(`✅ ${produtos.length} produtos criados`)

  // 8. Mesas de cash
  await prisma.cashTable.create({
    data: {
      organization_id: org.id,
      nome: 'Mesa 1',
      modalidade: 'NL Hold\'em',
      stakes: '2/5',
      blind_small: 2,
      blind_big: 5,
      buyin_minimo: 200,
      buyin_maximo: 1000,
      max_jogadores: 9,
      rake_tipo: 'POT_RAKE',
      rake_percentual: 5,
      rake_cap: 30,
    },
  })
  await prisma.cashTable.create({
    data: {
      organization_id: org.id,
      nome: 'Mesa 2',
      modalidade: 'PLO',
      stakes: '5/10',
      blind_small: 5,
      blind_big: 10,
      buyin_minimo: 500,
      buyin_maximo: 2000,
      max_jogadores: 6,
      rake_tipo: 'POT_RAKE',
      rake_percentual: 5,
      rake_cap: 50,
    },
  })
  console.log(`✅ 2 mesas de cash criadas`)

  // 9. Torneio inaugural
  await prisma.tournament.create({
    data: {
      organization_id: org.id,
      nome: 'NL Hold\'em R$100 — Inaugural',
      status: 'INSCRICOES_ABERTAS',
      buyin_valor: 100,
      rake_valor: 20,
      chip_dealer_valor: 10,
      starting_stack: 15000,
      garantido_ativo: true,
      garantido_valor: 5000,
      late_registration_ativo: true,
      late_registration_ate_nivel: 6,
      rebuy_ativo: true,
      rebuy_maximo: 1,
      rebuy_valor: 100,
      rebuy_fichas: 15000,
      rebuy_condicao: 'BUST',
      addon_ativo: true,
      addon_valor: 50,
      addon_fichas: 10000,
      blind_structure_id: blindStructure.id,
    },
  })
  console.log(`✅ Torneio inaugural criado`)

  // 10. Configs padrão
  const configs = [
    { chave: 'rakeback_percentual', valor: 10 },
    { chave: 'horario_abertura', valor: '18:00' },
    { chave: 'horario_fechamento', valor: '06:00' },
    { chave: 'comanda_auto_open', valor: false },
  ]
  for (const c of configs) {
    await prisma.orgConfig.create({
      data: { organization_id: org.id, chave: c.chave, valor: c.valor },
    })
  }
  console.log(`✅ ${configs.length} configurações`)

  console.log('\n🎰 Seed concluído!')
  console.log(`\n📋 Dados de acesso:`)
  console.log(`   Admin: admin@pokerhouse.com.br / admin123`)
  console.log(`   Floor: floor@pokerhouse.com.br / func1234`)
  console.log(`   Caixa: caixa@pokerhouse.com.br / func1234`)
  console.log(`   Jogadores (CPF/senha): 44444444444/jogador1, 55555555555/jogador1, ...`)
  console.log(`\n   Organization ID: ${org.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
