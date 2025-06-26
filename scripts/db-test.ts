import { DatabaseService } from '../lib/database'

async function testDatabase() {
  try {
    const db = DatabaseService.getInstance()
    await db.testConnection()
    console.log('✅ Database connection test successful')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    process.exit(1)
  }
}

testDatabase()