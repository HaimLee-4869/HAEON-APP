import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, ErrorState } from '@/components/ui';
import { Screen } from '@/components/screen';
import { colors } from '@/constants/theme';
import { isTideRegion, regionParams, tideRegions } from '@/data/tide-regions';
import { useMarineForecast, useOceanBuoy, useShortTermForecast, useTidalObservation, useTideForecast, useWaveObservation, useWeatherAlert } from '@/hooks/use-public-data';
import { composeTideDetail } from '@/lib/public-data/compose-tide-detail';

const day = (date: Date) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(date);
const metric = (value: number | null, unit: string, pending: boolean, error: boolean) => pending ? '불러오는 중…' : value !== null ? `${value} ${unit}` : error ? '불러오지 못함' : '데이터 없음';
const time = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '시간 없음';

export default function TideDetailScreen() {
  const raw = useLocalSearchParams<{ region?: string }>().region ?? '';
  const valid = isTideRegion(raw); const region = valid ? tideRegions[raw] : null;
  const params = valid ? regionParams(raw) : { tide: undefined, ocean: undefined, forecast: undefined };
  const [date, setDate] = useState(() => new Date());
  const alert = useWeatherAlert(); const short = useShortTermForecast(params.forecast, Boolean(params.forecast));
  const wave = useWaveObservation(params.ocean, Boolean(params.ocean)); const tidal = useTidalObservation(params.tide, Boolean(params.tide));
  const tides = useTideForecast(params.tide, Boolean(params.tide)); const buoy = useOceanBuoy(params.ocean, Boolean(params.ocean)); const marine = useMarineForecast();
  const detail = useMemo(() => composeTideDetail({ 'weather-alert': alert.data, 'short-term-forecast': short.data, 'wave-observation': wave.data, 'tidal-observation': tidal.data, 'tide-forecast': tides.data, 'ocean-buoy': buoy.data, 'marine-forecast': marine.data }), [alert.data, buoy.data, marine.data, short.data, tidal.data, tides.data, wave.data]);
  if (!region) return <Screen><ErrorState message="지원하지 않는 지역 경로입니다." action="돌아가기" onRetry={() => router.back()} /></Screen>;
  const isToday = day(date) === day(new Date());
  const tideMissing = !params.tide;
  return <Screen contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><ChevronLeft size={24} color={colors.text} /></Pressable><View><Text style={styles.title}>{region.name} 물때</Text><Text style={styles.subtitle}>HAEON · 공공데이터 API</Text></View></View>
    <View style={styles.dateRow}><Pressable onPress={() => setDate((d) => new Date(d.getTime() - 86400000))}><ChevronLeft size={20} /></Pressable><Text style={styles.date}>{day(date)}</Text><Pressable onPress={() => setDate((d) => new Date(d.getTime() + 86400000))}><ChevronRight size={20} /></Pressable></View>
    {!isToday ? <Card style={styles.card}><Text style={styles.empty}>선택 날짜 데이터 없음</Text></Card> : <>
      <Card style={styles.card}><Text style={styles.section}>만조</Text>{tides.isPending && !tideMissing ? <Text style={styles.empty}>불러오는 중…</Text> : detail.high.length ? detail.high.map((e, i) => <Text key={`${e.at}-${i}`} style={styles.event}>{time(e.at)} · {metric(e.levelCm, 'cm', false, false)}</Text>) : <Text style={styles.empty}>{tides.isError ? '불러오지 못함' : '데이터 없음'}</Text>}<Text style={[styles.section, styles.low]}>간조</Text>{tides.isPending && !tideMissing ? <Text style={styles.empty}>불러오는 중…</Text> : detail.low.length ? detail.low.map((e, i) => <Text key={`${e.at}-${i}`} style={styles.event}>{time(e.at)} · {metric(e.levelCm, 'cm', false, false)}</Text>) : <Text style={styles.empty}>{tides.isError ? '불러오지 못함' : '데이터 없음'}</Text>}</Card>
      <Card style={styles.card}><Text style={styles.section}>현재 관측</Text><Grid rows={[
        ['현재 조위', metric(detail.tideLevelCm, 'cm', tidal.isPending && Boolean(params.tide), tidal.isError)],
        ['수온', metric(detail.waterTemperatureC, '℃', (tidal.isPending && Boolean(params.tide)) || (buoy.isPending && Boolean(params.ocean)), tidal.isError && buoy.isError)],
        ['파고', metric(detail.waveHeightM, 'm', (wave.isPending || buoy.isPending) && Boolean(params.ocean), wave.isError && buoy.isError)],
        ['파주기', metric(detail.wavePeriodSeconds, 's', (wave.isPending || buoy.isPending) && Boolean(params.ocean), wave.isError && buoy.isError)],
        ['풍속', metric(detail.windSpeedMps, 'm/s', (buoy.isPending && Boolean(params.ocean)) || (short.isPending && Boolean(params.forecast)), buoy.isError && short.isError)],
        ['기온', metric(detail.airTemperatureC, '℃', (buoy.isPending && Boolean(params.ocean)) || (short.isPending && Boolean(params.forecast)), buoy.isError && short.isError)],
      ]} /></Card>
      <Card style={styles.card}><Text style={styles.section}>날씨 / 작업 참고</Text><SourceLine value={detail.weather} pending={short.isPending && Boolean(params.forecast)} error={short.isError} empty="날씨 데이터 없음" /><SourceLine value={detail.weatherAlert} pending={alert.isPending} error={alert.isError} empty="발효 중인 기상특보 데이터 없음" /><SourceLine value={detail.marineForecast} pending={marine.isPending} error={marine.isError} empty="해상예보 데이터 없음" /><Text style={styles.work}>{detail.weatherAlert ? '기상특보를 확인하고 작업 여부를 판단하세요.' : '표시된 공공 관측값과 현장 상태를 함께 확인하세요.'}</Text></Card>
      <Text style={styles.source}>지역 코드: 조석 {region.station ?? '미지원'} · 해양 {region.oceanStation ?? '미지원'} · 단기예보 {region.forecastArea ?? '미지원'}</Text>
    </>}
  </Screen>;
}
function SourceLine({ value, pending, error, empty }: { value: string | null; pending: boolean; error: boolean; empty: string }) { return <Text style={styles.body}>{pending ? '불러오는 중…' : value ?? (error ? '불러오지 못함' : empty)}</Text>; }
function Grid({ rows }: { rows: string[][] }) { return <View style={styles.grid}>{rows.map(([label, value]) => <View key={label} style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>)}</View>; }
const styles = StyleSheet.create({ content: { paddingBottom: 40 }, header: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 15 }, title: { fontSize: 20, fontWeight: '900', color: colors.text }, subtitle: { fontSize: 9, color: colors.muted }, dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12 }, date: { fontSize: 13, fontWeight: '800' }, card: { marginTop: 12, padding: 14 }, section: { fontSize: 13, fontWeight: '900', color: colors.text, marginBottom: 8 }, low: { marginTop: 14 }, event: { fontSize: 12, color: colors.text, marginTop: 4 }, empty: { fontSize: 11, color: colors.muted }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, metric: { width: '50%', paddingVertical: 8 }, metricLabel: { fontSize: 9, color: colors.muted }, metricValue: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 3 }, body: { fontSize: 11, color: colors.text, marginTop: 6 }, work: { fontSize: 10, fontWeight: '800', color: colors.primary, backgroundColor: colors.primarySoft, padding: 10, borderRadius: 9, marginTop: 12 }, source: { fontSize: 9, color: colors.muted, marginTop: 12, lineHeight: 15 } });
