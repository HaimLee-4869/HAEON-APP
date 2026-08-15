import { supabase } from '../lib/supabase/client';
import type { AlertStatus, AlertSeverity, DeviceStatus, RiskLevel } from '../types/database';
import type { ReportPeriod, SafetyComment, SafetyGuide, SafetyReport, HistoricalSafetySummary } from '../types/domain';
import { calculateRisk, getRiskLevel, parseStoredRiskFactors, type RiskFactor, type RiskInput } from '../lib/risk/risk-engine';

export interface WorkSessionRow { id?: string; device_id?: string; started_at: string; ended_at: string | null; status?: 'scheduled' | 'active' | 'completed' | 'cancelled' }
export interface LocationRow { device_id?: string; latitude: number; longitude: number; measured_at: string; activity_status?: string | null; speed_kmh?: number | null; emergency_button?: boolean | null }
export interface RiskRow { score: number; level: RiskLevel; factors?: unknown; calculated_at?: string }
export interface AlertRow { id: string; title?: string; message?: string; type?: string; severity?: AlertSeverity; status?: AlertStatus; occurred_at?: string }
export interface CurrentDeviceRow { status: DeviceStatus; battery_level: number | null; last_communicated_at: string | null }
export interface SafetyReportDataset { sessions: WorkSessionRow[]; locations: LocationRow[]; risks: RiskRow[]; alerts: AlertRow[]; currentRisk?: RiskRow | null; currentLocation?: LocationRow | null; device?: CurrentDeviceRow | null }
export interface PeriodWindow { from: string; to: string }
const labels: Record<RiskLevel, string> = { safe: '안전', caution: '주의', warning: '경고', danger: '위험' };
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export function periodWindow(period: ReportPeriod, now = new Date()): PeriodWindow { const kst = new Date(now.getTime() + KST_OFFSET_MS); const days = period === 'daily' ? 0 : period === 'weekly' ? 6 : 29; return { from: new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - days) - KST_OFFSET_MS).toISOString(), to: now.toISOString() }; }
export function periodStart(period: ReportPeriod, now = new Date()) { return new Date(periodWindow(period, now).from); }
export function distanceKm(a: LocationRow, b: LocationRow) { const rad = Math.PI / 180; const dLat = (b.latitude-a.latitude)*rad; const dLon=(b.longitude-a.longitude)*rad; const q=Math.sin(dLat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dLon/2)**2; return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)); }
const durationText = (minutes: number) => minutes > 0 ? `${Math.floor(minutes/60)}시간 ${Math.round(minutes%60)}분` : '데이터 없음';
const validLocations = (rows: LocationRow[]) => [...rows].filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && Math.abs(r.latitude)<=90 && Math.abs(r.longitude)<=180).sort((a,b)=>a.measured_at.localeCompare(b.measured_at));
const relative = (at: string | null | undefined, now: Date) => { if (!at) return '데이터 없음'; const minutes=Math.max(0,Math.floor((now.getTime()-Date.parse(at))/60000)); return minutes<1?'방금 전':minutes<60?`${minutes}분 전`:minutes<1440?`${Math.floor(minutes/60)}시간 전`:`${Math.floor(minutes/1440)}일 전`; };

export function aggregateHistorical(period: ReportPeriod, data: SafetyReportDataset): HistoricalSafetySummary {
  const seen=new Set<string>(); const sessions=data.sessions.filter((s)=>{ if(s.status&&s.status!=='completed'||!s.ended_at||(s.id&&seen.has(s.id)))return false;if(s.id)seen.add(s.id);const d=Date.parse(s.ended_at)-Date.parse(s.started_at);return Number.isFinite(d)&&d>0&&d<=18*3_600_000; });
  const locations=validLocations(data.locations); const km=locations.slice(1).reduce((sum,row,i)=>sum+distanceKm(locations[i]!,row),0); const counts={safe:0,caution:0,warning:0,danger:0}; data.risks.forEach(r=>counts[r.level]++); const total=data.risks.length; const pct={safe:0,caution:0,warning:0,danger:0}; if(total)(Object.keys(counts) as RiskLevel[]).forEach(k=>pct[k]=Math.round(counts[k]/total*100));
  const avg=total?Math.round(data.risks.reduce((s,r)=>s+r.score,0)/total):null; const max=total?Math.max(...data.risks.map(r=>r.score)):null; const minutes=sessions.reduce((s,r)=>s+(Date.parse(r.ended_at!)-Date.parse(r.started_at))/60000,0);
  return { hasData:Boolean(sessions.length||locations.length||data.risks.length||data.alerts.length), risk:{...pct,representativeScore:avg,representativeLevel:avg===null?'데이터 없음':labels[avg>=70?'danger':avg>=45?'warning':avg>=20?'caution':'safe']}, activity:{workDuration:durationText(minutes),travelDistance:km?`${km.toFixed(1)} km`:'데이터 없음',sessionCount:`${sessions.length}건`,highestRisk:max===null?'데이터 없음':`${max}점`,averageRisk:avg===null?'데이터 없음':`${avg}점`,alertCount:`${data.alerts.length}건`,locationActivity:`${locations.length}건`}, trend:data.risks.filter(r=>r.calculated_at).map(r=>({at:r.calculated_at!,score:r.score,level:r.level})) };
}

