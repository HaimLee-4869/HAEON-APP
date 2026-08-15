import { beforeEach, describe, expect, it } from 'vitest';
import { selectDefaultReportTarget } from './report-target-selection';
import { useReportSelectionStore } from '../stores/report-selection-store';
import type { MonitoringSubject, WorkSession } from '../types/database';

const now = new Date('2026-08-15T00:00:00Z');
function subject(id: string, data: Partial<MonitoringSubject> = {}): MonitoringSubject {
  return {
    haenyeo: { id, organization_id: 'org', user_code: `CODE-${id}`, display_name: id, user_type: 'haenyeo', status: 'active', activity_region: '', emergency_contact: null, created_at: '', updated_at: '' },
    device: null, latestLocation: null, latestRisk: null, batteryLevel: null, connectionStatus: 'unassigned', lastCommunicatedAt: null,
    ...data,
  };
}

describe('selectDefaultReportTarget', () => {
  it('selects an accessible demo default by user code', () => {
    const automatic = subject('automatic', { latestRisk: { id: 'r', haenyeo_id: 'automatic', device_id: 'd', score: 10, level: 'safe', factors: null, calculated_at: '2026-08-14T00:00:00Z', created_at: '' } });
    const demo = subject('demo');
    demo.haenyeo.user_code = 'AMA-0178';

    expect(selectDefaultReportTarget({ subjects: [automatic, demo], alerts: [], sessions: [] }, now, 'AMA-0178')).toBe(demo);
  });

  it('falls back to completeness selection when the demo default is inaccessible', () => {
    const sparse = subject('sparse');
    const automatic = subject('automatic', { latestRisk: { id: 'r', haenyeo_id: 'automatic', device_id: 'd', score: 10, level: 'safe', factors: null, calculated_at: '2026-08-14T00:00:00Z', created_at: '' } });

    expect(selectDefaultReportTarget({ subjects: [sparse, automatic], alerts: [], sessions: [] }, now, 'AMA-0178')).toBe(automatic);
  });

  it('uses completeness selection when the demo default env value is unset', () => {
    const sparse = subject('sparse');
    const automatic = subject('automatic', { latestLocation: { id: 'l', device_id: 'd', haenyeo_id: 'automatic', latitude: 0, longitude: 0, location: null, speed_kmh: null, activity_status: '', measured_at: '2026-08-14T00:00:00Z', created_at: '', sequence_number: null, signal_strength: null, emergency_button: false, raw_payload: null } });

    expect(selectDefaultReportTarget({ subjects: [sparse, automatic], alerts: [], sessions: [] }, now, undefined)).toBe(automatic);
  });

  it('selects the target with more current data even when a sparse target is first', () => {
    const sparse = subject('first');
    sparse.haenyeo.user_code = 'AMA-0112';
    const complete = subject('complete', {
      latestRisk: { id: 'r', haenyeo_id: 'complete', device_id: 'd', score: 0, level: 'safe', factors: null, calculated_at: '2026-08-14T00:00:00Z', created_at: '' },
      latestLocation: { id: 'l', device_id: 'd', haenyeo_id: 'complete', latitude: 0, longitude: 0, location: null, speed_kmh: null, activity_status: '', measured_at: '2026-08-14T00:00:00Z', created_at: '', sequence_number: null, signal_strength: null, emergency_button: false, raw_payload: null },
    });
    expect(selectDefaultReportTarget({ subjects: [sparse, complete], alerts: [], sessions: [] }, now)?.haenyeo.id).toBe('complete');
  });

  it('uses recent alert or activity and communication freshness, but never the risk score value', () => {
    const older = subject('older', { latestRisk: { id: 'r1', haenyeo_id: 'older', device_id: 'd1', score: 99, level: 'danger', factors: null, calculated_at: '2026-08-14T00:00:00Z', created_at: '' }, lastCommunicatedAt: '2026-08-10T00:00:00Z' });
    const newer = subject('newer', { latestRisk: { id: 'r2', haenyeo_id: 'newer', device_id: 'd2', score: 0, level: 'safe', factors: null, calculated_at: '2026-08-14T00:00:00Z', created_at: '' }, lastCommunicatedAt: '2026-08-14T00:00:00Z' });
    const sessions = [{ id: 's', haenyeo_id: 'newer', device_id: 'd2', started_at: '2026-08-14T00:00:00Z' }] as WorkSession[];
    expect(selectDefaultReportTarget({ subjects: [older, newer], alerts: [], sessions }, now)?.haenyeo.id).toBe('newer');
  });

  it('keeps the first target when all targets have no data', () => {
    const subjects = [subject('first'), subject('second')];
    expect(selectDefaultReportTarget({ subjects, alerts: [], sessions: [] }, now)).toBe(subjects[0]);
  });

  it('handles one or zero accessible targets', () => {
    const only = subject('only');
    expect(selectDefaultReportTarget({ subjects: [only], alerts: [], sessions: [] }, now)).toBe(only);
    expect(selectDefaultReportTarget({ subjects: [], alerts: [], sessions: [] }, now)).toBeUndefined();
  });
});

describe('report selection session store', () => {
  beforeEach(() => useReportSelectionStore.getState().clear());

  it('does not overwrite a manual selection with a later automatic selection', () => {
    useReportSelectionStore.getState().selectManually('manual');
    useReportSelectionStore.getState().selectAutomatically('demo-default');
    expect(useReportSelectionStore.getState()).toMatchObject({ selectedId: 'manual', manuallySelected: true });
  });
});
