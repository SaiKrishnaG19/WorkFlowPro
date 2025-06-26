// Script to update localStorage with additional mock data for testing
// Run this in browser console after logging in

const additionalMCLReports = [
  {
    id: "MCL-2025-004",
    clientName: "TechCorp Solutions",
    entryAt: "2025-06-15T08:00:00",
    exitAt: "2025-06-15T16:00:00",
    visitType: "On-site Support",
    purpose: "System Maintenance",
    shift: "Day Shift",
    remark: "Database optimization and performance tuning completed successfully",
    status: "Approved",
    submittedBy: "David Support",
    submittedAt: "2025-06-15T16:30:00",
  },
  {
    id: "MCL-2025-005",
    clientName: "DataFlow Inc",
    entryAt: "2025-06-14T13:00:00",
    exitAt: "2025-06-14T21:00:00",
    visitType: "Remote Support",
    purpose: "Troubleshooting",
    shift: "Evening Shift",
    remark: "Resolved critical application errors affecting user login",
    status: "Pending Approval",
    submittedBy: "David Support",
    submittedAt: "2025-06-14T21:15:00",
  },
  {
    id: "MCL-2025-006",
    clientName: "CloudTech Ltd",
    entryAt: "2025-06-13T09:00:00",
    exitAt: "2025-06-13T17:00:00",
    visitType: "On-site Support",
    purpose: "Installation",
    shift: "Day Shift",
    remark: "New system installation and configuration for client environment",
    status: "Approved",
    submittedBy: "Emma Lead",
    submittedAt: "2025-06-13T17:30:00",
  },
  {
    id: "MCL-2025-007",
    clientName: "InnovateSoft",
    entryAt: "2025-06-12T10:00:00",
    exitAt: "2025-06-12T18:00:00",
    visitType: "Consultation",
    purpose: "Training",
    shift: "Day Shift",
    remark: "Training session for client staff on new system features - needs improvement",
    status: "Rejected",
    submittedBy: "Emma Lead",
    submittedAt: "2025-06-12T18:45:00",
  },
]

const additionalProblemReports = [
  {
    id: "PRB-2025-004",
    clientName: "TechCorp Solutions",
    environment: "Production",
    problemStatement: "Email notifications not being sent to users",
    receivedAt: "2025-06-15T11:00:00",
    rca: "SMTP server configuration issue",
    solution: "Updated SMTP settings and tested email delivery",
    attendedBy: "David Support",
    status: "Closed",
    slaHours: 4,
    submittedBy: "David Support",
    submittedAt: "2025-06-15T11:00:00",
  },
  {
    id: "PRB-2025-005",
    clientName: "DataFlow Inc",
    environment: "Staging",
    problemStatement: "Report generation taking too long",
    receivedAt: "2025-06-14T15:30:00",
    rca: "Database query optimization needed",
    solution: "Currently optimizing database queries and indexes",
    attendedBy: "David Support",
    status: "In Progress",
    slaHours: 8,
    submittedBy: "David Support",
    submittedAt: "2025-06-14T15:30:00",
  },
  {
    id: "PRB-2025-006",
    clientName: "CloudTech Ltd",
    environment: "Production",
    problemStatement: "User interface not responsive on mobile devices",
    receivedAt: "2025-06-13T14:00:00",
    rca: "",
    solution: "",
    attendedBy: "Emma Lead",
    status: "Open",
    slaHours: 24,
    submittedBy: "Emma Lead",
    submittedAt: "2025-06-13T14:00:00",
  },
  {
    id: "PRB-2025-007",
    clientName: "InnovateSoft",
    environment: "Development",
    problemStatement: "API endpoints returning 500 errors intermittently",
    receivedAt: "2025-06-12T16:45:00",
    rca: "Memory leak in application server",
    solution: "Implemented memory management fixes and monitoring",
    attendedBy: "Emma Lead",
    status: "Closed",
    slaHours: 2,
    submittedBy: "Emma Lead",
    submittedAt: "2025-06-12T16:45:00",
  },
]

const additionalDiscussions = [
  {
    id: "DISC-005",
    title: "Database Performance Best Practices",
    content:
      "I wanted to share some insights from recent database optimization work. Here are key strategies that have worked well for our clients: 1) Index optimization, 2) Query analysis, 3) Connection pooling.",
    author: "David Support",
    authorRole: "User",
    createdAt: "2025-06-15T17:00:00",
    updatedAt: "2025-06-15T17:00:00",
    commentsCount: 3,
    reportType: "Problem",
    reportId: "PRB-2025-004",
    hasAttachment: false,
    isActive: true,
  },
  {
    id: "DISC-006",
    title: "Mobile Responsiveness Issues - Need Team Input",
    content:
      "We are seeing recurring mobile responsiveness issues across multiple client sites. What approaches have worked best for your projects? Looking for practical solutions and best practices.",
    author: "Emma Lead",
    authorRole: "Manager",
    createdAt: "2025-06-13T15:00:00",
    updatedAt: "2025-06-13T18:30:00",
    commentsCount: 7,
    reportType: "Problem",
    reportId: "PRB-2025-006",
    hasAttachment: true,
    isActive: true,
  },
  {
    id: "DISC-007",
    title: "Training Session Feedback and Improvements",
    content:
      "Following the recent training session rejection, I would like to discuss how we can improve our training delivery approach. Key areas for improvement include preparation, engagement, and follow-up.",
    author: "Emma Lead",
    authorRole: "Manager",
    createdAt: "2025-06-12T19:00:00",
    updatedAt: "2025-06-12T19:00:00",
    commentsCount: 5,
    reportType: "MCL",
    reportId: "MCL-2025-007",
    hasAttachment: false,
    isActive: true,
  },
]

// Function to add the data to localStorage
function seedAdditionalData() {
  // Add MCL reports
  const existingMCL = JSON.parse(localStorage.getItem("mclReports") || "[]")
  const updatedMCL = [...existingMCL, ...additionalMCLReports]
  localStorage.setItem("mclReports", JSON.stringify(updatedMCL))

  // Add Problem reports
  const existingProblems = JSON.parse(localStorage.getItem("problemReports") || "[]")
  const updatedProblems = [...existingProblems, ...additionalProblemReports]
  localStorage.setItem("problemReports", JSON.stringify(updatedProblems))

  // Add Discussions
  const existingDiscussions = JSON.parse(localStorage.getItem("discussions") || "[]")
  const updatedDiscussions = [...existingDiscussions, ...additionalDiscussions]
  localStorage.setItem("discussions", JSON.stringify(updatedDiscussions))

  console.log("✅ Additional test data has been seeded!")
  console.log("📊 Added:", {
    mclReports: additionalMCLReports.length,
    problemReports: additionalProblemReports.length,
    discussions: additionalDiscussions.length,
  })
}

// Run the seeding function
seedAdditionalData()
