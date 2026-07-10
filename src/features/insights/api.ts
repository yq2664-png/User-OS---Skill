import { postJson } from '@/shared/lib/apiClient';
import type { Card, Insights } from '@/shared/types';

export async function getInsights(cards: Card[], productName: string): Promise<Insights> {
  const res = await postJson('/api/insights', { cards, productName });
  if (!res.ok) throw new Error('Server error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
