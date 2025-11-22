import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const POST = async (request: NextRequest) => {
  try {
    // Clear all authentication cookies
    const response = NextResponse.json({ success: true })
    
    // Clear Logto cookies
    response.cookies.delete('logto_h28vlbexr7nmgjk5f2qdg')
    response.cookies.delete('logto_session')
    response.cookies.delete('logto_access_token')
    response.cookies.delete('logto_refresh_token')
    response.cookies.delete('logto_id_token')
    
    // Clear any other potential auth cookies
    const cookies = request.cookies.getAll()
    cookies.forEach(cookie => {
      if (cookie.name.includes('logto') || cookie.name.includes('auth')) {
        response.cookies.delete(cookie.name)
      }
    })
    
    return response
  } catch (error) {
    logger.error({ error }, 'Manual sign-out error')
    return NextResponse.json({ error: 'Sign-out failed' }, { status: 500 })
  }
}