const guideRules: Record<string,string> = { strong_wind:'풍속이 강합니다. 작업시간을 단축하고 안전구역 복귀를 준비하세요.',high_wave:'파고가 높습니다. 연안으로 복귀하고 입수를 중단하세요.',low_water_temperature:'수온이 낮습니다. 저체온 증상을 확인하고 보온 장비를 점검하세요.',communication_lost:'통신이 끊겼습니다. 장치와 관제 연결 상태를 즉시 확인하세요.',communication_delayed:'마지막 통신이 지연되고 있습니다. 장치 통신 상태를 확인하세요.',low_battery:'배터리가 부족합니다. 작업 전 장치를 충전하거나 교체하세요.',danger_zone_entry:'위험구역에서 벗어나 안전구역으로 이동하세요.',emergency_button:'긴급신호가 감지되었습니다. 관리자 또는 보호자가 즉시 상태를 확인하세요.',prolonged_inactivity:'장시간 무활동이 감지되었습니다. 대상자의 상태를 확인하세요.',wave_warning:'풍랑경보가 발효 중입니다. 해상 작업을 중단하세요.',wave_advisory:'풍랑주의보가 발효 중입니다. 작업 단축과 조기 복귀를 권장합니다.',fast_current:'유속이 빠릅니다. 연안 복귀를 권장합니다.',heavy_precipitation:'강수가 예상됩니다. 시야와 통신 상태를 자주 확인하세요.' };
function mergedFactors(stored: unknown, computed: RiskFactor[]) { const parsed=parseStoredRiskFactors(stored); const map=new Map<string,RiskFactor>(); [...parsed,...computed].forEach(f=>map.set(f.code,f)); return [...map.values()]; }

