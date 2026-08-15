import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ImagePlus, LocateFixed, MapPin, Trash2 } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState, SegmentedControl, StatusBadge } from '@/components/ui';
import { colors } from '@/constants/theme';
import { emergencyReportRepository } from '@/lib/repositories/emergency-report-repository';
import type { EmergencyMedia, EmergencyReport } from '@/types/domain';
import { formatCoordinates } from '@/utils/location';
import { getSosCountdown, isSosHoldComplete, SOS_HOLD_MS } from '@/utils/sos-long-press';

type SosTab = 'write' | 'history';
type SosState = 'idle' | 'holding' | 'submitting' | 'success' | 'error';
const initialAddress = '현재 위치를 확인하려면 눌러주세요';

export default function SosScreen() {
  const [tab, setTab] = useState<SosTab>('write');
  const [description, setDescription] = useState(''); const [consent, setConsent] = useState(true);
  const [address, setAddress] = useState(initialAddress); const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [media, setMedia] = useState<EmergencyMedia[]>([]); const [locating, setLocating] = useState(false);
  const [sosState, setSosState] = useState<SosState>('idle'); const [elapsed, setElapsed] = useState(0); const [sosError, setSosError] = useState('');
  const [history, setHistory] = useState<EmergencyReport[]>([]); const [historyState, setHistoryState] = useState<'idle' | 'loading' | 'error'>('idle'); const [historyError, setHistoryError] = useState('');
  const startedAt = useRef(0); const tick = useRef<ReturnType<typeof setInterval> | null>(null); const completed = useRef(false);

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('위치 권한이 필요합니다. 설정에서 권한을 허용해 주세요.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude }; setCoords(next);
      setAddress(formatCoordinates(next.latitude, next.longitude));
      return next;
    } catch (error) { setAddress(coords ? formatCoordinates(coords.latitude, coords.longitude) : '현재 위치를 확인하려면 눌러주세요'); throw error; }
    finally { setLocating(false); }
  }, [coords]);

  const createReport = useCallback(async (type: EmergencyReport['type'], position = coords) => {
    const report: EmergencyReport = { type, description: type === 'emergency' ? '' : description.trim(), latitude: position?.latitude ?? null, longitude: position?.longitude ?? null, address: position ? (coords ? address : formatCoordinates(position.latitude, position.longitude)) : null, media: type === 'emergency' ? [] : media, sharingConsent: type === 'emergency' || consent };
    return emergencyReportRepository.create(report);
  }, [address, consent, coords, description, media]);

  const finishSos = useCallback(async () => {
    if (completed.current) return; completed.current = true; setSosState('submitting'); setElapsed(SOS_HOLD_MS);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    try { const position = coords ?? await locate(); await createReport('emergency', position); setSosState('success'); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); }
    catch (error) { setSosError(error instanceof Error ? error.message : '신고를 접수하지 못했습니다.'); setSosState('error'); completed.current = false; }
  }, [coords, createReport, locate]);

  const stopTimer = () => { if (tick.current) clearInterval(tick.current); tick.current = null; };
  const beginHold = () => { if (sosState === 'submitting' || sosState === 'success') return; stopTimer(); completed.current = false; startedAt.current = Date.now(); setElapsed(0); setSosState('holding'); setSosError(''); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined); tick.current = setInterval(() => { const value = Date.now() - startedAt.current; setElapsed(Math.min(value, SOS_HOLD_MS)); if (isSosHoldComplete(value)) { stopTimer(); void finishSos(); } }, 50); };
  const cancelHold = () => { if (sosState !== 'holding') return; stopTimer(); setElapsed(0); setSosState('idle'); completed.current = false; };
  useEffect(() => () => stopTimer(), []);

  const pickMedia = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 4, quality: 0.8 }); if (!result.canceled) setMedia(result.assets.map((asset) => ({ uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image', mimeType: asset.mimeType ?? null, size: asset.fileSize ?? null, fileName: asset.fileName ?? null }))); };
  const submitDetailed = async () => { try { await createReport('detailed'); Alert.alert('신고 접수 완료', '상세 신고가 안전하게 저장되었습니다.'); setDescription(''); setMedia([]); } catch (error) { Alert.alert('신고를 접수하지 못했습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'); } };
  const loadHistory = useCallback(async () => { setHistoryState('loading'); try { setHistory(await emergencyReportRepository.list()); setHistoryState('idle'); } catch (error) { setHistoryError(error instanceof Error ? error.message : '내역을 불러오지 못했습니다.'); setHistoryState('error'); } }, []);
  useEffect(() => { if (tab === 'history') void loadHistory(); }, [loadHistory, tab]);

  const progress = Math.min(100, elapsed / SOS_HOLD_MS * 100); const countdown = getSosCountdown(elapsed);
  const sosTitle = sosState === 'holding' ? `${countdown}초 동안 길게 눌러주세요` : sosState === 'submitting' ? '신고를 안전하게 전송 중입니다' : sosState === 'success' ? '신고가 접수되었습니다' : sosState === 'error' ? '접수되지 않았습니다 · 다시 길게 누르세요' : '긴급 구조 요청';
  return <Screen><SegmentedControl options={[{ value: 'write', label: '신고하기' }, { value: 'history', label: '신고 내역' }]} value={tab} onChange={setTab} />
    {tab === 'history' ? <History state={historyState} reports={history} error={historyError} retry={loadHistory} /> : <>
      <Pressable accessibilityRole="button" accessibilityLabel="SOS 긴급 구조 요청, 3초간 길게 누르세요" onPressIn={beginHold} onPressOut={cancelHold} style={[styles.sos, sosState === 'success' && styles.sosSuccess, sosState === 'error' && styles.sosError]}>
        <View style={styles.circle}>{sosState === 'submitting' ? <ActivityIndicator color="#E52828" /> : <Text style={styles.sosText}>{sosState === 'success' ? '✓' : 'SOS'}</Text>}</View>
        <Text style={styles.sosTitle}>{sosTitle}</Text><Text style={styles.sosSub}>{sosState === 'idle' ? '설명 입력 없이 현재 위치로 즉시 긴급신고합니다' : sosError || '손을 떼면 즉시 취소됩니다'}</Text>
        <View style={styles.progressTrack}><View style={[styles.progress, { width: `${progress}%` }]} /></View>
      </Pressable>
      <Text style={styles.sectionTitle}>상세 신고</Text><Text style={styles.sectionDescription}>위치, 상황 설명, 사진·영상과 공유 동의를 함께 제출합니다.</Text>
      <Text style={styles.label}>위치 정보</Text><Pressable onPress={() => void locate()} style={styles.location}><View style={styles.locationBadge}><MapPin size={13} color={colors.primary} /><Text style={styles.locationBadgeText}>현재 위치</Text></View><Text numberOfLines={2} style={styles.address}>{locating ? '현재 위치 확인 중...' : address}</Text><LocateFixed size={17} color={colors.muted} /></Pressable>
      <Text style={styles.label}>상황 설명 (선택)</Text><TextInput multiline value={description} maxLength={2000} onChangeText={setDescription} placeholder="현재 상황을 입력해 주세요" placeholderTextColor="#A6ABB5" textAlignVertical="top" style={styles.textarea} />
      <Text style={styles.label}>사진/영상 첨부 (최대 4개)</Text><View style={styles.attachRow}><Pressable onPress={pickMedia} style={styles.add}><ImagePlus size={23} color={colors.muted} /><Text style={styles.addText}>추가</Text></Pressable>{media.map((asset, index) => <View key={`${asset.uri}-${index}`} style={styles.preview}><Image source={{ uri: asset.uri }} style={styles.thumbnail} /><Pressable onPress={() => setMedia((items) => items.filter((_, i) => i !== index))} style={styles.remove}><Trash2 size={13} color="white" /></Pressable><Text style={styles.mediaMeta}>{asset.type === 'video' ? '영상' : '사진'}{asset.size ? ` · ${(asset.size / 1024 / 1024).toFixed(1)}MB` : ''}</Text></View>)}</View>
      <View style={styles.consent}><Switch value={consent} onValueChange={setConsent} trackColor={{ false: '#D8DCE4', true: colors.primary }} thumbColor="white" style={styles.smallSwitch} /><Text style={styles.consentText}>위치 정보 및 사진 공유 동의</Text></View>
      <Pressable onPress={submitDetailed} style={styles.submit}><Text style={styles.submitText}>상세 신고 제출</Text></Pressable>
    </>}
  </Screen>;
}

function History({ state, reports, error, retry }: { state: 'idle' | 'loading' | 'error'; reports: EmergencyReport[]; error: string; retry: () => void }) {
  if (state === 'loading') return <LoadingState label="신고 내역을 불러오는 중..." />;
  if (state === 'error') return <ErrorState message={error} action="다시 시도" onRetry={retry} />;
  if (!reports.length) return <EmptyState title="저장된 신고 내역이 없습니다" description="신고 저장용 DB/RLS가 연결되면 최근 신고와 처리 상태가 여기에 표시됩니다." />;
  return <View style={styles.history}>{reports.map((report) => <View key={report.id} style={styles.historyCard}><View style={styles.historyTop}><Text style={styles.historyType}>{report.type === 'emergency' ? '긴급 SOS' : '상세 신고'}</Text><StatusBadge label={statusLabel(report.status)} tone={report.status === 'resolved' ? 'safe' : report.status === 'responding' ? 'warning' : 'neutral'} /></View><Text style={styles.historyAddress}>{report.address ?? (report.latitude != null && report.longitude != null ? formatCoordinates(report.latitude, report.longitude) : '위치 정보 없음')}</Text><Text style={styles.historyDate}>{report.createdAt ? new Date(report.createdAt).toLocaleString('ko-KR') : '시각 정보 없음'}</Text></View>)}</View>;
}
function statusLabel(status?: EmergencyReport['status']) { return ({ received: '접수', reviewing: '확인 중', responding: '대응 중', resolved: '완료' } as const)[status ?? 'received']; }

const styles = StyleSheet.create({ sos: { marginTop: 14, backgroundColor: '#EF2727', borderRadius: 16, padding: 20, alignItems: 'center', minHeight: 190 }, sosSuccess: { backgroundColor: '#168A55' }, sosError: { backgroundColor: '#A83232' }, circle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, sosText: { color: '#E52828', fontWeight: '900', fontSize: 20 }, sosTitle: { color: 'white', fontSize: 16, fontWeight: '900', marginBottom: 5, textAlign: 'center' }, sosSub: { color: 'white', opacity: 0.92, fontSize: 10, textAlign: 'center' }, progressTrack: { height: 7, width: '100%', backgroundColor: '#FFFFFF55', borderRadius: 4, overflow: 'hidden', marginTop: 16 }, progress: { height: '100%', backgroundColor: 'white' }, sectionTitle: { fontSize: 15, fontWeight: '900', color: colors.text, marginTop: 20 }, sectionDescription: { fontSize: 10, color: colors.muted, marginTop: 3 }, label: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 7 }, location: { minHeight: 50, backgroundColor: 'white', borderWidth: 1, borderColor: '#E7E9F0', borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }, locationBadge: { height: 28, borderRadius: 9, backgroundColor: colors.primarySoft, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, locationBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '800' }, address: { flex: 1, color: '#5D6472', fontSize: 11, fontWeight: '700' }, retry: { color: colors.primary, fontSize: 10, marginTop: 6 }, textarea: { height: 92, borderWidth: 1, borderColor: '#E4E7ED', borderRadius: 12, backgroundColor: 'white', padding: 12, fontSize: 11, color: colors.text }, attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, add: { width: 78, height: 84, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9CDD7', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', gap: 4 }, addText: { color: colors.muted, fontSize: 9 }, preview: { width: 78, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: '#222' }, thumbnail: { width: '100%', height: '100%' }, remove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center' }, mediaMeta: { position: 'absolute', bottom: 0, left: 0, right: 0, color: 'white', fontSize: 7, backgroundColor: '#0009', padding: 3 }, consent: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 12, padding: 10, borderRadius: 12, backgroundColor: '#F4F1FF' }, smallSwitch: { transform: [{ scale: 0.7 }], marginLeft: -7 }, consentText: { fontSize: 10, color: '#616876', flex: 1 }, submit: { height: 48, backgroundColor: '#ED2929', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, submitText: { color: 'white', fontSize: 13, fontWeight: '900' }, history: { gap: 10, marginTop: 14 }, historyCard: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 13 }, historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, historyType: { fontSize: 12, fontWeight: '900', color: colors.text }, historyAddress: { fontSize: 11, color: colors.text, marginTop: 9 }, historyDate: { fontSize: 9, color: colors.muted, marginTop: 5 } });
