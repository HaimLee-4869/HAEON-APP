import { describe, expect, it } from 'vitest';
import { sampleSafetyReports } from './report-data';
describe('sample safety reports', () => { it('keeps risk percentages normalized', () => { for (const report of Object.values(sampleSafetyReports)) expect(report.risk.safe + report.risk.caution + report.risk.warning + report.risk.danger).toBe(100); }); });
