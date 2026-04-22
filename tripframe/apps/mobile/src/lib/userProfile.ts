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

/**
 * 프로필이 없으면 생성, 있으면 그대로 반환.
 * - maybeSingle(): row 없으면 null 반환 (single()은 없으면 406 에러)
 * - upsert + ignoreDuplicates: 동시 호출 시 중복 INSERT(409) 방지
 */
export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  // 충돌 시 무시하고 기존 row 유지
  await supabase
    .from('user_profiles')
    .upsert([{ user_id: userId }], { onConflict: 'user_id', ignoreDuplicates: true });

  return getUserProfile(userId);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[userProfile] 프로필 조회 실패:', error.message);
    return null;
  }

  return data as UserProfile | null;
}

export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdates,
): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[userProfile] 프로필 업데이트 실패:', error.message);
    return null;
  }

  return data as UserProfile | null;
}
