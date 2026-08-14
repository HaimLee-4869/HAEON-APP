import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { colors } from '@/constants/theme';
export function Screen({ children, scroll = true, contentContainerStyle }: PropsWithChildren<{ scroll?: boolean; contentContainerStyle?: ScrollViewProps['contentContainerStyle'] }>) { if (!scroll) return <View style={styles.base}>{children}</View>; return <ScrollView style={styles.base} contentContainerStyle={[styles.content, contentContainerStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>; }
export function PageTitle({ children }: PropsWithChildren) { return <Text style={styles.title}>{children}</Text>; }
const styles = StyleSheet.create({ base: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }, title: { fontSize: 20, lineHeight: 26, fontWeight: '900', letterSpacing: -0.65, color: colors.text, marginBottom: 14 } });
