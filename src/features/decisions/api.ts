import { postJson } from '@/shared/lib/apiClient';
import type { Insights } from '@/shared/types';
import type { PRDData } from './types';

export async function getPrd(productName: string, insights: Insights): Promise<PRDData> {
  const res = await postJson('/api/prd', { productName, insights });
  if (!res.ok) throw new Error('Server error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
