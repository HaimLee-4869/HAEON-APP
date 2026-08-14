import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { PageTitle, Screen } from '@/components/screen';
import { SearchBar } from '@/components/ui';
import { colors } from '@/constants/theme';
const regions = ['모슬포', '서귀포', '성산포', '제주', '이어도', '마라도'] as const;
export default function TideScreen() { const [query, setQuery] = useState(''); const [selected, setSelected] = useState<string | null>(null); const visible = useMemo(() => regions.filter((region) => region.includes(query.trim())), [query]); return <Screen><PageTitle>물때 검색</PageTitle><SearchBar placeholder="원하시는 물때 지역을 검색해주세요." value={query} onChangeText={setQuery} /><View style={styles.list}>{visible.map((region, index) => <Pressable key={region} onPress={() => setSelected(region)} accessibilityHint="물때 상세 시트 연결 예정" style={[styles.row, index === visible.length - 1 && styles.last]}><View><Text style={styles.name}>{region}</Text>{selected === region && <Text style={styles.ready}>상세 물때 연결 준비됨</Text>}</View><ChevronRight size={16} color="#A0A6B2" /></Pressable>)}</View></Screen>; }
const styles = StyleSheet.create({ list: { marginTop: 14, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }, row: { minHeight: 55, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EEF0F4' }, last: { borderBottomWidth: 0 }, name: { fontSize: 13, fontWeight: '700', color: colors.text }, ready: { fontSize: 9, marginTop: 2, color: colors.primary } });
