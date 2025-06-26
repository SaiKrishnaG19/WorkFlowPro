// Script to add sample data for the 3 new demo users
// Run this in browser console after logging in as any user

const newUsersMCLReports = [
  // Sarah Tech (EMP006) reports
  {
    id: "MCL-2025-008",
    clientName: "SystemsPro",
    entryAt: "2025-06-14T09:00:00",
    exitAt: "2025-06-14T17:00:00",
    visitType: "On-site Support",
    purpose: "System Maintenance",
    shift: "Day Shift",
    remark: "Performed routine system maintenance and security updates",
    status: "Approved",
    submittedBy: "Sarah Tech",
    submittedAt: "2025-06-14T17:30:00",
  },
  {
    id: "MCL-2025-009",
    clientName: "TechCorp Solutions",
    entryAt: "2025-06-13T14:00:00",
    exitAt: "2025-06-13T22:00:00",
    visitType: "Remote Support",
    purpose: "Troubleshooting",
    shift: "Evening Shift",
    remark: "Resolved network connectivity issues and optimized performance",
    status: "Pending Approval",
    submittedBy: "Sarah Tech",
    submittedAt: "2025-06-13T22:15:00",
  },

  // Mike Developer (EMP007) reports
  {
    id: "MCL-2025-010",
    clientName: "InnovateSoft",
    entryAt: "2025-06-12T10:00:00",
    exitAt: "2025-06-12T18:00:00",
    visitType: "On-site Support",
    purpose: "Installation",
    shift: "Day Shift",
    remark: "Successfully deployed new application modules and conducted testing",
    status: "Approved",
    submittedBy: "Mike Developer",
    submittedAt: "2025-06-12T18:30:00",
  },
  {
    id: "MCL-2025-011",
    clientName: "DataFlow Inc",
    entryAt: "2025-06-11T08:00:00",
    exitAt: "2025-06-11T16:00:00",
    visitType: "Consultation",
    purpose: "Training",
    shift: "Day Shift",
    remark: "Conducted development team training on new frameworks - needs follow-up",
    status: "Rejected",
    submittedBy: "Mike Developer",
    submittedAt: "2025-06-11T16:45:00",
  },

  // Lisa Analyst (EMP008) reports
  {
    id: "MCL-2025-012",
    clientName: "CloudTech Ltd",
    entryAt: "2025-06-10T13:00:00",
    exitAt: "2025-06-10T21:00:00",
    visitType: "Remote Support",
    purpose: "Consultation",
    shift: "Evening Shift",
    remark: "Analyzed system performance metrics and provided optimization recommendations",
    status: "Approved",
    submittedBy: "Lisa Analyst",
    submittedAt: "2025-06-10T21:30:00",
  },
  {
    id: "MCL-2025-013",
    clientName: "SystemsPro",
    entryAt: "2025-06-09T09:00:00",
    exitAt: "2025-06-09T17:00:00",
    visitType: "On-site Support",
    purpose: "System Maintenance",
    shift: "Day Shift",
    remark: "Performed data analysis and generated comprehensive reports for management review",
    status: "Pending Approval",
    submittedBy: "Lisa Analyst",
    submittedAt: "2025-06-09T17:15:00",
  },
]

const newUsersProblemReports = [
  // Sarah Tech (EMP006) problem reports
  {
    id: "PRB-2025-008",
    clientName: "SystemsPro",
    environment: "Production",
    problemStatement: "Backup system failing intermittently",
    receivedAt: "2025-06-14T12:00:00",
    rca: "Disk space issues on backup server",
    solution: "Cleaned up old backups and increased storage capacity",
    attendedBy: "Sarah Tech",
    status: "Closed",
    slaHours: 8,
    submittedBy: "Sarah Tech",
    submittedAt: "2025-06-14T12:00:00",
  },
  {
    id: "PRB-2025-009",
    clientName: "TechCorp Solutions",
    environment: "Staging",
    problemStatement: "SSL certificate expiration warnings",
    receivedAt: "2025-06-13T10:00:00",
    rca: "Certificate renewal process not automated",
    solution: "Working on automated certificate renewal system",
    attendedBy: "Sarah Tech",
    status: "In Progress",
    slaHours: 24,
    submittedBy: "Sarah Tech",
    submittedAt: "2025-06-13T10:00:00",
  },

  // Mike Developer (EMP007) problem reports
  {
    id: "PRB-2025-010",
    clientName: "InnovateSoft",
    environment: "Development",
    problemStatement: "Code deployment pipeline broken",
    receivedAt: "2025-06-12T14:30:00",
    rca: "Configuration mismatch in CI/CD pipeline",
    solution: "Fixed pipeline configuration and added validation checks",
    attendedBy: "Mike Developer",
    status: "Closed",
    slaHours: 4,
    submittedBy: "Mike Developer",
    submittedAt: "2025-06-12T14:30:00",
  },
  {
    id: "PRB-2025-011",
    clientName: "DataFlow Inc",
    environment: "Production",
    problemStatement: "Application memory leaks causing crashes",
    receivedAt: "2025-06-11T16:00:00",
    rca: "",
    solution: "",
    attendedBy: "Mike Developer",
    status: "Open",
    slaHours: 2,
    submittedBy: "Mike Developer",
    submittedAt: "2025-06-11T16:00:00",
  },

  // Lisa Analyst (EMP008) problem reports
  {
    id: "PRB-2025-012",
    clientName: "CloudTech Ltd",
    environment: "Production",
    problemStatement: "Data synchronization delays between systems",
    receivedAt: "2025-06-10T11:00:00",
    rca: "Network latency and inefficient data transfer protocols",
    solution: "Optimized data sync process and implemented compression",
    attendedBy: "Lisa Analyst",
    status: "Closed",
    slaHours: 8,
    submittedBy: "Lisa Analyst",
    submittedAt: "2025-06-10T11:00:00",
  },
  {
    id: "PRB-2025-013",
    clientName: "SystemsPro",
    environment: "UAT",
    problemStatement: "Report generation performance issues",
    receivedAt: "2025-06-09T13:30:00",
    rca: "Inefficient database queries and missing indexes",
    solution: "Currently optimizing queries and adding database indexes",
    attendedBy: "Lisa Analyst",
    status: "In Progress",
    slaHours: 12,
    submittedBy: "Lisa Analyst",
    submittedAt: "2025-06-09T13:30:00",
  },
]

