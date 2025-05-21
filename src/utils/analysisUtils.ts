
import { BrainRegion, PatientData, AnalysisResult, AnalysisResults } from '../types/brainData';
import { getNormativeValue, getDisplayName } from './normativeData';

// Z-score thresholds for abnormality
const Z_SCORE_THRESHOLD = 2.0;
// Threshold for significant asymmetry (percentage)
const ASYMMETRY_THRESHOLD = 10;

// Define brainRegionNames at the top level so it can be accessed throughout the file
const brainRegionNames = [
  "Forebrain", "Cortical Gray", "Cortical Grey", "Hippocampus", "Hippocampi", 
  "Amygdala", "Amygdalae", "Amydalae", "Thalamus", "Thalami", "Caudate", "Caudates", 
  "Putamen", "Putamina", "Pallidum", "Pallidums", "Brainstem"
];

/**
 * Analyze brain regions for abnormalities based on Z-scores from age-matched controls
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
 * Analyze a single brain region using Z-scores
 */
function analyzeRegion(region: BrainRegion): AnalysisResult {
  const result: AnalysisResult = {
    brainRegion: region.name,
    status: 'normal',
    zScore: 0
  };
  
  // If we have total volume, use it for analysis
  if (region.totalVolume !== undefined) {
    // Calculate Z-score: (actual - expected) / standard deviation
    const zScore = (region.totalVolume - region.normativeValue) / region.standardDeviation;
    result.zScore = parseFloat(zScore.toFixed(2));
    
    // Use Z-score for determining status:
    // Z-score < -2 means significantly smaller (atrophied)
    // Z-score > +2 means significantly larger (enlarged)
    if (zScore <= -Z_SCORE_THRESHOLD) {
      result.status = 'atrophied';
    } else if (zScore >= Z_SCORE_THRESHOLD) {
      result.status = 'enlarged';
    }

    // Add console logging to help debug
    console.log(`Region ${region.name}: Volume=${region.totalVolume}, Norm=${region.normativeValue}, SD=${region.standardDeviation}, Z-Score=${zScore}, Status=${result.status}`);
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
 * Enhanced PDF text extraction with improved LH/RH detection
 */
export function extractDataFromPDFText(text: string): Partial<PatientData> {
  try {
    // Log to help with debugging
    console.log("Extracting data from PDF text of length:", text.length);
    
    // Check for various possible headers that might indicate NeuroQuant data
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
    const ageMatch = text.match(/(?:Age|Years|yr):\s*(\d+)/i);
    const sexMatch = text.match(/(?:Sex|Gender):\s*(Male|Female|M|F)/i);
    
    let sex: 'male' | 'female' = 'male';
    if (sexMatch) {
      const sexValue = sexMatch[1].toLowerCase();
      sex = sexValue === 'female' || sexValue === 'f' ? 'female' : 'male';
    }
    
    // Improved approach to finding brain volume data: look for lateral hemispheric data specifically
    const morphometryLines: string[] = [];
    const lines = text.split(/\n|\r\n|\r/); // Handle different line break formats
    
    // More patterns to detect hemisphere data
    const leftRightPatterns = [
      /left|right|lh|rh/i,                      // Basic keywords
      /(?:left|l)\.?\s+(?:hem|hemisphere|vol)/i,  // Left hemisphere variations
      /(?:right|r)\.?\s+(?:hem|hemisphere|vol)/i, // Right hemisphere variations
      /(?:bilateral|total)/i                    // Combined volumes
    ];
    
    // New approach: scan through lines looking for table columns that indicate left and right hemispheres
    let tableColumns: {leftCol?: number, rightCol?: number, totalCol?: number} = {};
    let headerLine = -1;
    
    // First, find header rows that contain left/right column information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      // Look for header rows with column labels
      if (
        (line.includes("left") || line.includes("l.") || line.includes("lh")) && 
        (line.includes("right") || line.includes("r.") || line.includes("rh"))
      ) {
        console.log("Found potential column headers at line", i, ":", line);
        headerLine = i;
        
        // Split the header line into columns to identify positions
        const columns = line.split(/\s+/).filter(Boolean);
        for (let j = 0; j < columns.length; j++) {
          const col = columns[j].toLowerCase();
          if (col === "left" || col === "l." || col === "lh") {
            tableColumns.leftCol = j;
            console.log("Left column detected at position", j);
          }
          if (col === "right" || col === "r." || col === "rh") {
            tableColumns.rightCol = j;
            console.log("Right column detected at position", j);
          }
          if (col === "total" || col === "bil." || col === "bilateral") {
            tableColumns.totalCol = j;
            console.log("Total column detected at position", j);
          }
        }
        
        // If we found header columns, break
        if (tableColumns.leftCol !== undefined || tableColumns.rightCol !== undefined) {
          break;
        }
      }
    }
    
    // If we didn't find explicit headers, look for left/right patterns in the data
    const dataLines: {line: string, lineNum: number, hasLeftRight: boolean}[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      // Count numbers in the line
      const numbers = line.match(/\d+\.\d+/g);
      const hasMultipleNumbers = numbers && numbers.length >= 2;
      
      // Check if any known brain region name is in the line
      const hasRegionName = brainRegionNames.some(name => 
        line.toLowerCase().includes(name.toLowerCase())
      );
      
      // Check for left/right hemisphere indicators
      const hasLeftRightIndicators = leftRightPatterns.some(pattern => 
        pattern.test(line.toLowerCase())
      );
      
      if (hasRegionName && hasMultipleNumbers) {
        console.log(`Found potential data line (${i}): ${line}`);
        dataLines.push({
          line: line,
          lineNum: i,
          hasLeftRight: hasLeftRightIndicators
        });
        
        // Add to morphometry lines for processing
        morphometryLines.push(line);
      }
    }
    
    // Define a mapping from raw extracted names to new display names
    const regionNameMap: { [key: string]: string } = {
      "Forebrain": "Forebrain Parenchyma",
      "Cortical Gray": "Cortical Gray Matter",
      "Cortical Grey": "Cortical Gray Matter",
      "Hippocampus": "Hippocampi",
      "Amygdala": "Amydalae",
      "Caudate": "Caudates",
      "Putamen": "Putamina",
      "Pallidum": "Pallidums",
      "Thalamus": "Thalami"
    };
    
    // Parse the collected data into brain region objects
    const brainRegions: BrainRegion[] = [];
    
    // Enhanced pattern matching for brain region data with explicit left/right detection
    for (const line of morphometryLines) {
      console.log("Processing line:", line);
      
      // Create patterns to match both standardized formats and more variable formats
      
      // Pattern 1: Name followed by left, right, total, norm, SD values
      // Example: "Hippocampus    2.1    2.3    4.4    4.2    0.4"
      const pattern1 = /([A-Za-z\s\-\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)/;
      
      // Pattern 2: Name followed by total, norm, SD (no left/right)
      // Example: "Hippocampus    4.4    4.2    0.4"
      const pattern2 = /([A-Za-z\s\-\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)/;
      
      // Pattern 3: Name and numbers separated by tabs or multiple spaces
      // Example: "Hippocampus\t2.1\t2.3\t4.4\t4.2\t0.4"
      const pattern3 = /([A-Za-z\s\-\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)[\s\t]+([\d\.]+)/;
      
      // Pattern 4: Looking for L/R indicators with numbers
      // Example: "Hippocampus L:2.1 R:2.3 Total:4.4 Norm:4.2 SD:0.4"
      const pattern4 = /([A-Za-z\s\-\.]+).*(?:L|Left|LH)[:\s]+([\d\.]+).*(?:R|Right|RH)[:\s]+([\d\.]+).*(?:Total|Sum|Bilateral)[:\s]+([\d\.]+)/i;
      
      // Pattern 5: Mixed format with L/R indicators and multiple numbers
      const pattern5 = /([A-Za-z\s\-\.]+).*(?:L|Left)[:\s]+([\d\.]+).*(?:R|Right)[:\s]+([\d\.]+)/i;
      
      let match: RegExpMatchArray | null = null;
      let patternUsed = 0;
      
      // Try each pattern in sequence, prioritizing ones with explicit L/R detection
      if ((match = line.match(pattern4))) {
        patternUsed = 4;
      } else if ((match = line.match(pattern5))) {
        patternUsed = 5;
      } else if ((match = line.match(pattern1)) || (match = line.match(pattern3))) {
        // If we know which columns are L/R/Total based on table headers
        if (tableColumns.leftCol !== undefined && tableColumns.rightCol !== undefined) {
          patternUsed = 1;
        } else {
          // Try to guess based on context - usually L/R/Total are first 3 numbers
          patternUsed = 1;
        }
      } else if ((match = line.match(pattern2))) {
        patternUsed = 2;
      }
      
      if (match) {
        console.log(`Matched pattern ${patternUsed}:`, match);
        
        // Extract the name and clean it up
        let name = match[1].trim();
        
        // Map to new region name if available
        const mappedNameKey = Object.keys(regionNameMap).find(k =>
          name.toLowerCase().includes(k.toLowerCase())
        );
        
        if (mappedNameKey) {
          console.log(`Mapped region name from "${name}" to "${regionNameMap[mappedNameKey]}"`);
          name = regionNameMap[mappedNameKey];
        }
        
        // Skip lines that don't look like brain regions
        if (name.length < 3 || name.match(/^[0-9\s]+$/)) {
          console.log("Skipping non-region line");
          continue;
        }
        
        // Handle different pattern matches
        if (patternUsed === 4 || patternUsed === 5) {
          // Pattern 4/5: Explicit L/R indicators
          const leftVol = parseFloat(match[2]);
          const rightVol = parseFloat(match[3]);
          const totalVol = patternUsed === 4 ? parseFloat(match[4]) : leftVol + rightVol;
          
          // Use sampleNormativeData to fill in normative values if we don't have them
          const sampleData = sampleNormativeData.find(r => r.name === name);
          const normative = sampleData ? sampleData.normativeValue : 0;
          const stdDev = sampleData ? sampleData.standardDeviation : 0.1;
          
          brainRegions.push({
            name: name,
            leftVolume: leftVol,
            rightVolume: rightVol,
            totalVolume: totalVol,
            normativeValue: normative,
            standardDeviation: stdDev
          });
        } else if (patternUsed === 1 || patternUsed === 3) {
          // Standard table format - using indices or table headers if available
          let leftIdx = 2, rightIdx = 3, totalIdx = 4, normIdx = 5, sdIdx = 6;
          
          // If we have identified table columns, use them
          if (tableColumns.leftCol !== undefined && tableColumns.rightCol !== undefined) {
            const allNumbers = line.match(/\d+\.\d+/g) || [];
            console.log("Found numbers in line:", allNumbers);
            
            let leftVol, rightVol, totalVol, normVal, stdDev;
            
            // Use identified column positions if possible
            if (tableColumns.leftCol < allNumbers.length) {
              leftVol = parseFloat(allNumbers[tableColumns.leftCol]);
            }
            
            if (tableColumns.rightCol < allNumbers.length) {
              rightVol = parseFloat(allNumbers[tableColumns.rightCol]);
            }
            
            if (tableColumns.totalCol !== undefined && tableColumns.totalCol < allNumbers.length) {
              totalVol = parseFloat(allNumbers[tableColumns.totalCol]);
            } else if (leftVol !== undefined && rightVol !== undefined) {
              totalVol = leftVol + rightVol;
            }
            
            // Use remaining columns for norm and SD (usually the last two)
            if (allNumbers.length > Math.max(tableColumns.leftCol || 0, tableColumns.rightCol || 0) + 1) {
              const remainingIdx = Math.max(tableColumns.leftCol || 0, tableColumns.rightCol || 0) + 1;
              normVal = parseFloat(allNumbers[remainingIdx]);
              
              if (allNumbers.length > remainingIdx + 1) {
                stdDev = parseFloat(allNumbers[remainingIdx + 1]);
              } else {
                // Use sample data for SD if not available
                const sampleData = sampleNormativeData.find(r => r.name === name);
                stdDev = sampleData ? sampleData.standardDeviation : 0.1;
              }
            } else {
              // Fallback to sample normative data
              const sampleData = sampleNormativeData.find(r => r.name === name);
              normVal = sampleData ? sampleData.normativeValue : 0;
              stdDev = sampleData ? sampleData.standardDeviation : 0.1;
            }
            
            brainRegions.push({
              name: name,
              leftVolume: leftVol,
              rightVolume: rightVol,
              totalVolume: totalVol,
              normativeValue: normVal || 0,
              standardDeviation: stdDev || 0.1
            });
          } else {
            // Standard pattern with default indices
            brainRegions.push({
              name: name,
              leftVolume: parseFloat(match[leftIdx]),
              rightVolume: parseFloat(match[rightIdx]),
              totalVolume: parseFloat(match[totalIdx]),
              normativeValue: parseFloat(match[normIdx]),
              standardDeviation: parseFloat(match[sdIdx])
            });
          }
        } else if (patternUsed === 2) {
          // Total only pattern
          brainRegions.push({
            name: name,
            totalVolume: parseFloat(match[2]),
            normativeValue: parseFloat(match[3]),
            standardDeviation: parseFloat(match[4])
          });
        }
      } else {
        // For lines that didn't match our patterns, try a more aggressive numeric extraction
        const allNumbers = line.match(/\d+\.\d+/g);
        if (allNumbers && allNumbers.length >= 3) {
          // Extract possible region name - everything before the first number
          const possibleNameMatch = line.match(/^([A-Za-z\s\-\.]+)/);
          if (possibleNameMatch) {
            let name = possibleNameMatch[1].trim();
            
            // Check if this looks like a brain region
            const isBrainRegion = brainRegionNames.some(region => 
              name.toLowerCase().includes(region.toLowerCase())
            );
            
            if (isBrainRegion) {
              console.log("Extracting data with aggressive pattern for line:", line);
              
              // Map to proper name
              const mappedNameKey = Object.keys(regionNameMap).find(k =>
                name.toLowerCase().includes(k.toLowerCase())
              );
              
              if (mappedNameKey) {
                name = regionNameMap[mappedNameKey];
              }
              
              // Determine if there are L/R markers in the text
              const hasLeft = line.toLowerCase().includes("left") || line.toLowerCase().includes("lh") || line.toLowerCase().includes("l.");
              const hasRight = line.toLowerCase().includes("right") || line.toLowerCase().includes("rh") || line.toLowerCase().includes("r.");
              
              if (hasLeft && hasRight && allNumbers.length >= 2) {
                // We have left and right volumes
                const leftVol = parseFloat(allNumbers[0]);
                const rightVol = parseFloat(allNumbers[1]);
                const totalVol = allNumbers.length > 2 ? parseFloat(allNumbers[2]) : leftVol + rightVol;
                
                // Use sample data for normative values
                const sampleData = sampleNormativeData.find(r => r.name === name);
                const normVal = sampleData ? sampleData.normativeValue : 0;
                const stdDev = sampleData ? sampleData.standardDeviation : 0.1;
                
                brainRegions.push({
                  name: name,
                  leftVolume: leftVol,
                  rightVolume: rightVol,
                  totalVolume: totalVol,
                  normativeValue: normVal,
                  standardDeviation: stdDev
                });
              } else if (allNumbers.length >= 1) {
                // Fallback to just total volume
                const totalVol = parseFloat(allNumbers[0]);
                
                // Use sample data for normative values
                const sampleData = sampleNormativeData.find(r => r.name === name);
                const normVal = sampleData ? sampleData.normativeValue : 0;
                const stdDev = sampleData ? sampleData.standardDeviation : 0.1;
                
                brainRegions.push({
                  name: name,
                  totalVolume: totalVol,
                  normativeValue: normVal,
                  standardDeviation: stdDev
                });
              }
            }
          }
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

// Replace sampleNormativeData to match new order, names, and values:
export const sampleNormativeData: BrainRegion[] = [
  {
    name: "Forebrain Parenchyma",
    normativeValue: 32.52,
    standardDeviation: 2.5
  },
  {
    name: "Cortical Gray Matter",
    normativeValue: 16.56,
    standardDeviation: 1.5
  },
  {
    name: "Hippocampi",
    normativeValue: 0.27,
    standardDeviation: 0.03
  },
  {
    name: "Amydalae",
    normativeValue: 0.11,
    standardDeviation: 0.02
  },
  {
    name: "Caudates",
    normativeValue: 0.26,
    standardDeviation: 0.03
  },
  {
    name: "Putamina",
    normativeValue: 0.36,
    standardDeviation: 0.04
  },
  {
    name: "Pallidums",
    normativeValue: 0.06,
    standardDeviation: 0.01
  },
  {
    name: "Thalami",
    normativeValue: 0.54,
    standardDeviation: 0.05
  }
];

/**
 * Get age-adjusted normative value for a brain region display name
 */
export function getAgeAdjustedNorm(regionDisplayName: string, age: number): number | undefined {
  console.log(`Getting age-adjusted norm for: ${regionDisplayName} at age: ${age}`);
  return getNormativeValue(regionDisplayName, age);
}
