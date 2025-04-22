
// Brain structure normative values based on age groups

interface NormativeRanges {
  ageRanges: {
    min: number;
    max: number | null;
    label: string;
  }[];
  brainStructures: {
    [key: string]: {
      [ageGroup: string]: {
        mean: number;
        sd?: number; // Standard deviation if available
      };
    };
  };
}

// Values from knowledge base
export const normativeRanges: NormativeRanges = {
  ageRanges: [
    { min: 0, max: 17, label: "0-17" },
    { min: 18, max: 30, label: "18-30" },
    { min: 31, max: 45, label: "31-45" },
    { min: 46, max: 60, label: "46-60" },
    { min: 61, max: 70, label: "61-70" },
    { min: 71, max: null, label: "71+" }
  ],
  brainStructures: {
    "Forebrain": {
      "All cases": { mean: 33.38 },
      "Control": { mean: 32.52 },
      "0-17": { mean: 36.33 },
      "18-30": { mean: 34.42 },
      "31-45": { mean: 33.62 },
      "46-60": { mean: 33.19 },
      "61-70": { mean: 32.25 },
      "71+": { mean: 30.83 }
    },
    "Cortical Gray": {
      "Control": { mean: 16.56 },
      "All": { mean: 16.81 },
      "0-17": { mean: 19.60 },
      "18-30": { mean: 18.02 },
      "31-45": { mean: 17.94 },
      "46-60": { mean: 16.44 },
      "61-75": { mean: 15.68 },
      "75+": { mean: 14.85 }
    },
    "Hippocampus": {
      "Control": { mean: 0.27 },
      "All": { mean: 0.27 },
      "0-17": { mean: 0.27 },
      "18-30": { mean: 0.27 },
      "31-45": { mean: 0.27 },
      "46-60": { mean: 0.27 },
      "61-70": { mean: 0.25 },
      "71+": { mean: 0.23 }
    },
    "Amygdala": {
      "Control": { mean: 0.11 },
      "All": { mean: 0.11 },
      "0-17": { mean: 0.13 },
      "18-30": { mean: 0.13 },
      "31-45": { mean: 0.12 },
      "46-60": { mean: 0.11 },
      "61-70": { mean: 0.10 },
      "71+": { mean: 0.10 }
    },
    "Caudate": {
      "Control": { mean: 0.26 },
      "All": { mean: 0.22 },
      "0-17": { mean: 0.24 },
      "18-30": { mean: 0.23 },
      "31-45": { mean: 0.22 },
      "46-60": { mean: 0.21 },
      "61-70": { mean: 0.21 },
      "71+": { mean: 0.22 }
    },
    "Putamen": {
      "Control": { mean: 0.36 },
      "All": { mean: 0.36 },
      "0-17": { mean: 0.48 },
      "18-30": { mean: 0.43 },
      "31-45": { mean: 0.37 },
      "46-60": { mean: 0.35 },
      "61-70": { mean: 0.34 },
      "71+": { mean: 0.31 }
    },
    "Pallidum": {
      "Control": { mean: 0.06 },
      "All": { mean: 0.06 },
      "0-17": { mean: 0.08 },
      "18-30": { mean: 0.07 },
      "31-45": { mean: 0.07 },
      "46-60": { mean: 0.06 },
      "61-70": { mean: 0.05 },
      "71+": { mean: 0.04 }
    },
    "Thalamus": {
      "Control": { mean: 0.54 },
      "All": { mean: 0.52 },
      "0-17": { mean: 0.55 },
      "18-30": { mean: 0.56 },
      "31-45": { mean: 0.52 },
      "46-60": { mean: 0.51 },
      "61-70": { mean: 0.50 },
      "71+": { mean: 0.49 }
    }
  }
};

/**
 * Get the appropriate age group label for the given age
 */
export function getAgeGroup(age: number): string {
  for (const range of normativeRanges.ageRanges) {
    if (age >= range.min && (range.max === null || age <= range.max)) {
      return range.label;
    }
  }
  return "All"; // Default fallback if no matching range
}

