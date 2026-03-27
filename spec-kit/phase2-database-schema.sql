-- ============================================================================
-- TripFrame Phase 2: Database Schema
-- ============================================================================
-- Feature: 002-tripframe-phase2
-- Version: 1.0
-- Created: 2026-03-27
--
-- 사용법:
--   1. Supabase Dashboard → SQL Editor
--   2. 이 파일 내용 전체 복사
--   3. Run 클릭
--
-- 또는:
--   supabase db push --local
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extension 활성화
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Table: user_profiles
-- 사용자 프로필 및 선호도 설정
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,

  -- 선호도 설정 (Phase 2)
  luggage_size TEXT CHECK (luggage_size IN ('CARRY_ON', 'LARGE')) DEFAULT 'CARRY_ON',
  transport_preference TEXT CHECK (transport_preference IN ('PUBLIC', 'TAXI', 'ANY')) DEFAULT 'ANY',
  time_buffer TEXT CHECK (time_buffer IN ('TIGHT', 'RELAXED')) DEFAULT 'RELAXED',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

COMMENT ON TABLE user_profiles IS '사용자 프로필 및 개인화 설정';
COMMENT ON COLUMN user_profiles.luggage_size IS '짐 크기: CARRY_ON(기내용), LARGE(위탁용)';
COMMENT ON COLUMN user_profiles.transport_preference IS '교통 선호: PUBLIC(대중교통), TAXI(택시), ANY(무관)';
COMMENT ON COLUMN user_profiles.time_buffer IS '여유도: TIGHT(빡빡), RELAXED(여유)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ----------------------------------------------------------------------------
-- Table: trips
-- 여행 정보
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(), -- 마지막 동기화 시각

  CONSTRAINT trips_date_range CHECK (end_date >= start_date)
);

COMMENT ON TABLE trips IS '사용자의 여행 계획';
COMMENT ON COLUMN trips.synced_at IS '마지막 클라우드 동기화 시각 (충돌 해결용)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date DESC);

-- ----------------------------------------------------------------------------
-- Table: events
-- 여행 일정 상의 개별 이벤트
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  sub TEXT, -- 부제목
  time TIME NOT NULL,
  day INTEGER NOT NULL, -- 여행 일차 (1, 2, 3...)

  type TEXT NOT NULL CHECK (type IN (
    'flight',    -- 항공편
    'hotel',     -- 호텔
    'transport', -- 이동 수단
    'home',      -- 집 출발
    'activity',  -- 활동
    'prep',      -- 준비
    'warning',   -- 경고 (Phase 2)
    'free'       -- 자유시간 (Phase 2)
  )),

  status TEXT NOT NULL CHECK (status IN (
    'ok',      -- 확정
    'missing', -- 누락
    'warn',    -- 경고 (Phase 2)
    'auto',    -- 자동 (Phase 2)
    'free',    -- 자유 (Phase 2)
    'todo'     -- 할 일 (Phase 2)
  )),

  location TEXT,
  is_derived BOOLEAN DEFAULT FALSE, -- 역산에 의해 생성된 이벤트
  metadata JSONB DEFAULT '{}'::jsonb, -- 추가 정보 (steps 등)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT events_day_positive CHECK (day > 0)
);

COMMENT ON TABLE events IS '여행 일정의 개별 이벤트 (비행기, 호텔, 활동 등)';
COMMENT ON COLUMN events.is_derived IS '역산 엔진에 의해 자동 생성된 이벤트 여부';
COMMENT ON COLUMN events.metadata IS 'JSON 형태의 추가 정보 (역산 steps, 경고 메시지 등)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_events_trip_id ON events(trip_id);
CREATE INDEX IF NOT EXISTS idx_events_day_time ON events(trip_id, day, time);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) 정책
-- ----------------------------------------------------------------------------

-- user_profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- trips RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
CREATE POLICY "Users can view their own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own trips" ON trips;
CREATE POLICY "Users can create their own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
CREATE POLICY "Users can update their own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;
CREATE POLICY "Users can delete their own trips"
  ON trips
  FOR DELETE
  USING (auth.uid() = user_id);

-- events RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view events of their trips" ON events;
CREATE POLICY "Users can view events of their trips"
  ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = events.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create events in their trips" ON events;
CREATE POLICY "Users can create events in their trips"
  ON events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = events.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update events in their trips" ON events;
CREATE POLICY "Users can update events in their trips"
  ON events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = events.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete events in their trips" ON events;
CREATE POLICY "Users can delete events in their trips"
  ON events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = events.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Triggers: updated_at 자동 업데이트
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON user_profiles;
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_trips ON trips;
CREATE TRIGGER set_updated_at_trips
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_events ON events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Sample Data (Optional, for testing)
-- ----------------------------------------------------------------------------
-- 실제 운영 환경에서는 주석 처리할 것

-- INSERT INTO user_profiles (user_id, display_name, luggage_size, transport_preference, time_buffer)
-- VALUES (
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- 실제 auth.users.id로 교체
--   'Test User',
--   'LARGE',
--   'PUBLIC',
--   'RELAXED'
-- );

-- ============================================================================
-- End of Schema
-- ============================================================================

-- 확인 쿼리
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'trips', 'events')
ORDER BY tablename;
