export type ProductStage = 'unpublished' | 'web' | 'client';

export interface FeatureConstraint {
  module: string;
  constraint: string;
}

export interface TimeConstraint {
  timeline: string;
  description: string;
}

export interface FormData {
  productName: string;
  productStage: ProductStage | '';
  productType: string;
  coreFunctions: string;
  webLink: string;
  requirements: string;
  featureConstraints: FeatureConstraint[];
  timeConstraints: TimeConstraint[];
  screenshots: File[];
  documents: File[];
}
