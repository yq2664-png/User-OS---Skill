export interface RealCard {
  source: string;
  sourceUrl?: string;
  persona: string;
  quote: string;
  highlight?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}
