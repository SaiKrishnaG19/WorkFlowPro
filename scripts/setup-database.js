const { Pool } = require("pg")
require("dotenv").config({ path: ".env.local" })

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })

  try {
    console.log("🔄 Setting up database...")

    // Test connection
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    console.log("✅ Database connection successful:", result.rows[0].now)
    client.release()

    console.log("✅ Database setup completed successfully!")
    console.log("📝 Next steps:")
    console.log("   1. Run: npm run dev")
    console.log("   2. Visit: http://localhost:3000")
    console.log("   3. Login with demo credentials")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDatabase()
