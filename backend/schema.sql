-- Business Travel Order Management System Database Schema (SQLite)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_id TEXT UNIQUE NOT NULL,
    responsible_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Travel requests table
CREATE TABLE IF NOT EXISTS travel_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    location_country TEXT NOT NULL,
    location_city TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_allowance REAL NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date)
);

-- Travel orders table
CREATE TABLE IF NOT EXISTS travel_orders (
    id TEXT PRIMARY KEY,
    travel_request_id TEXT NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    approved_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approval_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT, -- JSON stored as TEXT in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order number tracking table (for unique numbering)
CREATE TABLE IF NOT EXISTS order_number_tracking (
    year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_responsible_user ON projects(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_user ON travel_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_project ON travel_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON travel_requests(status);
CREATE INDEX IF NOT EXISTS idx_travel_orders_request ON travel_orders(travel_request_id);
CREATE INDEX IF NOT EXISTS idx_travel_orders_number ON travel_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Trigger to update updated_at timestamp (SQLite version)
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_projects_updated_at 
    AFTER UPDATE ON projects
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_travel_requests_updated_at 
    AFTER UPDATE ON travel_requests
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE travel_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
