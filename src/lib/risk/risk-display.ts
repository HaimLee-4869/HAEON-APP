import { colors } from '../../constants/theme';
import type { RiskLevel } from '../../types/database';

export const clampRiskScore = (score: number | null) => score == null ? 0 : Math.min(100, Math.max(0, score));
export const riskLevelFromScore = (score: number): RiskLevel => score >= 70 ? 'danger' : score >= 45 ? 'warning' : score >= 20 ? 'caution' : 'safe';
export const riskLevelColors: Record<RiskLevel, string> = { safe: colors.safe, caution: colors.warning, warning: '#F97345', danger: colors.danger };
