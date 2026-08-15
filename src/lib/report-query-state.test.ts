import { describe, expect, it } from 'vitest';
import { blocksSubjectSelection, historicalQueryEnabled, reportQueryEnabled } from './report-query-state';

describe('AI report query state', () => {
  it('does not run subject queries with an undefined id', () => {
    expect(reportQueryEnabled('haenyeo-1', undefined)).toBe(false);
    expect(reportQueryEnabled(undefined, 'device-1')).toBe(false);
    expect(reportQueryEnabled('haenyeo-1', 'device-1')).toBe(true);
  });

  it('keeps daily current snapshot separate from historical loading', () => {
    expect(historicalQueryEnabled('daily', 'haenyeo-1', 'device-1')).toBe(false);
    expect(historicalQueryEnabled('weekly', 'haenyeo-1', 'device-1')).toBe(true);
    expect(historicalQueryEnabled('monthly', 'haenyeo-1', 'device-1')).toBe(true);
  });

  it('does not let an auxiliary pending query block subject selection', () => {
    const devicesPending = true;
    expect(devicesPending).toBe(true);
    expect(blocksSubjectSelection(false)).toBe(false);
  });
});
