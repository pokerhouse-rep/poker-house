import { router, publicProcedure, protectedProcedure } from '../trpc'
import {
  loginAdminSchema,
  loginPlayerSchema,
  changePasswordSchema,
} from '@/lib/validators/auth'
import {
  loginAdmin,
  loginPlayer,
  refreshAccessToken,
  changePassword,
  getMe,
} from '../services/auth/auth.service'
import { z } from 'zod'

export const authRouter = router({
  loginAdmin: publicProcedure
    .input(loginAdminSchema)
    .mutation(async ({ input }) => {
      return loginAdmin(input)
    }),

  loginPlayer: publicProcedure
    .input(loginPlayerSchema)
    .mutation(async ({ input }) => {
      return loginPlayer(input)
    }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      return refreshAccessToken(input.refreshToken)
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      return changePassword(ctx.user.id, input)
    }),

  logout: protectedProcedure.mutation(async () => {
    return { success: true }
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return getMe(ctx.user.id)
  }),
})
