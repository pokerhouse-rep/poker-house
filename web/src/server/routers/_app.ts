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
})

export type AppRouter = typeof appRouter
