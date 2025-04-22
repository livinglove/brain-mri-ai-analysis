
import { BrainRegion, PatientData, AnalysisResult, AnalysisResults } from '../types/brainData';

// Standard deviation threshold for abnormality
const SD_THRESHOLD = 2.0;
// Threshold for significant asymmetry (percentage)
const ASYMMETRY_THRESHOLD = 10;

/**
 * Analyze brain regions for abnormalities based on standard deviations from normative values
 */
export function analyzeBrainData(patientData: PatientData): AnalysisResults {
  const results: AnalysisResult[] = [];
  const atrophiedRegions: string[] = [];
  const enlargedRegions: string[] = [];
  const asymmetricRegions: string[] = [];
  
  patientData.brainRegions.forEach(region => {
    const result = analyzeRegion(region);
    results.push(result);
    
    if (result.status === 'atrophied') {
      atrophiedRegions.push(region.name);
    } else if (result.status === 'enlarged') {
      enlargedRegions.push(region.name);
    }
    
    if (result.asymmetry?.significantAsymmetry) {
      asymmetricRegions.push(region.name);
    }
  });
  
  return {
    patientId: patientData.patientId,
    age: patientData.age,
    sex: patientData.sex,
    results,
    summary: {
      totalAbnormalities: atrophiedRegions.length + enlargedRegions.length,
      atrophiedRegions,
      enlargedRegions,
      asymmetricRegions
    }
  };
}

/**
 * Analyze a single brain region
 */
function analyzeRegion(region: BrainRegion): AnalysisResult {
  const result: AnalysisResult = {
    brainRegion: region.name,
    status: 'normal',
    deviationScore: 0
  };
  
  // If we have total volume, use it for analysis
  if (region.totalVolume !== undefined) {
    const deviation = (region.totalVolume - region.normativeValue) / region.standardDeviation;
    result.deviationScore = parseFloat(deviation.toFixed(2));
    
    if (deviation <= -SD_THRESHOLD) {
      result.status = 'atrophied';
    } else if (deviation >= SD_THRESHOLD) {
      result.status = 'enlarged';
    }
  }
  
  // Check for asymmetry if we have left and right volumes
  if (region.leftVolume !== undefined && region.rightVolume !== undefined) {
    const larger = Math.max(region.leftVolume, region.rightVolume);
    const smaller = Math.min(region.leftVolume, region.rightVolume);
    const difference = larger - smaller;
    const percentDifference = (difference / larger) * 100;
    
    result.asymmetry = {
      difference: parseFloat(difference.toFixed(2)),
      percentDifference: parseFloat(percentDifference.toFixed(2)),
      significantAsymmetry: percentDifference > ASYMMETRY_THRESHOLD
    };
  }
  
  return result;
}

/**
 * Extract brain region data from PDF text
 * (Simplified placeholder - would need a real PDF parsing library)
 */
export function extractDataFromPDFText(text: string): Partial<PatientData> {
  // This is a placeholder implementation
  // In a real implementation, we'd use regex patterns to extract data
  
  try {
    // Example extraction pattern for demonstration
    const patientIdMatch = text.match(/Patient ID:\s*([A-Z0-9]+)/i);
    const ageMatch = text.match(/Age:\s*(\d+)/i);
    const sexMatch = text.match(/Sex:\s*(male|female)/i);
    
    // Very simplified brain region extraction (would be much more complex in reality)
    const brainRegions: BrainRegion[] = [];
    
    // Extremely simplified parsing for demonstration purposes
    // In reality, this would be much more robust and use proper regex patterns
    const lines = text.split('\n');
    lines.forEach(line => {
      // Example pattern: Hippocampus 2.5 2.3 4.8 5.2 0.4
      const regionMatch = line.match(/([A-Za-z\s]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)/);
      if (regionMatch) {
        brainRegions.push({
          name: regionMatch[1].trim(),
          leftVolume: parseFloat(regionMatch[2]),
          rightVolume: parseFloat(regionMatch[3]),
          totalVolume: parseFloat(regionMatch[4]),
          normativeValue: parseFloat(regionMatch[5]),
          standardDeviation: parseFloat(regionMatch[6])
        });
      }
    });
    
    return {
      patientId: patientIdMatch ? patientIdMatch[1] : '',
      age: ageMatch ? parseInt(ageMatch[1]) : 0,
      sex: sexMatch ? (sexMatch[1].toLowerCase() as 'male' | 'female') : 'male',
      brainRegions
    };
    
  } catch (error) {
    console.error("Error extracting data from PDF text:", error);
    return {};
  }
}

// Sample normative data for common brain regions
export const sampleNormativeData: BrainRegion[] = [
  {
    name: "Hippocampus",
    normativeValue: 4.2,
    standardDeviation: 0.4
  },
  {
    name: "Amygdala",
    normativeValue: 2.5,
    standardDeviation: 0.3
  },
  {
    name: "Thalamus",
    normativeValue: 12.1,
    standardDeviation: 1.2
  },
  {
    name: "Caudate",
    normativeValue: 7.8,
    standardDeviation: 0.9
  },
  {
    name: "Putamen",
    normativeValue: 9.4,
    standardDeviation: 1.1
  },
  {
    name: "Pallidum",
    normativeValue: 3.5,
    standardDeviation: 0.4
  },
  {
    name: "Brainstem",
    normativeValue: 20.5,
    standardDeviation: 2.2
  },
  {
    name: "Cerebellum",
    normativeValue: 130.0,
    standardDeviation: 15.0
  },
  {
    name: "Ventricles",
    normativeValue: 22.0,
    standardDeviation: 8.0
  },
  {
    name: "Frontal Lobe",
    normativeValue: 210.0,
    standardDeviation: 25.0
  },
  {
    name: "Temporal Lobe",
    normativeValue: 135.0,
    standardDeviation: 18.0
  },
  {
    name: "Parietal Lobe",
    normativeValue: 125.0,
    standardDeviation: 16.0
  },
  {
    name: "Occipital Lobe",
    normativeValue: 75.0,
    standardDeviation: 10.0
  }
];
