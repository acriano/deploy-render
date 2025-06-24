-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'user',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_points table
CREATE TABLE IF NOT EXISTS collection_points (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  schedule TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Create accepted_materials table
CREATE TABLE IF NOT EXISTS accepted_materials (
  id SERIAL PRIMARY KEY,
  collection_point_id INTEGER NOT NULL REFERENCES collection_points(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  description TEXT,
  UNIQUE(collection_point_id, material_type)
);

-- Create collection_schedules table
CREATE TABLE IF NOT EXISTS collection_schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  collection_point_id INTEGER REFERENCES collection_points(id),
  collector_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'agendada',
  scheduled_date TIMESTAMP NOT NULL,
  completed_date TIMESTAMP,
  address TEXT,
  latitude REAL,
  longitude REAL,
  material_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create schedule_materials table
CREATE TABLE IF NOT EXISTS schedule_materials (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES collection_schedules(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  quantity REAL,
  unit TEXT DEFAULT 'kg'
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  collection_point_id INTEGER REFERENCES collection_points(id),
  collector_id INTEGER REFERENCES users(id),
  schedule_id INTEGER REFERENCES collection_schedules(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  collection_point_id INTEGER NOT NULL REFERENCES collection_points(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_point_materials table
CREATE TABLE IF NOT EXISTS collection_point_materials (
  id SERIAL PRIMARY KEY,
  collection_point_id INTEGER NOT NULL REFERENCES collection_points(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_point_id, material_type)
);

-- Create operating_hours table
CREATE TABLE IF NOT EXISTS operating_hours (
  id SERIAL PRIMARY KEY,
  collection_point_id INTEGER NOT NULL REFERENCES collection_points(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 