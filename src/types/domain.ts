export type MarkerStatus = 'safe' | 'caution' | 'warning' | 'danger' | 'disconnected';
export type MarkerKind = 'user' | 'device' | 'risk' | 'disconnected';
export type MarkerSubject = 'haenyeo' | 'taewak';
export type EnvironmentLayer = 'all' | 'haenyeo' | 'taewak' | 'danger-zone' | 'wind' | 'water-temperature' | 'current' | 'air-temperature' | 'wave' | 'tide';

export interface MapMarker {
  id: string;
  kind: MarkerKind;
  subject?: MarkerSubject;
  status: MarkerStatus;
  latitude: number;
  longitude: number;
  label: string;
  userName?: string;
  userCode?: string;
  deviceCode?: string;
  region?: string;
  lastCommunication?: string;
  batteryPercent?: number;
  source: 'supabase';
}
export interface MapCamera { latitude: number; longitude: number; zoom?: number }
export interface RiskZone { id: string; name: string; coordinates: { latitude: number; longitude: number }[]; status: Extract<MarkerStatus, 'caution' | 'warning' | 'danger'> }

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
export interface ActivitySummary { workDuration: string; travelDistance: string; sessionCount: string; highestRisk: string; averageRisk: string; alertCount: string; locationActivity: string }
export interface SafetyGuide { id: string; text: string; source?: string; reference?: string }
export interface SafetyComment { headline: string; details: string[] }
export interface CurrentRiskFactor { code: string; description: string; score: number }
export interface CurrentSafetySummary { score: number | null; level: import('./database').RiskLevel | null; levelLabel: string; calculatedAt: string | null; factors: CurrentRiskFactor[] }
export interface CurrentActivitySummary { activityStatus: string; battery: string; lastCommunication: string; todayAlerts: string; connectionStatus: string; todayDistance: string }
export interface RecentRiskEvent { id: string; title: string; message: string; type: string; severity: import('./database').AlertSeverity; status: import('./database').AlertStatus; occurredAt: string }
export interface HistoricalSafetySummary { hasData: boolean; risk: RiskBreakdown; activity: ActivitySummary; trend: { at: string; score: number; level: import('./database').RiskLevel }[] }
export interface SafetyReport { period: ReportPeriod; current: CurrentSafetySummary; currentActivity: CurrentActivitySummary; recentAlerts: RecentRiskEvent[]; historical: HistoricalSafetySummary | null; comment: SafetyComment; guides: SafetyGuide[]; hasData: boolean }

export type ProductCategory = 'all' | 'taewak' | 'iot' | 'subscription' | 'accessory';
export interface Product { id: string; name: string; price: number; category: Exclude<ProductCategory, 'all'>; image?: string }
export interface Subscription { id: string; name: string; description: string[]; monthlyPrice: number }
