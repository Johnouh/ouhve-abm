-- Database indexes for performance optimization
-- These should be applied after the initial schema is created

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Members table indexes  
CREATE INDEX IF NOT EXISTS idx_members_franchise_id ON members(franchise_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);

-- Staff table indexes
CREATE INDEX IF NOT EXISTS idx_staff_franchise_id ON staff(franchise_id);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);
CREATE INDEX IF NOT EXISTS idx_staff_phone ON staff(phone);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_franchise_id ON products(franchise_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Lockers table indexes
CREATE INDEX IF NOT EXISTS idx_lockers_franchise_id ON lockers(franchise_id);
CREATE INDEX IF NOT EXISTS idx_lockers_member_id ON lockers(member_id);
CREATE INDEX IF NOT EXISTS idx_lockers_section ON lockers(section);

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_franchise_id ON attendance(franchise_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Schedules table indexes
CREATE INDEX IF NOT EXISTS idx_schedules_franchise_id ON schedules(franchise_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);

-- Personal training table indexes
CREATE INDEX IF NOT EXISTS idx_personal_training_franchise_id ON personal_training(franchise_id);
CREATE INDEX IF NOT EXISTS idx_personal_training_member_id ON personal_training(member_id);
CREATE INDEX IF NOT EXISTS idx_personal_training_trainer_id ON personal_training(trainer_id);

-- Memberships table indexes
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_start_date ON memberships(start_date);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, date);
CREATE INDEX IF NOT EXISTS idx_lockers_franchise_section ON lockers(franchise_id, section);
CREATE INDEX IF NOT EXISTS idx_products_franchise_status ON products(franchise_id, status);