-- ENH-4: popular_multiplayer 섹션 + session_name 네이밍 기능
ALTER TABLE squad_sessions ADD COLUMN IF NOT EXISTS popular_multiplayer JSONB;
ALTER TABLE squad_sessions ADD COLUMN IF NOT EXISTS session_name TEXT;
