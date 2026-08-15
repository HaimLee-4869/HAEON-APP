import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { clampRiskScore, riskLevelColors, riskLevelFromScore } from '@/lib/risk/risk-display';
export { riskLevelColors } from '@/lib/risk/risk-display';

const SIZE = 92;
const CENTER = 46;
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { score: number | null; levelLabel: string };

export function RiskDonut({ score, levelLabel }: Props) {
  const target = clampRiskScore(score);
  const progress = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const level = riskLevelFromScore(target);
  const dashOffset = useMemo(() => progress.interpolate({ inputRange: [0, 100], outputRange: [CIRCUMFERENCE, 0], extrapolate: 'clamp' }), [progress]);

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    setDisplayScore(0);
    const listener = progress.addListener(({ value }) => setDisplayScore(Math.round(value)));
    const animation = Animated.timing(progress, { toValue: target, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => { animation.stop(); progress.removeListener(listener); };
  }, [progress, target]);

  return <View style={styles.wrap} accessibilityLabel={`위험점수 ${target}점, ${levelLabel}`}>
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={styles.svg}>
      <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="transparent" stroke="#E8EBF1" strokeWidth={8} />
      <AnimatedCircle cx={CENTER} cy={CENTER} r={RADIUS} fill="transparent" stroke={riskLevelColors[level]} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} strokeDashoffset={dashOffset} />
    </Svg>
    <View style={styles.label} pointerEvents="none"><Text style={styles.score}>{score == null ? '—' : displayScore}</Text><Text style={styles.level}>{levelLabel}</Text></View>
  </View>;
}

const styles = StyleSheet.create({ wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, svg: { transform: [{ rotate: '-90deg' }] }, label: { position: 'absolute', alignItems: 'center', justifyContent: 'center' }, score: { fontSize: 22, fontWeight: '900', color: colors.text, lineHeight: 27 }, level: { fontSize: 10, fontWeight: '700', color: colors.muted, marginTop: 1 } });