/**
 * Get normative value for a brain structure based on age
 */
export function getNormativeValue(structureName: string, age: number): number | undefined {
  const ageGroup = getAgeGroup(age);
  const structure = findMatchingStructure(structureName);
  
  if (!structure) {
    console.log(`No matching structure found for: ${structureName}`);
    return undefined;
  }
  
  if (normativeRanges.brainStructures[structure][ageGroup]) {
    console.log(`Found normative value for ${structure} at age ${age} (${ageGroup}): ${normativeRanges.brainStructures[structure][ageGroup].mean}`);
    return normativeRanges.brainStructures[structure][ageGroup].mean;
  } else if (normativeRanges.brainStructures[structure]["All"]) {
    return normativeRanges.brainStructures[structure]["All"].mean;
  } else if (normativeRanges.brainStructures[structure]["Control"]) {
    return normativeRanges.brainStructures[structure]["Control"].mean;
  }
  
  return undefined;
}

/**
 * Find the matching structure for a given region name
 * using partial matching to handle different naming conventions
 */
function findMatchingStructure(regionName: string): string | undefined {
  // Updated mapping to properly handle plural forms to singular knowledge base keys
  const displayToBase: {[key: string]: string} = {
    "Forebrain Parenchyma": "Forebrain",
    "Cortical Gray Matter": "Cortical Gray",
    "Hippocampi": "Hippocampus",
    "Amydalae": "Amygdala", 
    "Amygdalae": "Amygdala", // Fix spelling variation
    "Caudates": "Caudate",
    "Putamina": "Putamen",
    "Pallidums": "Pallidum",
    "Thalami": "Thalamus"
  };
  
  console.log(`Finding matching structure for: "${regionName}"`);
  
  // First check if it's a direct match in our mapping
  if (displayToBase[regionName]) {
    console.log(`Direct match found: ${regionName} -> ${displayToBase[regionName]}`);
    return displayToBase[regionName];
  }
  
  // If not a direct match, try case-insensitive direct match
  for (const [display, base] of Object.entries(displayToBase)) {
    if (regionName.toLowerCase() === display.toLowerCase()) {
      console.log(`Case-insensitive match found: ${regionName} -> ${base}`);
      return base;
    }
  }
  
  // If still no match, try partial matching (case-insensitive)
  regionName = regionName.toLowerCase();
  
  const structureMap: {[key: string]: string} = {
    "hippocampus": "Hippocampus",
    "hippocampi": "Hippocampus",
    "amygdala": "Amygdala",
    "amygdalae": "Amygdala",
    "amydalae": "Amygdala",
    "thalamus": "Thalamus",
    "thalami": "Thalamus",
    "caudate": "Caudate",
    "caudates": "Caudate",
    "putamen": "Putamen",
    "putamina": "Putamen",
    "pallidum": "Pallidum",
    "pallidums": "Pallidum",
    "forebrain": "Forebrain",
    "parenchyma": "Forebrain",
    "cortical": "Cortical Gray",
    "gray": "Cortical Gray",
    "grey": "Cortical Gray"
  };
  
  // Try direct mapping with lowercase keys
  for (const key in structureMap) {
    if (regionName.includes(key)) {
      console.log(`Partial match found: ${regionName} contains ${key} -> ${structureMap[key]}`);
      return structureMap[key];
    }
  }
  
  console.log(`No match found for: ${regionName}`);
  return undefined;
}

/**
 * Get the display name for a structure key
 */
export function getDisplayName(structureKey: string): string {
  const baseToDisplay: {[key: string]: string} = {
    "Forebrain": "Forebrain Parenchyma",
    "Cortical Gray": "Cortical Gray Matter",
    "Hippocampus": "Hippocampi",
    "Amygdala": "Amydalae",
    "Caudate": "Caudates",
    "Putamen": "Putamina",
    "Pallidum": "Pallidums",
    "Thalamus": "Thalami"
  };
  
  return baseToDisplay[structureKey] || structureKey;
}
