// Supabase Database 타입 정의
// 실제 배포 후 `supabase gen types typescript` 명령으로 자동 생성 가능
// 현재는 database-schema.sql 기반 수동 정의

export type LuggageSize = 'CARRY_ON' | 'LARGE';
export type TransportPreference = 'PUBLIC' | 'TAXI' | 'ANY';
export type TimeBuffer = 'TIGHT' | 'RELAXED';

export type EventType =
  | 'flight'
  | 'hotel'
  | 'transport'
  | 'home'
  | 'activity'
  | 'prep'
  | 'warning'
  | 'free';

export type EventStatus = 'ok' | 'missing' | 'warn' | 'auto' | 'free' | 'todo';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          luggage_size: LuggageSize;
          transport_preference: TransportPreference;
          time_buffer: TimeBuffer;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          luggage_size?: LuggageSize;
          transport_preference?: TransportPreference;
          time_buffer?: TimeBuffer;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          luggage_size?: LuggageSize;
          transport_preference?: TransportPreference;
          time_buffer?: TimeBuffer;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          created_at?: string;
          updated_at?: string;
          synced_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          sub: string | null;
          time: string;
          day: number;
          type: EventType;
          status: EventStatus;
          location: string | null;
          is_derived: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          sub?: string | null;
          time: string;
          day: number;
          type: EventType;
          status: EventStatus;
          location?: string | null;
          is_derived?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          sub?: string | null;
          time?: string;
          day?: number;
          type?: EventType;
          status?: EventStatus;
          location?: string | null;
          is_derived?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
