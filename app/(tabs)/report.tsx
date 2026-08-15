import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Gauge, Navigation } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { PageTitle, Screen } from '@/components/screen';
import { Card, EmptyState, ErrorState, SegmentedControl } from '@/components/ui';
import { RiskDonut, riskLevelColors } from '@/components/risk-donut';
import { colors } from '@/constants/theme';
import { safetyReportService } from '@/services/safety-report-service';
import type { HistoricalSafetySummary, ReportPeriod, SafetyReport } from '@/types/domain';
import { useMonitoringSubjects } from '@/hooks/use-supabase-data';
import { useMarineForecast, useOceanBuoy, useShortTermForecast, useTidalCurrent, useTidalObservation, useTideForecast, useWaveObservation, useWeatherAlert } from '@/hooks/use-public-data';
import { adaptSafetyPublicData, type PublicDataSnapshot } from '@/lib/public-data/safety-report-adapter';
import { historicalQueryEnabled, reportQueryEnabled } from '@/lib/report-query-state';
import type { PublicDataService } from '@/types/public-data';
import { selectDefaultReportTarget } from '@/lib/report-target-selection';
import { useReportSelectionStore } from '@/stores/report-selection-store';

const periods = [{ value: 'daily', label: '일간' }, { value: 'weekly', label: '주간' }, { value: 'monthly', label: '월간' }] as const;
const queryOptions = { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } as const;
const demoDefaultHaenyeoCode = process.env.EXPO_PUBLIC_DEMO_DEFAULT_HAENYEO_CODE;

export default function ReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const subjects = useMonitoringSubjects();
  const selectedId = useReportSelectionStore((state) => state.selectedId);
  const manuallySelected = useReportSelectionStore((state) => state.manuallySelected);
  const selectAutomatically = useReportSelectionStore((state) => state.selectAutomatically);
  const selectManually = useReportSelectionStore((state) => state.selectManually);
  const clearSelection = useReportSelectionStore((state) => state.clear);
  useEffect(() => {
    const items = subjects.data ?? [];
    if (!items.length) { if (selectedId) clearSelection(); return; }
    if (selectedId && items.some((item) => item.haenyeo.id === selectedId)) return;
    if (subjects.completeness.isPending) return;
    if (manuallySelected) clearSelection();
    const target = selectDefaultReportTarget(
      { subjects: items, alerts: subjects.completeness.alerts, sessions: subjects.completeness.sessions },
      new Date(),
      demoDefaultHaenyeoCode,
    );
    if (target) selectAutomatically(target.haenyeo.id);
  }, [clearSelection, manuallySelected, selectAutomatically, selectedId, subjects.completeness.alerts, subjects.completeness.isPending, subjects.completeness.sessions, subjects.data]);
  const selected = useMemo(() => subjects.data?.find((item) => item.haenyeo.id === selectedId), [subjects.data, selectedId]);
  const deviceId = selected?.device?.id;
  const targetEnabled = reportQueryEnabled(selectedId, deviceId);

  const weather = useWeatherAlert(); const forecast = useShortTermForecast(); const wave = useWaveObservation(); const current = useTidalCurrent();
  const observation = useTidalObservation(); const tides = useTideForecast(); const buoy = useOceanBuoy(); const marine = useMarineForecast();
  const publicQueries: Record<PublicDataService, QueryState> = { 'weather-alert': weather, 'short-term-forecast': forecast, 'wave-observation': wave, 'tidal-current': current, 'tidal-observation': observation, 'tide-forecast': tides, 'ocean-buoy': buoy, 'marine-forecast': marine };
  const publicSnapshot: PublicDataSnapshot = { 'weather-alert': weather.data, 'short-term-forecast': forecast.data, 'wave-observation': wave.data, 'tidal-current': current.data, 'tidal-observation': observation.data, 'tide-forecast': tides.data, 'ocean-buoy': buoy.data, 'marine-forecast': marine.data };
  const environment = adaptSafetyPublicData(publicSnapshot);

  const risk = useQuery({ queryKey: ['safety-report', 'risk', selectedId, deviceId], queryFn: () => safetyReportService.getCurrentRisk(selectedId!, deviceId!), enabled: targetEnabled, ...queryOptions });
  const location = useQuery({ queryKey: ['safety-report', 'location', selectedId, deviceId], queryFn: () => safetyReportService.getCurrentLocation(selectedId!, deviceId!), enabled: targetEnabled, ...queryOptions });
  const device = useQuery({ queryKey: ['safety-report', 'device', selectedId, deviceId], queryFn: () => safetyReportService.getDevice(deviceId!), enabled: targetEnabled, ...queryOptions });
  const alerts = useQuery({ queryKey: ['safety-report', 'alerts', selectedId, deviceId], queryFn: () => safetyReportService.getRecentAlerts(selectedId!, deviceId!), enabled: targetEnabled, ...queryOptions });
  const activity = useQuery({ queryKey: ['safety-report', 'activity', selectedId, deviceId, 'daily'], queryFn: () => safetyReportService.getDailyActivity(selectedId!, deviceId!), enabled: targetEnabled, ...queryOptions });
  const historical = useQuery({ queryKey: ['safety-report', 'historical', selectedId, deviceId, period], queryFn: () => safetyReportService.getHistorical(period as Exclude<ReportPeriod, 'daily'>, selectedId!, deviceId!), enabled: historicalQueryEnabled(period, selectedId, deviceId), ...queryOptions });

  const snapshot = useMemo(() => safetyReportService.composeSnapshot({
    currentRisk: risk.data, currentLocation: location.data, device: device.data,
    alerts: alerts.data ?? [], locations: activity.data?.locations ?? [], sessions: activity.data?.sessions ?? [], risks: [],
  }, environment.riskInput), [risk.data, location.data, device.data, alerts.data, activity.data, environment.riskInput]);
  const selectNext = () => { const items = subjects.data ?? []; const index = items.findIndex((item) => item.haenyeo.id === selectedId); if (items.length) selectManually(items[(index + 1) % items.length]!.haenyeo.id); };

  return <Screen><PageTitle>AI 리포트</PageTitle>
    {subjects.isLoading ? <InitialSkeleton /> : subjects.isError ? <ErrorState message="분석 대상을 불러오지 못했습니다." /> : !subjects.data?.length ? <EmptyState title="분석할 대상을 선택해주세요." description="접근 가능한 분석 대상이 없습니다." /> : <>
      <Text style={styles.selectorLabel}>분석 대상</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="분석 대상 변경" onPress={selectNext} style={styles.selector}><Text style={styles.selectorText}>{selected?.haenyeo.user_code} · {selected?.haenyeo.display_name}</Text><ChevronDown size={15} color={colors.muted} /></Pressable>
      <SegmentedControl options={periods} value={period} onChange={setPeriod} blue />
      {!selected ? <InitialSkeleton /> : subjects.auxiliary.devices.isPending ? <CardSkeleton title="현재 안전상태" /> : !deviceId ? <EmptyState title="정보를 불러오지 못했습니다." description="분석 대상에게 할당된 장치가 없습니다." /> : <ReportContent report={snapshot} period={period} historicalData={historical.data} environment={environment.fields} publicQueries={publicQueries} states={{ risk, location, device, alerts, activity, historical }} />}
    </>}
  </Screen>;
}

