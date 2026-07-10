export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface InsightItem {
  rank: number;
  title: string;
  observation: string;
  interpretation: string;
  behavioralInsight: string;
  score: number;
  impact: ImpactLevel;
  valueNote: string;
}

export interface Insights {
  frustrations: InsightItem[];
  hiddenNeeds: InsightItem[];
  decisionBarriers: InsightItem[];
  trustIssues: InsightItem[];
  opportunities: InsightItem[];
}
