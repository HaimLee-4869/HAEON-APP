import { describe, expect, it } from 'vitest';
import { clampRiskScore, riskLevelColors, riskLevelFromScore } from '../lib/risk/risk-display';

describe('위험점수 progress ring', () => {
  it.each([[0,'safe'],[18,'safe'],[30,'caution'],[55,'warning'],[85,'danger'],[100,'danger']] as const)('%i점의 단계와 색상을 결정한다', (score, level) => {
    expect(clampRiskScore(score)).toBe(score);
    expect(riskLevelFromScore(score)).toBe(level);
    expect(riskLevelColors[level]).toMatch(/^#/);
  });
  it('ring 진행률을 0~100 범위로 제한한다', () => {
    expect(clampRiskScore(-1)).toBe(0);
    expect(clampRiskScore(101)).toBe(100);
  });
});
