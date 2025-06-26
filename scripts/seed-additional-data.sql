-- Additional seed data for testing
-- Run this after the main schema setup

-- Insert some sample MCL reports for the new users
INSERT INTO mcl_reports (id, client_name_id, user_id, entry_at, exit_at, visit_type_id, purpose_id, shift_id, remark, status) VALUES
('MCL-2025-004', 1, 'EMP004', '2025-06-15T08:00:00', '2025-06-15T16:00:00', 1, 1, 1, 'Database optimization and performance tuning completed successfully', 'Approved'),
('MCL-2025-005', 2, 'EMP004', '2025-06-14T13:00:00', '2025-06-14T21:00:00', 2, 2, 2, 'Resolved critical application errors affecting user login', 'Pending Approval'),
('MCL-2025-006', 3, 'EMP005', '2025-06-13T09:00:00', '2025-06-13T17:00:00', 1, 3, 1, 'New system installation and configuration for client environment', 'Approved'),
('MCL-2025-007', 4, 'EMP005', '2025-06-12T10:00:00', '2025-06-12T18:00:00', 3, 4, 1, 'Training session for client staff on new system features', 'Rejected');

-- Insert some sample problem reports for the new users
INSERT INTO problem_reports (id, client_name_id, environment_id, problem_statement, received_at, rca, solution, attended_by_id, status, sla_hours, user_id) VALUES
('PRB-2025-004', 1, 1, 'Email notifications not being sent to users', '2025-06-15T11:00:00', 'SMTP server configuration issue', 'Updated SMTP settings and tested email delivery', 'EMP004', 'Closed', 4, 'EMP004'),
('PRB-2025-005', 2, 2, 'Report generation taking too long', '2025-06-14T15:30:00', 'Database query optimization needed', 'Currently optimizing database queries and indexes', 'EMP004', 'In Progress', 8, 'EMP004'),
('PRB-2025-006', 3, 1, 'User interface not responsive on mobile devices', '2025-06-13T14:00:00', '', '', 'EMP005', 'Open', 24, 'EMP005'),
('PRB-2025-007', 4, 3, 'API endpoints returning 500 errors intermittently', '2025-06-12T16:45:00', 'Memory leak in application server', 'Implemented memory management fixes and monitoring', 'EMP005', 'Closed', 2, 'EMP005');

-- Insert some sample discussion posts
INSERT INTO discussion_posts (title, content, report_type, report_id, user_id, is_active) VALUES
('Database Performance Best Practices', 'I wanted to share some insights from recent database optimization work. Here are key strategies that have worked well for our clients...', 'Problem', 'PRB-2025-004', 'EMP004', true),
('Mobile Responsiveness Issues - Need Team Input', 'We are seeing recurring mobile responsiveness issues across multiple client sites. What approaches have worked best for your projects?', 'Problem', 'PRB-2025-006', 'EMP005', true),
('Training Session Feedback and Improvements', 'Following the recent training session rejection, I would like to discuss how we can improve our training delivery approach...', 'MCL', 'MCL-2025-007', 'EMP005', true),
('Email Notification System Upgrade', 'Successfully resolved the email notification issues. Documenting the solution for future reference and team knowledge sharing.', 'Problem', 'PRB-2025-004', 'EMP004', true);

-- Update some lookup values to show manager ownership
UPDATE lookup_list_values SET manager_id = 'EMP005' WHERE list_name IN ('clients', 'visit_types') AND id > 3;

-- Insert export logs for testing manager dashboard
INSERT INTO export_logs (manager_id, report_type, filters_json) VALUES
('EMP002', 'MCL', '{"dateFrom": "2025-06-01", "dateTo": "2025-06-18", "status": "all"}'),
('EMP005', 'Problem', '{"dateFrom": "2025-06-10", "dateTo": "2025-06-18", "status": "Open"}'),
('EMP002', 'MCL', '{"user": "EMP003", "month": "2025-06"}');