const factorPriority = ['emergency_button','danger_zone_entry','communication_lost','prolonged_inactivity','wave_warning','high_wave','strong_wind','low_water_temperature','low_battery','heavy_precipitation','wave_advisory','fast_current'];
const factorRank = (code: string) => { const index=factorPriority.indexOf(code); return index < 0 ? factorPriority.length : index; };
export function buildSafetyComment(input: { score: number; factors: RiskFactor[]; location: LocationRow | null; device: CurrentDeviceRow | null; alerts: AlertRow[]; environment?: Omit<RiskInput,'assessedAt'>; historical?: HistoricalSafetySummary | null }): SafetyComment {
  const { score, location, device, alerts, environment = {}, historical } = input;
  const level=getRiskLevel(score); const levelLabel=labels[level]; const factors=[...input.factors].sort((a,b)=>factorRank(a.code)-factorRank(b.code));
  const hasEmergency=location?.emergency_button===true||factors.some(f=>f.code==='emergency_button')||alerts.some(a=>/emergency|sos|긴급/i.test(`${a.type} ${a.title}`));
  const hasConnectionLoss=device?.status==='offline'||factors.some(f=>f.code==='communication_lost');
  const details:string[]=[];
  if(hasEmergency) details.push('긴급 버튼 신호가 확인되어 가장 우선적인 상태 확인이 필요합니다.');
  else if(factors.length) details.push(`${factors.slice(0,2).map(f=>f.description).join(' 및 ')}이(가) 현재 점수에 주요하게 반영되었습니다.`);
  else if(device?.status==='online'&&device.battery_level!=null) details.push(`태왁은 정상 연결 상태이며 배터리는 ${device.battery_level}%입니다.`);

  if(hasConnectionLoss) details.push('태왁 통신이 끊긴 상태이므로 현재 위치와 작업 상태를 원격 정보만으로 확인하기 어렵습니다.');
  else if(!hasEmergency) {
    const observations:string[]=[];
    if(environment.windSpeedMps!=null) observations.push(`풍속 ${environment.windSpeedMps.toFixed(1)}m/s`);
    if(environment.waveHeightM!=null) observations.push(`파고 ${environment.waveHeightM.toFixed(1)}m`);
    if(environment.waterTemperatureC!=null) observations.push(`수온 ${environment.waterTemperatureC.toFixed(1)}℃`);
    if(environment.currentSpeedCms!=null) observations.push(`유속 ${environment.currentSpeedCms.toFixed(0)}cm/s`);
    if(observations.length) details.push(`현재 해양환경은 ${observations.slice(0,3).join(', ')}로 관측되어 변화 여부를 계속 확인하고 있습니다.`);
  }
  if(level==='safe'&&!hasEmergency&&!hasConnectionLoss&&factors.length===0&&alerts.length===0) details.push('최근 긴급신호나 뚜렷한 위험요인은 확인되지 않았습니다.');
  else if(level==='caution') details.push('작업 시간을 조절하고 주변 해상 상황을 한 번 더 확인해 주세요.');
  else if(level==='warning') details.push('안전구역 이동 또는 작업 종료를 검토할 필요가 있습니다.');
  else if(level==='danger') details.push('즉시 대상자의 상태를 확인하고 보호자·관리자와 공동 대응해 주세요.');
  if(historical?.hasData&&details.length<3) details.push(`기간 평균 위험도는 ${historical.activity.averageRisk}, 최고 위험도는 ${historical.activity.highestRisk}입니다.`);
  const hasEnoughData=Boolean(location||device||alerts.length||factors.length||Object.values(environment).some(v=>v!==null&&v!==undefined));
  if(!hasEnoughData) details.push('일부 활동 데이터가 아직 충분하지 않아 현재 수집된 정보 기준으로 분석했습니다.','태왁의 연결 상태와 최근 위험 이벤트를 지속적으로 확인하고 있습니다.');
  return { headline:`현재 위험도는 ${levelLabel} 단계이며 ${score}점입니다.`, details:details.slice(0,3) };
}
export function composeSafetyReport(period: ReportPeriod, data: SafetyReportDataset, environmentalInput: Omit<RiskInput,'assessedAt'> = {}, now = new Date()): SafetyReport {
  const location=data.currentLocation??validLocations(data.locations).at(-1)??null; const device=data.device??null; const delay=device?.last_communicated_at?(now.getTime()-Date.parse(device.last_communicated_at))/60000:null;
  const computed=calculateRisk({assessedAt:now.toISOString(),lastMovementAt:location?.measured_at,communicationStatus:device?.status??'unknown',communicationDelayMinutes:delay,batteryLevel:device?.battery_level,emergencyButton:location?.emergency_button,speedKmh:location?.speed_kmh,...environmentalInput}); const stored=data.currentRisk??[...data.risks].sort((a,b)=>(b.calculated_at??'').localeCompare(a.calculated_at??''))[0]??null; const factors=mergedFactors(stored?.factors,computed.factors); const score=stored?.score??computed.score; const level=getRiskLevel(score);
  const todayFrom=periodWindow('daily',now).from; const todayAlerts=data.alerts.filter(a=>(a.occurred_at??'')>=todayFrom); const alerts=[...data.alerts].sort((a,b)=>(b.occurred_at??'').localeCompare(a.occurred_at??'')).slice(0,5).map(a=>({id:a.id,title:a.title??a.type??'위험 알림',message:a.message??'',type:a.type??'unknown',severity:a.severity??'info',status:a.status??'open',occurredAt:a.occurred_at??now.toISOString()})); const todayLocations=validLocations(data.locations.filter(l=>l.measured_at>=todayFrom)); const todayKm=todayLocations.slice(1).reduce((s,r,i)=>s+distanceKm(todayLocations[i]!,r),0);
  const guides:SafetyGuide[]=factors.flatMap((f,i)=>{const text=guideRules[f.code];return text?[{id:`${f.code}-${i}`,text,source:'HAEON 안전 기준',reference:f.code}]:[];}).slice(0,4);
  const historical=period==='daily'?null:aggregateHistorical(period,data); const comment=buildSafetyComment({score,factors,location,device,alerts:data.alerts,environment:environmentalInput,historical}); return {period,current:{score,level,levelLabel:labels[level],calculatedAt:stored?.calculated_at??now.toISOString(),factors:factors.map(f=>({code:f.code,description:f.description,score:f.score}))},currentActivity:{activityStatus:location?.activity_status??'데이터 없음',battery:device?.battery_level==null?'데이터 없음':`${device.battery_level}%`,lastCommunication:relative(device?.last_communicated_at,now),todayAlerts:`${todayAlerts.length}건`,connectionStatus:device?.status==='online'?'연결됨':device?.status==='offline'?'연결 끊김':device?.status==='maintenance'?'점검 중':'미할당',todayDistance:todayKm?`${todayKm.toFixed(1)} km`:'데이터 없음'},recentAlerts:alerts,historical,comment,guides,hasData:Boolean(stored||location||device||alerts.length)};
}

