import { describe, expect, it } from 'vitest';
import { validatePublicEnv } from './env';

describe('public environment validation', () => {
  it('reports presence without exposing environment values', () => {
    const status = validatePublicEnv();
    expect(status.requiredMissing.every((name) => name.startsWith('EXPO_PUBLIC_'))).toBe(true);
    expect(status.kakaoMissing.every((name) => name.startsWith('EXPO_PUBLIC_KAKAO_'))).toBe(true);
    expect(status).not.toHaveProperty('values');
  });
});
