# WorkFlow Pro - Workload Management & Reporting System

A comprehensive web-based system for managing MCL reports, Problem reports, and team collaboration through discussion threads.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18 or later
- PostgreSQL 12 or later
- npm, yarn, or pnpm

### Clone and Install

\`\`\`bash
git clone <repository-url>
cd WorkFlowPro
npm install
\`\`\`

### PostgreSQL Database Setup

#### Install PostgreSQL (if not already installed)

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the 'postgres' user

**macOS:**
\`\`\`bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database user (optional)
createuser -s postgres
\`\`\`

**Linux (Ubuntu/Debian):**
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
\`\`\`

#### Create Database and Tables

1. **Start PostgreSQL service** (if not running)
2. **Open terminal/command prompt**
3. **Navigate to your project directory**
4. **Run the database setup:**

\`\`\`bash
# Method 1: Using npm script (recommended)
npm run db:setup

# Method 2: Manual setup
psql -U postgres -f lib/schema.sql

# If you need to reset the database
npm run db:reset
\`\`\`

#### Configure Database Connection



2. **Update `.env.local` with your database credentials:**
\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workload_management
DB_USER=postgres
DB_PASSWORD=your_actual_password
\`\`\`

### 3. Run the Application

\`\`\`bash
# Development mode
npm run dev

# Production build
npm run build
npm start
\`\`\`

### 4. Access the Application

Open your browser and navigate to: `http://localhost:3000`

## 🔐 Demo Credentials

| Role | Employee ID | Password | Name |
|------|-------------|----------|------|
| **Admin** | EMP001 | admin123 | Carol Admin |
| **Manager** | EMP002 | manager123 | Bob Manager |
| **Manager** | EMP005 | manager123 | Emma Lead |
| **User** | EMP003 | user123 | Alice User |
| **User** | EMP004 | user123 | David Support |

### Test User Scenarios

**EMP004 (David Support) - User Role:**
- Has submitted MCL reports (approved and pending)
- Has created problem reports (closed and in progress)
- Active in discussions about technical topics

**EMP005 (Emma Lead) - Manager Role:**
- Can approve/reject MCL reports
- Has submitted reports as a working manager
- Manages lookup lists and exports data
- Leads discussions on process improvements

## 📊 Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **mcl_reports** - MCL (Manpower, Cost & Logistics) reports
- **problem_reports** - Problem tracking reports
- **discussion_posts** - Discussion threads and comments
- **lookup_list_values** - Manager-configurable dropdown values
- **export_logs** - Audit trail for data exports

## 🛠️ Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
\`\`\`bash
# Windows
pg_ctl status

# macOS/Linux
sudo systemctl status postgresql
\`\`\`

2. **Verify database exists:**
\`\`\`bash
psql -U postgres -l
\`\`\`

3. **Test connection:**
\`\`\`bash
psql -U postgres -d workload_management -c "SELECT version();"
\`\`\`

### Common Issues

**"database does not exist" error:**
\`\`\`bash
createdb -U postgres workflowpro
npm run db:setup
\`\`\`

**"password authentication failed" error:**
- Update the password in `.env.local`
- Reset PostgreSQL password if needed

**Port 3000 already in use:**
\`\`\`bash
# Kill process using port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
\`\`\`

### Reset Everything

If you need to start fresh:

\`\`\`bash
# Reset database
npm run db:reset

# Clear application data
rm -rf .next
npm run build
\`\`\`

## 🔧 Development

### Project Structure

\`\`\`
app/
├── page.tsx                    # Login page
├── dashboard/                  # Main dashboard
├── mcl-reports/               # MCL report management
├── problem-reports/           # Problem report management
├── discussions/               # Discussion threads
├── manager/                   # Manager-specific features
├── admin/                     # Admin-specific features
└── globals.css               # Global styles

lib/
├── db.ts                      # Database connection
└── schema.sql                 # Database schema
\`\`\`

### Adding New Features

1. **Database changes:** Update `lib/schema.sql`
2. **API routes:** Create in `app/api/`
3. **UI components:** Add to appropriate `app/` directory
4. **Database queries:** Use the pool from `lib/db.ts`

### Environment Variables

\`\`\`env
# Required
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workload_management
DB_USER=postgres
DB_PASSWORD=your_password

## 🚀 Deployment

### Local Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

### Docker Deployment (Optional)

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Features

### ✅ Fixed Issues

1. **Report Creation** - New reports now save properly
2. **Edit Functionality** - Users can edit pending/rejected reports
3. **User Authentication** - New users can login with default password
4. **Data Privacy** - Users only see their own reports
5. **Role-based Access** - Proper permissions for each role

### 🎯 Key Features

- **Role-based Access Control** (User, Manager, Admin)
- **MCL Report Management** with approval workflow
- **Problem Report Tracking** with SLA monitoring
- **Discussion Threads** for team collaboration
- **Manager Dashboard** with filtering and export
- **Admin User Management**
- **Lookup Lists Management**

### 🔐 Authentication & Role-Based Access Control
- **Three User Roles**: User, Manager, Admin
- **Secure Login**: Employee ID + Password authentication
- **Role-based UI**: Different interfaces and permissions based on user role

### 📊 MCL Reports
- **Structured Reporting**: Standardized forms with manager-defined dropdown values
- **Approval Workflow**: Submit → Manager Review → Approve/Reject
- **Status Tracking**: Pending, Approved, Rejected with visual indicators
- **Read-only Lock**: Approved reports become immutable

### 🚨 Problem Reports
- **Issue Tracking**: Document problems with SLA monitoring
- **Status Management**: Open → In Progress → Closed workflow
- **No Approval Required**: Direct submission and status updates
- **SLA Alerts**: Visual indicators for SLA compliance

### 👥 Manager Dashboard
- **Advanced Filtering**: Date range, user, and month/year filters
- **Approval Workflow**: Review and approve/reject MCL reports
- **Data Export**: CSV and Excel export capabilities
- **Quick Statistics**: Real-time counts and status overview

### 💬 Discussion Threads
- **Collaborative Platform**: Team discussions with threaded comments
- **Report Linking**: Link discussions to specific MCL or Problem reports
- **File Attachments**: Support for documents and images
- **Ownership Controls**: Edit/delete own posts and comments

### ⚙️ Admin Features
- **User Management**: Create, activate/deactivate, delete users
- **Role Assignment**: Assign User, Manager, or Admin roles
- **Account Lifecycle**: Full user account management

### 🎛️ Lookup Lists Management (Manager)
- **Dynamic Dropdowns**: Manager-configurable dropdown values
- **CRUD Operations**: Create, Read, Update, Delete lookup values
- **Sort Ordering**: Drag-and-drop reordering of dropdown options
- **Real-time Updates**: Changes reflect immediately in forms

## 🔒 Security

- Password hashing with bcrypt
- Role-based route protection
- SQL injection prevention
- Input validation and sanitization

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React hooks and local storage
- **Routing**: Next.js App Router

## Support

For issues or questions:
1. Check this README
2. Verify database connection
3. Check application logs
4. Test with demo credentials

## License

This project is proprietary software developed for internal use.
