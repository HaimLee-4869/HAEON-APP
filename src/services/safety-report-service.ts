import { sampleSafetyReports } from '@/data/report-data';
import type { ReportPeriod, SafetyGuide, SafetyReport } from '@/types/domain';
export interface SafetyReportService { getSafetyReport(period: ReportPeriod): Promise<SafetyReport>; generateSafetyComment(report: SafetyReport): Promise<string>; getSafetyGuide(report: SafetyReport): Promise<SafetyGuide[]> }
export class SampleSafetyReportService implements SafetyReportService {
  async getSafetyReport(period: ReportPeriod) { return sampleSafetyReports[period]; }
  async generateSafetyComment(report: SafetyReport) { return report.comment; }
  async getSafetyGuide(report: SafetyReport) { return report.guides; }
}
