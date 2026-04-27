export interface StudentData {
  Student_ID: string;
  Student_Name: string;
  Admit: number; // 0 or 1
  GPA?: number;
  Entrance_Score?: number;
  Projects?: number;
  Internships?: number;
  Income?: string;
  Income_Level?: string;
  Gender?: string;
  ZipCode?: number;
  [key: string]: string | number | undefined;
}

export interface ModelWeights {
  coefficients: Record<string, number>;
  intercept: number;
}

export interface PredictionResult extends StudentData {
  confidence: number;
  prediction: number;
}

export type Page = 'home' | 'upload' | 'training' | 'predictions' | 'explain' | 'bias' | 'simulator' | 'dashboard';

export interface AppState {
  data: StudentData[];
  trainingData: {
    X: number[][];
    y: number[];
    featureNames: string[];
    scaler: { mean: number[]; std: number[] };
  } | null;
  model: ModelWeights | null;
  currentPage: Page;
  selectedStudentId: string | null;
}
