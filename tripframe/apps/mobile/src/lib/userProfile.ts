import { supabase } from './supabase';
import type { LuggageSize, TransportPreference, TimeBuffer } from './database.types';

export type UserProfile = {
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

type UserProfileUpdates = {
  display_name?: string;
  luggage_size?: LuggageSize;
  transport_preference?: TransportPreference;
  time_buffer?: TimeBuffer;
};

export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return existing as UserProfile;

  const { data: created, error } = await supabase
    .from('user_profiles')
    .insert([{ user_id: userId }] as never)
    .select()
    .single();

  if (error) {
    console.error('[userProfile] 프로필 생성 실패:', error.message);
    return null;
  }

  return created as UserProfile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[userProfile] 프로필 조회 실패:', error.message);
    return null;
  }

  return data as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdates,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[userProfile] 프로필 업데이트 실패:', error.message);
    return null;
  }

  return data as UserProfile;
}
