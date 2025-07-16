-- Users table: stores user credentials and OAuth info
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- nullable for OAuth-only users
    oauth_provider VARCHAR(32),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profile: health info, demographics, etc.
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(32),
    conditions TEXT[],
    medications TEXT[],
    allergies TEXT[],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved stacks (library)
CREATE TABLE IF NOT EXISTS stacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    stack_data JSONB NOT NULL, -- supplement list, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stack history (timeline)
CREATE TABLE IF NOT EXISTS stack_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stack_id INTEGER REFERENCES stacks(id) ON DELETE CASCADE,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result JSONB -- store analysis result for this check
);

-- Feature voting (priority feedback)
CREATE TABLE IF NOT EXISTS feature_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    feature_id VARCHAR(64) NOT NULL,
    vote INTEGER NOT NULL, -- 1=upvote, -1=downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports (PDF/shareable)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stack_id INTEGER REFERENCES stacks(id) ON DELETE CASCADE,
    pdf_url VARCHAR(512),
    share_token VARCHAR(128) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 