type QueryState = { isPending: boolean; isError: boolean; refetch: () => unknown };
function ReportContent({ report, period, historicalData, environment, publicQueries, states }: { report: SafetyReport; period: ReportPeriod; historicalData?: HistoricalSafetySummary; environment: ReturnType<typeof adaptSafetyPublicData>['fields']; publicQueries: Record<PublicDataService, QueryState>; states: Record<'risk' | 'location' | 'device' | 'alerts' | 'activity' | 'historical', QueryState> }) {
  return <>
    <ReportCard title="위험도 종합 분석">{states.risk.isPending ? <SkeletonLines /> : states.risk.isError ? <SectionError retry={states.risk.refetch} /> : <><View style={styles.risk}><RiskDonut score={report.current.score} levelLabel={report.current.levelLabel} /><View style={styles.riskCopy}><Text style={styles.level}>현재 위험도 · {report.current.levelLabel}</Text><Text style={styles.score}>{report.current.score ?? '—'}점 / 100점</Text><Text style={styles.updated}>{report.current.calculatedAt ? new Date(report.current.calculatedAt).toLocaleString('ko-KR') : '최신 위험점수 없음'}</Text></View></View><RiskLegend distribution={period === 'daily' ? undefined : historicalData?.hasData ? historicalData.risk : undefined} currentLevel={period === 'daily' ? report.current.level : null} /><Text style={styles.factorCount}>감지 위험요인 {report.current.factors.length}개</Text>{report.current.factors.map((factor) => <View key={factor.code} style={styles.row}><Text style={styles.rowLabel}>{factor.description}</Text><Text style={styles.factorScore}>+{factor.score}점</Text></View>)}</>}</ReportCard>
    <ReportCard title="주요 활동 요약">{states.location.isPending || states.device.isPending || states.activity.isPending ? <SkeletonGrid /> : states.location.isError || states.device.isError || states.activity.isError ? <SectionError retry={() => { states.location.refetch(); states.device.refetch(); states.activity.refetch(); }} /> : <View style={styles.grid}>{[['현재 활동', report.currentActivity.activityStatus], ['배터리', report.currentActivity.battery], ['마지막 통신', report.currentActivity.lastCommunication], ['오늘 알림', report.currentActivity.todayAlerts], ['장치 연결', report.currentActivity.connectionStatus], ['오늘 이동거리', report.currentActivity.todayDistance]].map(([label, value]) => <Activity key={label} label={label} value={value} />)}</View>}</ReportCard>
    <ReportCard title="주요 해양환경"><View>{environment.map((field) => { const sourceQueries = field.sources.map((source) => publicQueries[source]); const pending = sourceQueries.some((query) => query.isPending); const failed = sourceQueries.every((query) => query.isError); return <View key={field.key} style={styles.row}><Text style={styles.rowLabel}>{field.label}</Text>{pending ? <View style={styles.rowSkeleton} /> : <Text style={[styles.rowValue, (field.status === 'error' || failed) && styles.error]} numberOfLines={2}>{failed ? '정보를 불러오지 못했습니다.' : field.value}</Text>}</View>; })}</View></ReportCard>
    <ReportCard title="최근 위험 이벤트">{states.alerts.isPending ? <SkeletonLines /> : states.alerts.isError ? <SectionError retry={states.alerts.refetch} /> : report.recentAlerts.length ? report.recentAlerts.map((alert) => <View key={alert.id} style={styles.alert}><View style={{ flex: 1 }}><Text style={styles.alertTitle}>{alert.title}</Text><Text style={styles.alertMessage}>{alert.message}</Text><Text style={styles.updated}>{new Date(alert.occurredAt).toLocaleString('ko-KR')}</Text></View><Text style={styles.status}>{alert.status}</Text></View>) : <Text style={styles.empty}>최근 위험 이벤트가 없습니다.</Text>}</ReportCard>
    {period !== 'daily' && <ReportCard title={`${period === 'weekly' ? '최근 7일' : '최근 30일'} 분석`}>{states.historical.isPending ? <><Text style={styles.loadingLabel}>기간 데이터를 불러오는 중...</Text><SkeletonGrid /></> : states.historical.isError ? <SectionError retry={states.historical.refetch} /> : <HistoricalSection data={historicalData} />}</ReportCard>}
    <ReportCard title="AI 분석 코멘트">{states.risk.isPending ? <SkeletonLines /> : <View style={styles.comment}><Text style={styles.commentTitle}>{report.comment.headline}</Text><View style={styles.commentDetails}>{report.comment.details.map((detail, index) => <Text key={`${index}-${detail}`} style={styles.commentText}>{detail}</Text>)}</View></View>}</ReportCard>
    <ReportCard title="맞춤형 안전 가이드">{report.guides.length ? report.guides.map((guide, index) => <View key={guide.id} style={styles.guide}><Text style={styles.num}>{index + 1}</Text><View style={{ flex: 1 }}><Text style={styles.guideText}>{guide.text}</Text><Text style={styles.updated}>{guide.reference}</Text></View></View>) : <Text style={styles.empty}>현재 위험요인에 따른 추가 안전 가이드가 없습니다.</Text>}</ReportCard>
  </>;
}

