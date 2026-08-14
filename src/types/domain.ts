export type MarkerStatus = 'safe' | 'caution' | 'warning' | 'danger' | 'disconnected';
export type MarkerKind = 'user' | 'device' | 'risk' | 'disconnected';
export type EnvironmentLayer = 'all' | 'haenyeo' | 'taewak' | 'danger-zone' | 'wind' | 'water-temperature' | 'current' | 'air-temperature' | 'wave' | 'tide';

export interface MapMarker {
  id: string; kind: MarkerKind; status: MarkerStatus; latitude: number; longitude: number;
  label: string; userName?: string; userCode?: string; deviceCode?: string;
  region?: string; lastCommunication?: string; batteryPercent?: number; source: 'sample' | 'api';
}
export interface MapCamera { latitude: number; longitude: number; zoom?: number }
export interface RiskZone { id: string; name: string; coordinates: { latitude: number; longitude: number }[]; status: Extract<MarkerStatus, 'caution' | 'warning' | 'danger'> }
export interface EmergencyReport { id?: string; description: string; latitude: number | null; longitude: number | null; address: string | null; mediaUri: string | null; mediaType: 'image' | 'video' | null; sharingConsent: boolean; createdAt?: string }
export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export interface RiskBreakdown { safe: number; caution: number; warning: number; danger: number; representativeScore: number; representativeLevel: string }
export interface ActivitySummary { workDuration: string; travelDistance: string; averageDepth: string; highestRisk: string }
export interface SafetyGuide { id: string; text: string }
export interface SafetyReport { period: ReportPeriod; risk: RiskBreakdown; activity: ActivitySummary; commentTitle: string; comment: string; guides: SafetyGuide[] }
export type ProductCategory = 'all' | 'taewak' | 'iot' | 'subscription' | 'accessory';
export interface Product { id: string; name: string; price: number; category: Exclude<ProductCategory, 'all'>; image?: string }
export interface Subscription { id: string; name: string; description: string[]; monthlyPrice: number }
