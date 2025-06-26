import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config() // Load .env if you're using one

// Database connection configuration
const pool = new Pool({
  // Updated connection configuration to work with Render
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }, // Enforced for Render.com
})


async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    console.log("✅ Connected successfully at:", result.rows[0].now)
    client.release()
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error)
  } finally {
    await pool.end()
  }
}

testConnection()
