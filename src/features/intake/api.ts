import { postJson } from '@/shared/lib/apiClient';
import type { ProductStage } from '@/shared/types';

export interface VerifyProductPayload {
  webLink: string;
  productName: string;
  productStage: ProductStage | '';
}

export async function verifyProduct(payload: VerifyProductPayload): Promise<any> {
  const res = await postJson('/api/verify-product', payload);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not verify product');
  return data;
}
