import { router } from '../trpc'

export const appRouter = router({
  // Routers serão adicionados conforme desenvolvimento de cada módulo
  // auth: authRouter,
  // player: playerRouter,
  // tournament: tournamentRouter,
  // etc.
})

export type AppRouter = typeof appRouter
