-- Supabase PostgreSQL Schema for AI-First Portfolio Platform

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    problem_statement TEXT,
    motivation TEXT,
    architecture_description TEXT,
    system_diagram_url VARCHAR(1024),
    demo_url VARCHAR(1024),
    github_url VARCHAR(1024),
    challenges TEXT,
    lessons_learned TEXT,
    future_improvements TEXT,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- EXPERIENCE TABLE
CREATE TABLE IF NOT EXISTS experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    technologies TEXT[] DEFAULT '{}',
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- EDUCATION TABLE
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    grade VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- e.g., 'frontend', 'backend', 'ai', 'cloud'
    level INTEGER DEFAULT 3 CHECK (level >= 1 AND level <= 5),
    logo_url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- BLOGS TABLE
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image VARCHAR(1024),
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PUBLICATIONS TABLE
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    publish_date DATE,
    url VARCHAR(1024),
    description TEXT,
    authors TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(1024),
    media_url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- FAQS TABLE
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'other' CHECK (type IN ('work', 'education', 'achievement', 'project', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- GITHUB REPOSITORIES TABLE
CREATE TABLE IF NOT EXISTS github_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(1024) NOT NULL,
    stars INTEGER DEFAULT 0,
    languages TEXT[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE,
    readme_content TEXT,
    sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    visitor_type VARCHAR(100), -- 'recruiter', 'client', 'student', 'other'
    visitor_intent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    text TEXT NOT NULL,
    confidence_score REAL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TRIGGER FOR UPDATING UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_github_repositories_updated_at BEFORE UPDATE ON github_repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. Read access for everyone (anonymous and authenticated users)
CREATE POLICY "Allow public read access on projects" ON projects FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "Allow public read access on experience" ON experience FOR SELECT USING (true);
CREATE POLICY "Allow public read access on education" ON education FOR SELECT USING (true);
CREATE POLICY "Allow public read access on skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Allow public read access on blogs" ON blogs FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "Allow public read access on publications" ON publications FOR SELECT USING (true);
CREATE POLICY "Allow public read access on certificates" ON certificates FOR SELECT USING (true);
CREATE POLICY "Allow public read access on faqs" ON faqs FOR SELECT USING (true);
CREATE POLICY "Allow public read access on timeline_events" ON timeline_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access on github_repositories" ON github_repositories FOR SELECT USING (true);

-- 2. Full write access for authenticated admin users only
CREATE POLICY "Allow admin write access on projects" ON projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on experience" ON experience FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on education" ON education FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on skills" ON skills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on blogs" ON blogs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on publications" ON publications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on certificates" ON certificates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on faqs" ON faqs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on timeline_events" ON timeline_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow admin write access on github_repositories" ON github_repositories FOR ALL TO authenticated USING (true);

-- 3. Conversations and messages write access for everyone (to let visitors chat)
CREATE POLICY "Allow anyone to create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to read conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow anyone to create messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to read messages" ON messages FOR SELECT USING (true);