export class SupabaseSafetyReportService {
  composeSnapshot(data: SafetyReportDataset, environmentalInput: Omit<RiskInput, 'assessedAt'> = {}) {
    return composeSafetyReport('daily', data, environmentalInput);
  }

  private async resolve<T>(query: PromiseLike<{ data: T; error: { message: string } | null }>, label: string): Promise<T> {
    const timeoutMs = 12_000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        Promise.resolve(query).then(({ data, error }) => { if (error) throw new Error(`${label}: ${error.message}`); return data; }),
        new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: 요청 시간이 초과되었습니다.`)), timeoutMs); }),
      ]);
    } finally { if (timer) clearTimeout(timer); }
  }

  async getCurrentRisk(haenyeoId: string, deviceId?: string | null) {
    if (!supabase) return null;
    let query = supabase.from('risk_scores').select('device_id,score,level,factors,calculated_at').eq('haenyeo_id', haenyeoId).order('calculated_at', { ascending: false }).limit(1);
    if (deviceId) query = query.eq('device_id', deviceId);
    const data = await this.resolve(query, '최신 위험점수 조회 실패');
    return (data?.[0] ?? null) as RiskRow | null;
  }

  async getCurrentLocation(haenyeoId: string, deviceId?: string | null) {
    if (!supabase) return null;
    let query = supabase.from('device_locations').select('device_id,latitude,longitude,measured_at,activity_status,speed_kmh,emergency_button').eq('haenyeo_id', haenyeoId).order('measured_at', { ascending: false }).limit(1);
    if (deviceId) query = query.eq('device_id', deviceId);
    const data = await this.resolve(query, '최신 위치 조회 실패');
    return (data?.[0] ?? null) as LocationRow | null;
  }

  async getDevice(deviceId: string) {
    if (!supabase) return null;
    const data = await this.resolve(supabase.from('devices').select('status,battery_level,last_communicated_at').eq('id', deviceId).limit(1), '장치 조회 실패');
    return (data?.[0] ?? null) as CurrentDeviceRow | null;
  }

  async getRecentAlerts(haenyeoId: string, deviceId?: string | null) {
    if (!supabase) return [] as AlertRow[];
    let query = supabase.from('alerts').select('id,device_id,title,message,type,severity,status,occurred_at').eq('haenyeo_id', haenyeoId).order('occurred_at', { ascending: false }).limit(5);
    if (deviceId) query = query.eq('device_id', deviceId);
    return this.resolve(query, '최근 알림 조회 실패') as Promise<AlertRow[]>;
  }

  async getDailyActivity(haenyeoId: string, deviceId?: string | null) {
    if (!supabase) return { locations: [] as LocationRow[], sessions: [] as WorkSessionRow[] };
    const { from, to } = periodWindow('daily');
    let locations = supabase.from('device_locations').select('device_id,latitude,longitude,measured_at,activity_status,speed_kmh,emergency_button').eq('haenyeo_id', haenyeoId).gte('measured_at', from).lte('measured_at', to).order('measured_at');
    let sessions = supabase.from('work_sessions').select('id,device_id,started_at,ended_at,status').eq('haenyeo_id', haenyeoId).gte('started_at', from).lte('started_at', to);
    if (deviceId) { locations = locations.eq('device_id', deviceId); sessions = sessions.eq('device_id', deviceId); }
    const [locationRows, sessionRows] = await Promise.all([this.resolve(locations, '오늘 위치 조회 실패'), this.resolve(sessions, '오늘 작업 조회 실패')]);
    return { locations: locationRows as LocationRow[], sessions: sessionRows as WorkSessionRow[] };
  }

  async getHistorical(period: Exclude<ReportPeriod, 'daily'>, haenyeoId: string, deviceId?: string | null) {
    if (!supabase) return aggregateHistorical(period, { sessions: [], locations: [], risks: [], alerts: [] });
    const { from, to } = periodWindow(period);
    let sessions = supabase.from('work_sessions').select('id,device_id,started_at,ended_at,status').eq('haenyeo_id', haenyeoId).gte('started_at', from).lte('started_at', to);
    let locations = supabase.from('device_locations').select('device_id,latitude,longitude,measured_at,activity_status,speed_kmh,emergency_button').eq('haenyeo_id', haenyeoId).gte('measured_at', from).lte('measured_at', to).order('measured_at');
    let risks = supabase.from('risk_scores').select('device_id,score,level,factors,calculated_at').eq('haenyeo_id', haenyeoId).gte('calculated_at', from).lte('calculated_at', to).order('calculated_at');
    let alerts = supabase.from('alerts').select('id,device_id,title,message,type,severity,status,occurred_at').eq('haenyeo_id', haenyeoId).gte('occurred_at', from).lte('occurred_at', to);
    if (deviceId) { sessions = sessions.eq('device_id', deviceId); locations = locations.eq('device_id', deviceId); risks = risks.eq('device_id', deviceId); alerts = alerts.eq('device_id', deviceId); }
    const rows = await Promise.all([this.resolve(sessions, '기간 작업 조회 실패'), this.resolve(locations, '기간 위치 조회 실패'), this.resolve(risks, '기간 위험점수 조회 실패'), this.resolve(alerts, '기간 알림 조회 실패')]);
    return aggregateHistorical(period, { sessions: rows[0] as WorkSessionRow[], locations: rows[1] as LocationRow[], risks: rows[2] as RiskRow[], alerts: rows[3] as AlertRow[] });
  }

  async getSafetyReport(period:ReportPeriod,haenyeoId:string,deviceId?:string|null,environmentalInput:Omit<RiskInput,'assessedAt'>={}) { if(!supabase)return composeSafetyReport(period,{sessions:[],locations:[],risks:[],alerts:[]},environmentalInput); const {from,to}=periodWindow(period); const historyFrom=period==='daily'?periodWindow('daily').from:from; let sessions=supabase.from('work_sessions').select('id,device_id,started_at,ended_at,status').eq('haenyeo_id',haenyeoId).gte('started_at',historyFrom).lte('started_at',to); let locations=supabase.from('device_locations').select('device_id,latitude,longitude,measured_at,activity_status,speed_kmh,emergency_button').eq('haenyeo_id',haenyeoId).gte('measured_at',historyFrom).lte('measured_at',to).order('measured_at'); let risks=supabase.from('risk_scores').select('device_id,score,level,factors,calculated_at').eq('haenyeo_id',haenyeoId).gte('calculated_at',historyFrom).lte('calculated_at',to).order('calculated_at'); let alerts=supabase.from('alerts').select('id,device_id,title,message,type,severity,status,occurred_at').eq('haenyeo_id',haenyeoId).order('occurred_at',{ascending:false}).limit(5); let latestLocation=supabase.from('device_locations').select('device_id,latitude,longitude,measured_at,activity_status,speed_kmh,emergency_button').eq('haenyeo_id',haenyeoId).order('measured_at',{ascending:false}).limit(1); let latestRisk=supabase.from('risk_scores').select('device_id,score,level,factors,calculated_at').eq('haenyeo_id',haenyeoId).order('calculated_at',{ascending:false}).limit(1); let device=deviceId?supabase.from('devices').select('status,battery_level,last_communicated_at').eq('id',deviceId).limit(1):null; if(deviceId){sessions=sessions.eq('device_id',deviceId);locations=locations.eq('device_id',deviceId);risks=risks.eq('device_id',deviceId);alerts=alerts.eq('device_id',deviceId);latestLocation=latestLocation.eq('device_id',deviceId);latestRisk=latestRisk.eq('device_id',deviceId);} const results=await Promise.all([sessions,locations,risks,alerts,latestLocation,latestRisk,device]); const error=results.find(r=>r?.error)?.error;if(error)throw new Error(`안전 리포트 데이터를 불러오지 못했습니다. ${error.message}`); return composeSafetyReport(period,{sessions:(results[0].data??[]) as WorkSessionRow[],locations:(results[1].data??[]) as LocationRow[],risks:(results[2].data??[]) as RiskRow[],alerts:(results[3].data??[]) as AlertRow[],currentLocation:(results[4].data?.[0]??null) as LocationRow|null,currentRisk:(results[5].data?.[0]??null) as RiskRow|null,device:(results[6]?.data?.[0]??null) as CurrentDeviceRow|null},environmentalInput); }
}
export const safetyReportService=new SupabaseSafetyReportService();