const legendItems = [{ key: 'safe', label: '안전' }, { key: 'caution', label: '주의' }, { key: 'warning', label: '경고' }, { key: 'danger', label: '위험' }] as const;
function RiskLegend({ distribution, currentLevel }: { distribution?: HistoricalSafetySummary['risk']; currentLevel: SafetyReport['current']['level'] }) {
  return <View style={styles.legend}>{legendItems.map((item) => <View key={item.key} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: riskLevelColors[item.key] }]} /><Text style={[styles.legendText, currentLevel === item.key && styles.legendCurrent]}>{item.label}{distribution ? ` ${distribution[item.key]}%` : currentLevel === item.key ? ' · 현재' : ''}</Text></View>)}</View>;
}

function HistoricalSection({ data }: { data?: HistoricalSafetySummary }) {
  if (!data?.hasData) return <EmptyState title="기간 내 집계 데이터가 없습니다." description="위험점수, 위치, 알림 또는 완료된 작업 기록이 쌓이면 표시됩니다." />;
  const values = [['최고 위험도', data.activity.highestRisk], ['평균 위험도', data.activity.averageRisk], ['알림 건수', data.activity.alertCount], ['이동거리', data.activity.travelDistance], ['작업 세션', data.activity.sessionCount]];
  return <><View style={styles.grid}>{values.map(([label, value]) => <View key={label} style={styles.activity}><Gauge size={15} color={colors.primary} /><View><Text style={styles.activityLabel}>{label}</Text><Text style={styles.activityValue}>{value}</Text></View></View>)}</View><Text style={styles.loadingLabel}>위험점수 추이 · {data.trend.map((item) => item.score).join(' → ') || '데이터 없음'}</Text></>;
}
function Activity({ label, value }: { label?: string; value?: string }) { return <View style={styles.activity}><Navigation size={15} color={colors.primary} /><View><Text style={styles.activityLabel}>{label ?? ''}</Text><Text style={styles.activityValue}>{value ?? '데이터 없음'}</Text></View></View>; }
function ReportCard({ title, children }: React.PropsWithChildren<{ title: string }>) { return <Card style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</Card>; }
function InitialSkeleton() { return <View><CardSkeleton title="분석 대상을 불러오는 중" /><CardSkeleton title="현재 안전상태" /></View>; }
function CardSkeleton({ title }: { title: string }) { return <ReportCard title={title}><SkeletonLines /></ReportCard>; }
function SkeletonLines() { return <View style={styles.skeletonWrap}><View style={styles.skeletonWide} /><View style={styles.skeletonShort} /><View style={styles.skeletonWide} /></View>; }
function SkeletonGrid() { return <View style={styles.grid}>{[0, 1, 2, 3].map((item) => <View key={item} style={[styles.activity, styles.skeletonBlock]} />)}</View>; }
function SectionError({ retry }: { retry: () => unknown }) { return <View style={styles.sectionState}><Text style={styles.empty}>정보를 불러오지 못했습니다.</Text><Pressable onPress={() => retry()}><Text style={styles.retry}>다시 시도</Text></Pressable></View>; }

