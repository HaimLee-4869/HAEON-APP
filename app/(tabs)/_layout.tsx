import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/app-header';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { colors } from '@/constants/theme';
export default function TabsLayout() { return <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}><AppHeader /><Tabs initialRouteName="index" screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}><Tabs.Screen name="tide" /><Tabs.Screen name="sos" /><Tabs.Screen name="index" /><Tabs.Screen name="report" /><Tabs.Screen name="store" /></Tabs></SafeAreaView>; }
