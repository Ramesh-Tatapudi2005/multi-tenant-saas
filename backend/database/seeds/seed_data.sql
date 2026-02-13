-- Seed data for testing
-- Super Admin User (CRITICAL: tenant_id must be NULL)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', NULL, 'superadmin@system.com', '$2b$10$HqJ2qJhTZpQ3v7Z9lG8q..GKe.Zl0u5U2Kq1s5q5J5Q5Q5Q5Q5Q5Q', 'Super Admin', 'super_admin', true)
ON CONFLICT DO NOTHING;

-- Demo Tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', 'Demo Company', 'demo', 'active', 'pro', 25, 15)
ON CONFLICT (subdomain) DO NOTHING;

-- Tenant Admin for Demo Company
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'admin@demo.com', '$2b$10$qRUcbfTZGZvTZpQ3v7Z9l.GKe.Zl0u5U2Kq1s5q5J5Q5Q5Q5Q5Q5Q', 'Demo Admin', 'tenant_admin', true)
ON CONFLICT DO NOTHING;

-- Regular Users for Demo Company
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'user1@demo.com', '$2b$10$zzRzz9q9lG8qZZpQ3v7Z9.GKe.Zl0u5U2Kq1s5q5J5Q5Q5Q5Q5Q5Q', 'Demo User One', 'user', true),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'user2@demo.com', '$2b$10$aaAaa0a0lG8qZZpQ3v7Z9.GKe.Zl0u5U2Kq1s5q5J5Q5Q5Q5Q5Q5Q', 'Demo User Two', 'user', true)
ON CONFLICT DO NOTHING;

-- Sample Projects for Demo Company
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Project Alpha', 'Website Redesign Project', 'active', '550e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Project Beta', 'Mobile App Development', 'active', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT DO NOTHING;

-- Sample Tasks for Projects
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Design Homepage', 'Create homepage design mockup', 'in_progress', 'high', '550e8400-e29b-41d4-a716-446655440004', '2026-07-15'),
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Setup Database', 'Configure production database', 'todo', 'high', '550e8400-e29b-41d4-a716-446655440005', '2026-07-20'),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'API Integration', 'Integrate backend API with frontend', 'todo', 'medium', '550e8400-e29b-41d4-a716-446655440004', '2026-08-01'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Fix bugs', 'Fix reported bugs', 'completed', 'low', null, '2026-06-30'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'User testing', 'Conduct user acceptance testing', 'todo', 'medium', null, '2026-08-15')
ON CONFLICT DO NOTHING;
