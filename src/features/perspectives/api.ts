import { postJson } from '@/shared/lib/apiClient';
import type { ProductStage, FormData } from '@/shared/types';
import type { RealCard } from './types';

export interface RealPerspectivesPayload {
  productName: string;
  webLink: string;
  productStage: ProductStage | '';
}

export async function getRealPerspectives(payload: RealPerspectivesPayload): Promise<RealCard[]> {
  const res = await postJson('/api/real-perspectives', payload);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.cards ?? [];
}

// Builds the multipart body and opens the streaming /api/simulate response.
// The SSE parsing loop stays in the component (it drives incremental UI state).
export function streamSimulation(formData: FormData, more: boolean, existingPersonas: string[]): Promise<Response> {
  const body = new FormData();
  body.append('productName', formData.productName);
  body.append('productStage', formData.productStage);
  body.append('productType', formData.productType);
  body.append('coreFunctions', formData.coreFunctions);
  body.append('requirements', formData.requirements);
  body.append('webLink', formData.webLink);
  body.append('featureConstraints', JSON.stringify(formData.featureConstraints));
  body.append('timeConstraints', JSON.stringify(formData.timeConstraints));
  if (more) {
    body.append('count', '4');
    body.append('existingPersonas', JSON.stringify(existingPersonas));
  }
  for (const file of formData.screenshots) body.append('screenshots', file);
  for (const file of formData.documents) body.append('documents', file);

  return fetch('/api/simulate', { method: 'POST', body });
}
