export type MarkerStatus = 'safe' | 'warning' | 'danger' | 'disconnected';
export type MarkerSubject = 'haenyeo' | 'taewak';
export type EnvironmentLayer = 'all' | 'danger-zone' | 'wind' | 'water-temperature' | 'current' | 'air-temperature' | 'wave' | 'tide';
export interface MapMarker { id: string; subject: MarkerSubject; status: MarkerStatus; latitude: number; longitude: number; label: string }

export type EmergencyReportType = 'emergency' | 'detailed';
export type EmergencyReportStatus = 'received' | 'reviewing' | 'responding' | 'resolved';
export interface EmergencyMedia { uri: string; type: 'image' | 'video'; mimeType: string | null; size: number | null; fileName: string | null; storagePath?: string | null }
export interface EmergencyReport {
  id?: string;
  type: EmergencyReportType;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  media: EmergencyMedia[];
  sharingConsent: boolean;
  status?: EmergencyReportStatus;
  createdAt?: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export interface RiskBreakdown { safe: number; caution: number; warning: number; danger: number; representativeScore: number | null; representativeLevel: string }
export interface ActivitySummary { workDuration: string; travelDistance: string; averageDepth: string; highestRisk: string; averageRisk: string; alertCount: string; locationActivity: string }
export interface SafetyGuide { id: string; text: string; source?: string; reference?: string }
export interface SafetyReport { period: ReportPeriod; risk: RiskBreakdown; activity: ActivitySummary; commentTitle: string; comment: string; guides: SafetyGuide[]; hasData: boolean }

export type ProductCategory = 'all' | 'taewak' | 'iot' | 'subscription' | 'accessory';
export interface Product { id: string; name: string; price: number; category: Exclude<ProductCategory, 'all'>; image?: string }
export interface Subscription { id: string; name: string; description: string[]; monthlyPrice: number }
