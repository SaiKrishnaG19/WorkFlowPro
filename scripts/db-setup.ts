import { DatabaseService } from '../lib/database'

async function setupDatabase() {
  try {
    const db = DatabaseService.getInstance()
    await db.initialize()
    console.log('✅ Database setup completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()