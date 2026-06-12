-- Seed data for initial admin user
-- Default password: Admin123! (change after first login)
-- Password hash for 'Admin123!' using bcrypt

INSERT INTO users (first_name, last_name, email, password_hash, role, status)
VALUES (
    'Admin',
    'User',
    'admin@btrip.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- This is a placeholder, will be generated properly
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is a placeholder.
-- In production, use bcrypt to generate the actual hash for 'Admin123!'
-- You can generate it using: bcrypt.hashSync('Admin123!', 10)

