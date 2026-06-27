import { router } from '../trpc'
import { authRouter } from './auth.router'
import { ledgerRouter } from './ledger.router'
import { walletRouter } from './wallet.router'
import { accountRouter } from './account.router'

export const appRouter = router({
  auth: authRouter,
  ledger: ledgerRouter,
  wallet: walletRouter,
  account: accountRouter,
})

export type AppRouter = typeof appRouter
