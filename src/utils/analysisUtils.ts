import { BrainRegion, PatientData, AnalysisResult, AnalysisResults } from '../types/brainData';
import { getNormativeValue } from './normativeData';

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
 * More flexible detection of NeuroQuant information
 */
export function extractDataFromPDFText(text: string): Partial<PatientData> {
  try {
    // Log to help with debugging
    console.log("Extracting data from PDF text of length:", text.length);
    
    // Check for various possible headers that might indicate NeuroQuant data
    // Being more flexible with detection, including case insensitivity and various spellings
    const possibleHeaders = [
      "NeuroQuant Morphometry",
      "NeuroQuant Morphology",
      "Neuro Quant Morphometry",
      "Neurological Quantitative Morphometry",
      "Brain Morphometry",
      "Brain Volume Analysis",
      "Brain Structure Volumes",
      "Volumetric Analysis"
    ];
    
    let foundHeader = false;
    for (const header of possibleHeaders) {
      if (text.includes(header) || text.toLowerCase().includes(header.toLowerCase())) {
        console.log(`Found header: "${header}" in the PDF`);
        foundHeader = true;
        break;
      }
    }
    
    if (!foundHeader) {
      console.log("No NeuroQuant-like section headers found in the PDF");
      
      // Look for patterns that suggest brain region volume data
      const volumePattern = /\b(Hippocampus|Amygdala|Thalamus|Ventricle|Cortex|Cerebellum|Brainstem|Putamen|Pallidum|Caudate)\s+\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+/i;
      if (volumePattern.test(text)) {
        console.log("Found potential brain region volume data without specific header");
        foundHeader = true; // Proceed with extraction even without header
      } else {
        return {};
      }
    }
    
    // Extract patient information - allow more flexible matching
    const patientIdMatch = text.match(/(?:Patient\s*ID|Subject\s*ID|ID|Patient|Subject):\s*([A-Z0-9-_]+)/i);
    const ageMatch = text.match(/(?:Age|Years):\s*(\d+)/i);
    const sexMatch = text.match(/(?:Sex|Gender):\s*(Male|Female|M|F)/i);
    
    let sex: 'male' | 'female' = 'male';
    if (sexMatch) {
      const sexValue = sexMatch[1].toLowerCase();
      sex = sexValue === 'female' || sexValue === 'f' ? 'female' : 'male';
    }
    
    // Find the brain volume data - more flexible pattern matching
    const morphometryLines: string[] = [];
    const lines = text.split('\n');
    
    // Track table data - look for structured numeric data
    let inDataSection = false;
    let tableStartLine = -1;
    
    // First pass: identify potential data tables based on numeric patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for table headers or volume data patterns
      if (
        (line.includes("Structure") && 
         (line.includes("Left") || line.includes("Right") || line.includes("Total") || line.includes("Norm"))) ||
        (line.includes("Volume") && (line.includes("cm³") || line.includes("mm³") || line.includes("%")))
      ) {
        console.log("Found potential table header at line", i, ":", line);
        tableStartLine = i;
      }
      
      // If we've found a table header, check subsequent lines for numeric data patterns
      if (tableStartLine > -1 && i > tableStartLine) {
        // Look for lines with multiple numbers, which could be volume data
        // Pattern: Text label followed by 3-5 numbers
        const volumeDataPattern = /^([A-Za-z\s\-\.]+)(?:\s+\d+\.?\d*){3,5}$/;
        if (volumeDataPattern.test(line)) {
          if (!inDataSection) {
            console.log("Starting data section at line", i);
            inDataSection = true;
          }
          morphometryLines.push(line);
        } 
        // If we're in a data section but hit an empty line or non-matching line,
        // it might be the end of the data table
        else if (inDataSection && (line === '' || !line.match(/\d+\.\d+/))) {
          // Skip single empty lines within data
          if (line !== '' || (i + 1 < lines.length && lines[i+1].trim() === '')) {
            console.log("Ending data section at line", i);
            inDataSection = false;
          }
        }
      }
    }
    
    console.log(`Found ${morphometryLines.length} lines of potential brain region data`);
    
    // If no data was found using standard methods, try broader pattern matching
    if (morphometryLines.length === 0) {
      console.log("No structured table found, trying broader pattern matching");
      
      // Look for any lines that might contain brain region names and numeric values
      const brainRegionNames = [
        "Hippocampus", "Amygdala", "Thalamus", "Caudate", "Putamen", "Pallidum",
        "Brainstem", "Cerebellum", "Ventricle", "Frontal", "Temporal", "Parietal",
        "Occipital", "Cortex", "White Matter", "Gray Matter"
      ];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;
        
        // Check if this line might contain a brain region name and numbers
        for (const region of brainRegionNames) {
          if (
            (trimmedLine.toLowerCase().includes(region.toLowerCase()) || 
             trimmedLine.toLowerCase().includes(region.toLowerCase().replace(" ", ""))) && 
            trimmedLine.match(/\d+\.\d+/)
          ) {
            console.log("Found potential brain region data:", trimmedLine);
            morphometryLines.push(trimmedLine);
            break;
          }
        }
      }
    }
    
    // Parse the collected data into brain region objects
    const brainRegions: BrainRegion[] = [];
    
    // More flexible pattern matching for brain region data
    // This handles variations in formatting across different NeuroQuant report formats
    for (const line of morphometryLines) {
      console.log("Processing line:", line);
      
      // Try different pattern matches depending on the data format
      
      // Pattern 1: Name followed by left, right, total, norm, SD values
      // Example: "Hippocampus    2.1    2.3    4.4    4.2    0.4"
      const pattern1 = /([A-Za-z\s\-\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)/;
      
      // Pattern 2: Name followed by total, norm, SD (no left/right)
      // Example: "Hippocampus    4.4    4.2    0.4"
      const pattern2 = /([A-Za-z\s\-\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)/;
      
      // Pattern 3: Name and numbers separated by tabs or multiple spaces
      // Example: "Hippocampus\t2.1\t2.3\t4.4\t4.2\t0.4"
      const pattern3 = /([A-Za-z\s\-\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)/;
      
      let match: RegExpMatchArray | null = null;
      let patternUsed = 0;
      
      // Try each pattern in sequence
      if ((match = line.match(pattern1))) {
        patternUsed = 1;
      } else if ((match = line.match(pattern3))) {
        patternUsed = 3;
      } else if ((match = line.match(pattern2))) {
        patternUsed = 2;
      }
      
      if (match) {
        console.log(`Matched pattern ${patternUsed}:`, match);
        
        // Extract the name and clean it up
        const name = match[1].trim();
        
        // Skip lines that don't look like brain regions
        if (name.length < 3 || name.match(/^[0-9\s]+$/)) {
          console.log("Skipping non-region line");
          continue;
        }
        
        if (patternUsed === 1 || patternUsed === 3) {
          // Full data with left/right hemispheres
          brainRegions.push({
            name: name,
            leftVolume: parseFloat(match[2]),
            rightVolume: parseFloat(match[3]),
            totalVolume: parseFloat(match[4]),
            normativeValue: parseFloat(match[5]),
            standardDeviation: parseFloat(match[6])
          });
        } else if (patternUsed === 2) {
          // Data with only total volume (no left/right)
          brainRegions.push({
            name: name,
            totalVolume: parseFloat(match[2]),
            normativeValue: parseFloat(match[3]),
            standardDeviation: parseFloat(match[4])
          });
        }
      }
    }
    
    console.log(`Successfully extracted ${brainRegions.length} brain regions`);
    
    // If we couldn't parse any regions but found a table, something went wrong with the parsing
    if (brainRegions.length === 0 && morphometryLines.length > 0) {
      console.log("Failed to parse brain regions despite finding potential data");
    }
    
    return {
      patientId: patientIdMatch ? patientIdMatch[1] : '',
      age: ageMatch ? parseInt(ageMatch[1]) : 0,
      sex: sex,
      brainRegions
    };
  } catch (error) {
    console.error("Error extracting data from PDF text:", error);
    return {};
  }
}

// Create sample normative data that aligns with our knowledge base
export const sampleNormativeData: BrainRegion[] = [
  {
    name: "Hippocampus",
    normativeValue: 0.27,
    standardDeviation: 0.03
  },
  {
    name: "Amygdala",
    normativeValue: 0.11,
    standardDeviation: 0.02
  },
  {
    name: "Thalamus",
    normativeValue: 0.54,
    standardDeviation: 0.05
  },
  {
    name: "Caudate",
    normativeValue: 0.26,
    standardDeviation: 0.03
  },
  {
    name: "Putamen",
    normativeValue: 0.36,
    standardDeviation: 0.04
  },
  {
    name: "Pallidum",
    normativeValue: 0.06,
    standardDeviation: 0.01
  },
  {
    name: "Forebrain",
    normativeValue: 32.52,
    standardDeviation: 2.5
  },
  {
    name: "Cortical Gray",
    normativeValue: 16.56,
    standardDeviation: 1.5
  }
];
