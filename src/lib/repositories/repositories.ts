import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { DataError, mapSupabaseError } from './errors';
import type { Alert, CurrentAccess, Device, DeviceLocation, Haenyeo, Organization, OrganizationMembership, Profile, RiskScore, WorkSession } from '@/types/database';
import { selectLatestBy } from '@/lib/data-utils';

function client() { if (!supabase) throw new DataError('network_error', 'Supabase가 설정되지 않았습니다.'); return supabase; }
async function rows<T>(query: PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>): Promise<T[]> { const { data, error } = await query; if (error) throw mapSupabaseError(error); return (data ?? []) as T[]; }

export const profileRepository = {
  async getCurrent(user: User): Promise<CurrentAccess> {
    const [profiles, memberships] = await Promise.all([
      rows<Profile>(client().from('profiles').select('*').eq('id', user.id).limit(1)),
      rows<OrganizationMembership>(client().from('organization_memberships').select('*').eq('profile_id', user.id).eq('status', 'active').order('created_at')),
    ]);
    const profile = profiles[0];
    if (!profile) throw new DataError('permission_denied', '활성 사용자 프로필을 찾을 수 없습니다.');
    const ids = memberships.map((item) => item.organization_id);
    const organizations = ids.length ? await rows<Organization>(client().from('organizations').select('*').in('id', ids).order('name')) : [];
    const primaryMembership = memberships[0] ?? null;
    return { profile, memberships, organizations, primaryMembership, primaryOrganization: organizations.find((item) => item.id === primaryMembership?.organization_id) ?? null, role: primaryMembership?.role ?? null };
  },
};

export const organizationRepository = { list: () => rows<Organization>(client().from('organizations').select('*').order('name')) };
export const haenyeoRepository = { list: () => rows<Haenyeo>(client().from('haenyeo').select('*').order('user_code')) };
export const deviceRepository = { list: () => rows<Device>(client().from('devices').select('*').order('device_code')) };
export const locationRepository = {
  async latest(): Promise<DeviceLocation[]> { const all = await rows<DeviceLocation>(client().from('device_locations').select('*').order('measured_at', { ascending: false }).limit(2000)); return selectLatestBy(all, (item) => item.device_id); },
};
export const riskRepository = {
  async latest(): Promise<RiskScore[]> { const all = await rows<RiskScore>(client().from('risk_scores').select('*').order('calculated_at', { ascending: false }).limit(2000)); return selectLatestBy(all, (item) => item.haenyeo_id); },
};
export const alertRepository = { list: () => rows<Alert>(client().from('alerts').select('*').order('occurred_at', { ascending: false }).limit(500)) };
export const workSessionRepository = { list: () => rows<WorkSession>(client().from('work_sessions').select('*').order('started_at', { ascending: false }).limit(500)) };
