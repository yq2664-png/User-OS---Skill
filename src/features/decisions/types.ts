export type EffortLevel = 'High' | 'Medium' | 'Low';

export interface PRDSection {
  id: number;
  name: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  confidence: number;   // 0–100
  effort: EffortLevel;
  problem: string;
  userStory: string;
  requirement: string;
  successMetric: string;
}

export interface PRDData {
  title: string;
  sections: PRDSection[];
}
