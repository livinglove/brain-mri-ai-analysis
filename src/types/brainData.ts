
export interface BrainRegion {
  name: string;
  leftVolume?: number;
  rightVolume?: number;
  totalVolume?: number;
  normativeValue: number;
  standardDeviation: number;
  ageAdjusted?: boolean;
  zScore?: number;
}

export interface PatientData {
  patientId: string;
  age: number;
  sex: 'male' | 'female';
  brainRegions: BrainRegion[];
}

export interface AnalysisResult {
  brainRegion: string;
  status: 'normal' | 'atrophied' | 'enlarged';
  zScore: number; // Changed from deviationScore to zScore
  asymmetry?: {
    difference: number; // Absolute difference
    percentDifference: number; // Percentage difference
    significantAsymmetry: boolean;
  };
}

export interface AnalysisResults {
  patientId: string;
  age: number;
  sex: 'male' | 'female';
  results: AnalysisResult[];
  summary: {
    totalAbnormalities: number;
    atrophiedRegions: string[];
    enlargedRegions: string[];
    asymmetricRegions: string[];
  };
}
