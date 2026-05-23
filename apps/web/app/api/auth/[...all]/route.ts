import { auth } from '@/services/auth/server'
import { toNextJsHandler } from 'better-auth/next-js'

const handler = toNextJsHandler(auth)

export async function GET(request: Request) {
  return handler.GET(request)
}

export async function POST(request: Request) {
  return handler.POST(request)
}
