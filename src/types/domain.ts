export type MarkerStatus = 'safe' | 'warning' | 'danger' | 'disconnected';
export type MarkerSubject = 'haenyeo' | 'taewak';
export type EnvironmentLayer = 'all' | 'danger-zone' | 'wind' | 'water-temperature' | 'current' | 'air-temperature' | 'wave' | 'tide';

export interface MapMarker { id: string; subject: MarkerSubject; status: MarkerStatus; latitude: number; longitude: number; label: string }
export interface EmergencyReport { id?: string; description: string; latitude: number | null; longitude: number | null; address: string | null; mediaUri: string | null; mediaType: 'image' | 'video' | null; sharingConsent: boolean; createdAt?: string }

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export interface RiskBreakdown { safe: number; caution: number; warning: number; danger: number; representativeScore: number; representativeLevel: string }
export interface ActivitySummary { workDuration: string; travelDistance: string; averageDepth: string; highestRisk: string }
export interface SafetyGuide { id: string; text: string }
export interface SafetyReport { period: ReportPeriod; risk: RiskBreakdown; activity: ActivitySummary; commentTitle: string; comment: string; guides: SafetyGuide[] }

export type ProductCategory = 'all' | 'taewak' | 'iot' | 'subscription' | 'accessory';
export interface Product { id: string; name: string; price: number; category: Exclude<ProductCategory, 'all'>; image?: string }
export interface Subscription { id: string; name: string; description: string[]; monthlyPrice: number }
