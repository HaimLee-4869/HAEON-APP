export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'super_admin' | 'organization_admin' | 'operator' | 'viewer';
export type RiskLevel = 'safe' | 'caution' | 'warning' | 'danger';
export type AlertSeverity = 'info' | 'caution' | 'warning' | 'danger';
export type AlertStatus = 'open' | 'acknowledged' | 'responding' | 'resolved';
export type DeviceStatus = 'online' | 'offline' | 'maintenance';

export interface Profile { id: string; display_name: string; email: string; status: 'active' | 'inactive'; created_at: string; updated_at: string }
export interface Organization { id: string; name: string; type: 'fishery_cooperative' | 'local_government' | 'public_agency' | 'company'; region: string; created_at: string; updated_at: string }
export interface OrganizationMembership { id: string; organization_id: string; profile_id: string; role: UserRole; status: 'active' | 'inactive'; created_at: string; updated_at: string }
export interface Haenyeo { id: string; organization_id: string; user_code: string; display_name: string; user_type: 'haenyeo' | 'fisher'; status: 'active' | 'inactive'; activity_region: string; emergency_contact: string | null; created_at: string; updated_at: string }
export interface Device { id: string; device_code: string; device_type: string; network_type: 'lora' | 'lte' | 'simulator'; status: DeviceStatus; battery_level: number | null; assigned_haenyeo_id: string | null; last_communicated_at: string | null; created_at: string; updated_at: string }
export interface DeviceLocation { id: string; device_id: string; haenyeo_id: string; latitude: number; longitude: number; location: unknown; speed_kmh: number | null; activity_status: string; measured_at: string; created_at: string; sequence_number: number | null; signal_strength: number | null; emergency_button: boolean; raw_payload: Json | null }
export interface RiskScore { id: string; haenyeo_id: string; device_id: string; score: number; level: RiskLevel; factors: Json; calculated_at: string; created_at: string }
export interface Alert { id: string; haenyeo_id: string | null; device_id: string | null; type: string; severity: AlertSeverity; title: string; message: string; location: unknown; status: AlertStatus; occurred_at: string; acknowledged_at: string | null; response_started_at: string | null; resolved_at: string | null; assigned_profile_id: string | null; created_at: string; updated_at: string }
export interface WorkSession { id: string; haenyeo_id: string; device_id: string; started_at: string; ended_at: string | null; departure_location: unknown; returned_safely: boolean | null; status: 'scheduled' | 'active' | 'completed' | 'cancelled'; created_at: string; updated_at: string }

export interface CurrentAccess { profile: Profile; memberships: OrganizationMembership[]; organizations: Organization[]; primaryMembership: OrganizationMembership | null; primaryOrganization: Organization | null; role: UserRole | null }
export interface MonitoringSubject { haenyeo: Haenyeo; device: Device | null; latestLocation: DeviceLocation | null; latestRisk: RiskScore | null; batteryLevel: number | null; connectionStatus: DeviceStatus | 'unassigned'; lastCommunicatedAt: string | null }
