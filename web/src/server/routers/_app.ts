import { router } from '../trpc'
import { authRouter } from './auth.router'
import { ledgerRouter } from './ledger.router'
import { walletRouter } from './wallet.router'
import { accountRouter } from './account.router'
import { playerRouter } from './player.router'
import { employeeRouter } from './employee.router'
import { roleRouter } from './role.router'
import { tournamentRouter } from './tournament.router'
import { cashTableRouter } from './cashTable.router'
import { tabRouter } from './tab.router'
import { productRouter } from './product.router'
import { cashRegisterRouter } from './cashRegister.router'
import { rankingRouter } from './ranking.router'
import { rakebackRouter } from './rakeback.router'
import { presenceRouter } from './presence.router'
import { notificationRouter } from './notification.router'
import { templateRouter } from './template.router'
import { configRouter } from './config.router'
import { loyaltyRouter } from './loyalty.router'
import { auditRouter } from './audit.router'
import { reportRouter } from './report.router'
import { platformRouter } from './platform.router'
import { dashboardRouter } from './dashboard.router'
import { blindStructureRouter } from './blindStructure.router'
import { satelliteRouter } from './satellite.router'

export const appRouter = router({
  auth: authRouter,
  ledger: ledgerRouter,
  wallet: walletRouter,
  account: accountRouter,
  player: playerRouter,
  employee: employeeRouter,
  role: roleRouter,
  tournament: tournamentRouter,
  cashTable: cashTableRouter,
  tab: tabRouter,
  product: productRouter,
  cashRegister: cashRegisterRouter,
  ranking: rankingRouter,
  rakeback: rakebackRouter,
  presence: presenceRouter,
  notification: notificationRouter,
  template: templateRouter,
  config: configRouter,
  loyalty: loyaltyRouter,
  audit: auditRouter,
  report: reportRouter,
  platform: platformRouter,
  dashboard: dashboardRouter,
  blindStructure: blindStructureRouter,
  satellite: satelliteRouter,
})

export type AppRouter = typeof appRouter
