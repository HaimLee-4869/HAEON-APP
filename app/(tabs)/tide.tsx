import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { PageTitle, Screen } from '@/components/screen';
import { SearchBar } from '@/components/ui';
import { colors } from '@/constants/theme';
import { tideRegions, type TideRegionId } from '@/data/tide-regions';
export default function TideScreen() {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => Object.entries(tideRegions).filter(([, region]) => region.name.includes(query.trim())) as [TideRegionId, (typeof tideRegions)[TideRegionId]][], [query]);
  return <Screen><PageTitle>물때 검색</PageTitle><SearchBar placeholder="원하는 물때 지역을 검색해 주세요" value={query} onChangeText={setQuery} /><View style={styles.list}>{visible.map(([id, region], index) => <Pressable key={id} onPress={() => router.push({ pathname: '/tide/[region]', params: { region: id } })} style={[styles.row, index === visible.length - 1 && styles.last]}><View><Text style={styles.name}>{region.name}</Text><Text style={styles.support}>{region.station || region.oceanStation ? '관측 데이터 일부 지원' : '예보만 지원'}</Text></View><ChevronRight size={16} color="#A0A6B2" /></Pressable>)}</View></Screen>;
}
const styles = StyleSheet.create({ list: { marginTop: 14, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }, row: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EEF0F4' }, last: { borderBottomWidth: 0 }, name: { fontSize: 13, fontWeight: '800', color: colors.text }, support: { fontSize: 9, marginTop: 3, color: colors.muted } });
