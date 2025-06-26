-- Create database
CREATE DATABASE workload_management;

-- Connect to the database
\c workload_management;

-- Create users table
CREATE TABLE users (
    emp_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('User', 'Manager', 'Admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lookup_list_values table
CREATE TABLE lookup_list_values (
    id SERIAL PRIMARY KEY,
    list_name VARCHAR(50) NOT NULL,
    value VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL,
    manager_id VARCHAR(20) REFERENCES users(emp_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mcl_reports table
CREATE TABLE mcl_reports (
    id VARCHAR(20) PRIMARY KEY,
    client_name_id INTEGER REFERENCES lookup_list_values(id),
    user_id VARCHAR(20) REFERENCES users(emp_id),
    entry_at TIMESTAMP NOT NULL,
    exit_at TIMESTAMP NOT NULL,
    visit_type_id INTEGER REFERENCES lookup_list_values(id),
    purpose_id INTEGER REFERENCES lookup_list_values(id),
    shift_id INTEGER REFERENCES lookup_list_values(id),
    remark TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Approved', 'Rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create problem_reports table
CREATE TABLE problem_reports (
    id VARCHAR(20) PRIMARY KEY,
    client_name_id INTEGER REFERENCES lookup_list_values(id),
    environment_id INTEGER REFERENCES lookup_list_values(id),
    problem_statement TEXT NOT NULL,
    received_at TIMESTAMP NOT NULL,
    rca TEXT,
    solution TEXT,
    attended_by_id VARCHAR(20) REFERENCES users(emp_id),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed')),
    sla_hours INTEGER NOT NULL,
    user_id VARCHAR(20) REFERENCES users(emp_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create discussion_posts table
CREATE TABLE discussion_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    report_type VARCHAR(20) CHECK (report_type IN ('MCL', 'Problem')),
    report_id VARCHAR(20),
    user_id VARCHAR(20) REFERENCES users(emp_id),
    parent_post_id INTEGER REFERENCES discussion_posts(id),
    attachment_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create export_logs table
CREATE TABLE export_logs (
    id SERIAL PRIMARY KEY,
    manager_id VARCHAR(20) REFERENCES users(emp_id),
    report_type VARCHAR(20) NOT NULL,
    filters_json JSONB,
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default users
INSERT INTO users (emp_id, name, email, password_hash, role) VALUES
('EMP001', 'Carol Admin', 'carol.admin@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'Admin'),
('EMP002', 'Bob Manager', 'bob.manager@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'Manager'),
('EMP003', 'Alice User', 'alice.user@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'User'),
('EMP004', 'David Support', 'david.support@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'User'),
('EMP005', 'Emma Lead', 'emma.lead@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'Manager'),
('EMP006', 'Sarah Tech', 'sarah.tech@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'User'),
('EMP007', 'Mike Developer', 'mike.developer@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'User'),
('EMP008', 'Lisa Analyst', 'lisa.analyst@company.com', '$2b$10$rQZ9QmjlhWZ9QmjlhWZ9Qe', 'User');

-- Insert default lookup values
INSERT INTO lookup_list_values (list_name, value, sort_order, manager_id) VALUES
-- Clients
('clients', 'TechCorp Solutions', 1, 'EMP002'),
('clients', 'DataFlow Inc', 2, 'EMP002'),
('clients', 'CloudTech Ltd', 3, 'EMP002'),
('clients', 'InnovateSoft', 4, 'EMP002'),
('clients', 'SystemsPro', 5, 'EMP002'),

-- Visit Types
('visit_types', 'On-site Support', 1, 'EMP002'),
('visit_types', 'Remote Support', 2, 'EMP002'),
('visit_types', 'Consultation', 3, 'EMP002'),
('visit_types', 'Installation', 4, 'EMP002'),
('visit_types', 'Maintenance', 5, 'EMP002'),

-- Purposes
('purposes', 'System Maintenance', 1, 'EMP002'),
('purposes', 'Troubleshooting', 2, 'EMP002'),
('purposes', 'Installation', 3, 'EMP002'),
('purposes', 'Training', 4, 'EMP002'),
('purposes', 'Consultation', 5, 'EMP002'),
('purposes', 'Emergency Support', 6, 'EMP002'),

-- Shifts
('shifts', 'Day Shift', 1, 'EMP002'),
('shifts', 'Evening Shift', 2, 'EMP002'),
('shifts', 'Night Shift', 3, 'EMP002'),
('shifts', 'Weekend', 4, 'EMP002'),

-- Environments
('environments', 'Production', 1, 'EMP002'),
('environments', 'Staging', 2, 'EMP002'),
('environments', 'Development', 3, 'EMP002'),
('environments', 'Testing', 4, 'EMP002'),
('environments', 'UAT', 5, 'EMP002');

-- Create indexes for better performance
CREATE INDEX idx_mcl_reports_user_id ON mcl_reports(user_id);
CREATE INDEX idx_mcl_reports_status ON mcl_reports(status);
CREATE INDEX idx_problem_reports_user_id ON problem_reports(user_id);
CREATE INDEX idx_problem_reports_status ON problem_reports(status);
CREATE INDEX idx_discussion_posts_user_id ON discussion_posts(user_id);
CREATE INDEX idx_lookup_list_values_list_name ON lookup_list_values(list_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mcl_reports_updated_at BEFORE UPDATE ON mcl_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_problem_reports_updated_at BEFORE UPDATE ON problem_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussion_posts_updated_at BEFORE UPDATE ON discussion_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lookup_list_values_updated_at BEFORE UPDATE ON lookup_list_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