const styles = StyleSheet.create({ selectorLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, marginTop: 4, marginBottom: 5 }, selector: { height: 42, borderWidth: 1, borderColor: colors.line, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectorText: { fontSize: 11, fontWeight: '800', color: colors.text }, card: { padding: 14, marginTop: 12 }, cardTitle: { fontSize: 12, fontWeight: '900', color: colors.text, marginBottom: 11 }, risk: { flexDirection: 'row', alignItems: 'center', gap: 16 }, riskCopy: { flex: 1 }, level: { fontSize: 13, fontWeight: '900', color: colors.text }, score: { fontSize: 17, fontWeight: '900', color: colors.primary, marginTop: 4 }, updated: { fontSize: 8, color: colors.muted, marginTop: 3 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 11 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { fontSize: 8, color: colors.muted }, legendCurrent: { color: colors.text, fontWeight: '800' }, factorCount: { fontSize: 10, fontWeight: '800', marginTop: 12, marginBottom: 4 }, row: { minHeight: 34, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, rowLabel: { fontSize: 10, color: colors.text, flex: 1 }, rowValue: { fontSize: 9, fontWeight: '700', color: colors.text, textAlign: 'right', maxWidth: '60%' }, rowSkeleton: { width: 72, height: 10, borderRadius: 5, backgroundColor: '#E9ECF2' }, factorScore: { fontSize: 10, fontWeight: '900', color: '#E45A4F' }, error: { color: '#D94B43' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, activity: { width: '48.5%', minHeight: 57, borderWidth: 1, borderColor: '#EEF0F4', borderRadius: 12, backgroundColor: '#FAFAFC', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, activityLabel: { fontSize: 9, color: colors.muted }, activityValue: { fontSize: 11, fontWeight: '800', color: colors.text }, alert: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 8 }, alertTitle: { fontSize: 10, fontWeight: '800' }, alertMessage: { fontSize: 9, color: colors.muted, marginTop: 2 }, status: { fontSize: 8, color: colors.primary, fontWeight: '800' }, comment: { backgroundColor: '#F8F9FC', borderRadius: 12, padding: 11 }, commentTitle: { fontSize: 11, fontWeight: '800', lineHeight: 17, color: colors.text }, commentDetails: { gap: 2, marginTop: 6 }, commentText: { fontSize: 10, lineHeight: 16, color: colors.muted, flexShrink: 1 }, guide: { borderRadius: 11, backgroundColor: '#F8F9FC', padding: 9, flexDirection: 'row', gap: 8, marginBottom: 7 }, num: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.primarySoft, textAlign: 'center', color: colors.primary, fontWeight: '900' }, guideText: { fontSize: 10, lineHeight: 15, color: colors.text }, empty: { fontSize: 10, color: colors.muted }, sectionState: { alignItems: 'center', gap: 7, paddingVertical: 12 }, retry: { fontSize: 10, fontWeight: '800', color: colors.primary }, loadingLabel: { fontSize: 9, color: colors.muted, marginBottom: 10 }, skeletonWrap: { gap: 9 }, skeletonWide: { height: 12, borderRadius: 6, backgroundColor: '#E9ECF2', width: '100%' }, skeletonShort: { height: 12, borderRadius: 6, backgroundColor: '#E9ECF2', width: '58%' }, skeletonBlock: { backgroundColor: '#E9ECF2' } });
