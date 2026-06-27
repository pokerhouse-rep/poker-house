import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('poker-access-token')
  cookieStore.delete('poker-refresh-token')
  return NextResponse.json({ success: true })
}
