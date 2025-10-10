-- Contact form submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_created_at ON submissions(created_at DESC);

-- Index for searching by email
CREATE INDEX IF NOT EXISTS idx_email ON submissions(email);
