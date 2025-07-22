import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { pool } from '@/lib/database'
import { CreateNotificationRequest } from '@/lib/notification-types'

const notificationService = new NotificationService(pool)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      )
    }

    const filters = {
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      priority: searchParams.get('priority') as any,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const notifications = await notificationService.getNotifications(userId, filters)
    const unreadCount = await notificationService.getUnreadCount(userId)

    return NextResponse.json({
      notifications,
      unreadCount,
      success: true
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateNotificationRequest = await request.json()
    
    const notification = await notificationService.createNotification(body)
    
    return NextResponse.json({
      notification,
      success: true
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const notificationId = searchParams.get('notificationId')

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    // Example: Mark notification as read
    if (action === 'markRead') {
      if (!notificationId) {
        return NextResponse.json(
          { error: 'notificationId is required for markRead action' },
          { status: 400 }
        )
      }
      const result = await notificationService.markAsRead(userId, notificationId)
      return NextResponse.json({ success: true, result })
    }

    // Example: Mark all notifications as read
    if (action === 'markAllRead') {
      const result = await notificationService.markAllAsRead(userId)
      return NextResponse.json({ success: true, result })
    }

    // Add more actions as needed
    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in PATCH handler:', error)
    return NextResponse.json(
      { error: 'Failed to process PATCH request' },
      { status: 500 }
    )
  }
}