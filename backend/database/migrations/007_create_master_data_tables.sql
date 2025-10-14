-- ═══════════════════════════════════════════════════════════════
-- 🎓 MASTER DATA: SKILL LEVELS & SPECIALIZATIONS
-- ═══════════════════════════════════════════════════════════════
-- Purpose: Standardize technician skill levels and specializations
-- Author: AGLIS Tech
-- Date: 2025-10-15
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE 1: SKILL LEVELS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS skill_levels (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  
  -- Requirements & Criteria
  min_experience_months INTEGER DEFAULT 0,
  min_completed_tickets INTEGER DEFAULT 0,
  min_avg_rating DECIMAL(3,2) DEFAULT 0.0,
  
  -- Capacity & Performance
  daily_ticket_capacity INTEGER DEFAULT 8,
  expected_resolution_time_hours INTEGER DEFAULT 24,
  can_handle_critical_tickets BOOLEAN DEFAULT false,
  can_mentor_others BOOLEAN DEFAULT false,
  requires_supervision BOOLEAN DEFAULT true,
  
  -- UI Display
  icon VARCHAR(50),
  color VARCHAR(50),
  badge_text VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_skill_levels_code ON skill_levels(code);
CREATE INDEX IF NOT EXISTS idx_skill_levels_active ON skill_levels(is_active);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE 2: SPECIALIZATION CATEGORIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS specialization_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- UI Display
  icon VARCHAR(50),
  color VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_spec_categories_code ON specialization_categories(code);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE 3: SPECIALIZATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS specializations (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES specialization_categories(id),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Requirements
  required_skill_level VARCHAR(50) DEFAULT 'junior',
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
  
  -- Business Priority
  is_high_demand BOOLEAN DEFAULT false,
  is_critical_service BOOLEAN DEFAULT false,
  
  -- UI Display
  icon VARCHAR(50),
  color VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_specializations_code ON specializations(code);
CREATE INDEX IF NOT EXISTS idx_specializations_category ON specializations(category_id);
CREATE INDEX IF NOT EXISTS idx_specializations_active ON specializations(is_active);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE 4: TECHNICIAN SPECIALIZATIONS (Junction Table)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS technician_specializations (
  id SERIAL PRIMARY KEY,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
  specialization_id INTEGER REFERENCES specializations(id),
  
  -- Proficiency
  proficiency_level VARCHAR(50) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'expert'
  years_experience DECIMAL(4,2) DEFAULT 0,
  
  -- Status
  acquired_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(technician_id, specialization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tech_specs_technician ON technician_specializations(technician_id);
CREATE INDEX IF NOT EXISTS idx_tech_specs_specialization ON technician_specializations(specialization_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGER: Update updated_at timestamp
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_skill_levels_updated_at BEFORE UPDATE ON skill_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specializations_updated_at BEFORE UPDATE ON specializations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tech_specs_updated_at BEFORE UPDATE ON technician_specializations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE skill_levels IS 'Master data for technician skill level definitions';
COMMENT ON TABLE specialization_categories IS 'Categories for grouping specializations (FTTH, NOC, etc)';
COMMENT ON TABLE specializations IS 'Master data for technician specialization types';
COMMENT ON TABLE technician_specializations IS 'Junction table linking technicians to their specializations';

