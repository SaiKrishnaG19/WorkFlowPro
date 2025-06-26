import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/database"
import DashboardClient from "./dashboard-client"

export default async function Dashboard() {
  const session = await getSession()


  if (!session) {
    redirect("/")
  }

  // Fetch data server-side
  const [mclReports, problemReports, discussions] = await Promise.all([
    db.getMCLReports(session.role === "User" ? session.empId : undefined),
    db.getProblemReports(session.role === "User" ? session.empId : undefined),
    db.getDiscussions(),
  ])

  return (
    <DashboardClient user={session} mclReports={mclReports} problemReports={problemReports} discussions={discussions} />
  )
}