const newUsersDiscussions = [
  {
    id: "DISC-008",
    title: "SSL Certificate Management Best Practices",
    content:
      "Following recent SSL certificate issues, I wanted to start a discussion about automating certificate management. What tools and processes have worked well for your projects?",
    author: "Sarah Tech",
    authorRole: "User",
    createdAt: "2025-06-13T15:00:00",
    updatedAt: "2025-06-13T15:00:00",
    commentsCount: 4,
    reportType: "Problem",
    reportId: "PRB-2025-009",
    hasAttachment: false,
    isActive: true,
  },
  {
    id: "DISC-009",
    title: "CI/CD Pipeline Configuration Tips",
    content:
      "After resolving a recent pipeline issue, I thought it would be helpful to share some configuration best practices and common pitfalls to avoid.",
    author: "Mike Developer",
    authorRole: "User",
    createdAt: "2025-06-12T19:00:00",
    updatedAt: "2025-06-12T19:00:00",
    commentsCount: 6,
    reportType: "Problem",
    reportId: "PRB-2025-010",
    hasAttachment: true,
    isActive: true,
  },
  {
    id: "DISC-010",
    title: "Database Performance Optimization Strategies",
    content:
      "I've been working on several database optimization projects lately. Here are some effective strategies for improving query performance and reducing report generation times.",
    author: "Lisa Analyst",
    authorRole: "User",
    createdAt: "2025-06-09T18:00:00",
    updatedAt: "2025-06-10T14:30:00",
    commentsCount: 8,
    reportType: "Problem",
    reportId: "PRB-2025-013",
    hasAttachment: false,
    isActive: true,
  },
  {
    id: "DISC-011",
    title: "Team Knowledge Sharing Session Ideas",
    content:
      "I think we should organize regular knowledge sharing sessions. What topics would be most valuable for the team? I can start with data analysis techniques.",
    author: "Lisa Analyst",
    authorRole: "User",
    createdAt: "2025-06-08T16:00:00",
    updatedAt: "2025-06-08T16:00:00",
    commentsCount: 12,
    hasAttachment: false,
    isActive: true,
  },
]

// Function to add the new users' data to localStorage
function seedNewUsersData() {
  // Add MCL reports
  const existingMCL = JSON.parse(localStorage.getItem("mclReports") || "[]")
  const updatedMCL = [...existingMCL, ...newUsersMCLReports]
  localStorage.setItem("mclReports", JSON.stringify(updatedMCL))

  // Add Problem reports
  const existingProblems = JSON.parse(localStorage.getItem("problemReports") || "[]")
  const updatedProblems = [...existingProblems, ...newUsersProblemReports]
  localStorage.setItem("problemReports", JSON.stringify(updatedProblems))

  // Add Discussions
  const existingDiscussions = JSON.parse(localStorage.getItem("discussions") || "[]")
  const updatedDiscussions = [...existingDiscussions, ...newUsersDiscussions]
  localStorage.setItem("discussions", JSON.stringify(updatedDiscussions))

  console.log("✅ New users' test data has been seeded!")
  console.log("📊 Added data for Sarah Tech, Mike Developer, and Lisa Analyst:")
  console.log({
    mclReports: newUsersMCLReports.length,
    problemReports: newUsersProblemReports.length,
    discussions: newUsersDiscussions.length,
  })
  console.log("🎯 You can now test with:")
  console.log("- EMP006 / user123 (Sarah Tech)")
  console.log("- EMP007 / user123 (Mike Developer)")
  console.log("- EMP008 / user123 (Lisa Analyst)")
}

// Run the seeding function
seedNewUsersData()
