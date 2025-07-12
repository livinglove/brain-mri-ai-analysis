import * as pdfjsLib from 'pdfjs-dist';
import { PatientData, BrainRegion } from '@/types/brainData';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Brain region mapping for better recognition
const regionNameMap: { [key: string]: string } = {
  "forebrain": "Forebrain Parenchyma",
  "cortical": "Cortical Gray Matter", 
  "cortex": "Cortical Gray Matter",
  "hippocampus": "Hippocampi",
  "hippocampi": "Hippocampi",
  "amygdala": "Amydalae",
  "amygdalae": "Amydalae", 
  "caudate": "Caudates",
  "caudates": "Caudates",
  "putamen": "Putamina",
  "putamina": "Putamina",
  "pallidum": "Pallidums",
  "pallidums": "Pallidums",
  "thalamus": "Thalami",
  "thalami": "Thalami",
  "brainstem": "Brainstem"
};

// Default normative values from the custom instructions
const defaultNormativeData: { [key: string]: { norm: number; sd: number } } = {
  "Forebrain Parenchyma": { norm: 32.52, sd: 2.0 },
  "Cortical Gray Matter": { norm: 16.56, sd: 1.5 },
  "Hippocampi": { norm: 0.27, sd: 0.03 },
  "Amydalae": { norm: 0.11, sd: 0.01 },
  "Caudates": { norm: 0.26, sd: 0.02 },
  "Putamina": { norm: 0.36, sd: 0.04 },
  "Pallidums": { norm: 0.06, sd: 0.01 },
  "Thalami": { norm: 0.54, sd: 0.05 }
};

export async function extractDataFromPDF(file: File): Promise<Partial<PatientData>> {
  try {
    console.log('Starting PDF extraction with PDF.js');
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    console.log(`Extracted text length: ${fullText.length}`);
    
    return parseExtractedText(fullText);
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract data from PDF');
  }
}

function parseExtractedText(text: string): Partial<PatientData> {
  console.log('Parsing extracted text for NeuroQuant data');
  
  // Extract patient information
  const patientIdMatch = text.match(/(?:Patient\s*ID|Subject\s*ID|ID):\s*([A-Z0-9-_]+)/i);
  const ageMatch = text.match(/(?:Age|Years|yr):\s*(\d+)/i);
  const sexMatch = text.match(/(?:Sex|Gender):\s*(Male|Female|M|F)/i);
  
  let sex: 'male' | 'female' = 'male';
  if (sexMatch) {
    const sexValue = sexMatch[1].toLowerCase();
    sex = sexValue === 'female' || sexValue === 'f' ? 'female' : 'male';
  }
  
  // Look for morphometry table data
  const brainRegions = extractBrainRegionData(text);
  
  const result: Partial<PatientData> = {
    brainRegions
  };
  
  if (patientIdMatch) {
    result.patientId = patientIdMatch[1];
  }
  
  if (ageMatch) {
    result.age = parseInt(ageMatch[1]);
  }
  
  result.sex = sex;
  
  console.log('Extracted patient data:', result);
  return result;
}

function extractBrainRegionData(text: string): BrainRegion[] {
  const regions: BrainRegion[] = [];
  const lines = text.split(/\n|\r\n|\r/);
  
  // Look for table headers to identify column structure
  let headerFound = false;
  let leftColIndex = -1;
  let rightColIndex = -1;
  let totalColIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    
    // Look for table headers
    if (line.includes('left') && line.includes('right')) {
      console.log('Found table header:', line);
      headerFound = true;
      
      const columns = line.split(/\s+/);
      for (let j = 0; j < columns.length; j++) {
        const col = columns[j];
        if (col.includes('left') || col === 'l' || col === 'lh') {
          leftColIndex = j;
        }
        if (col.includes('right') || col === 'r' || col === 'rh') {
          rightColIndex = j;
        }
        if (col.includes('total') || col.includes('bilateral')) {
          totalColIndex = j;
        }
      }
      continue;
    }
    
    // Skip if no header found yet
    if (!headerFound) continue;
    
    // Look for brain region data
    const originalLine = lines[i].trim();
    if (originalLine.length < 5) continue;
    
    // Check if line contains brain region names
    const regionName = identifyBrainRegion(originalLine);
    if (!regionName) continue;
    
    // Extract numerical values
    const numbers = originalLine.match(/\d+\.\d+/g);
    if (!numbers || numbers.length < 3) continue;
    
    console.log(`Processing region: ${regionName}, numbers: ${numbers}`);
    
    let leftVolume: number | undefined;
    let rightVolume: number | undefined;
    let totalVolume: number | undefined;
    
    // Try to map numbers to left/right/total based on column positions
    if (leftColIndex >= 0 && leftColIndex < numbers.length) {
      leftVolume = parseFloat(numbers[leftColIndex]);
    }
    if (rightColIndex >= 0 && rightColIndex < numbers.length) {
      rightVolume = parseFloat(numbers[rightColIndex]);
    }
    if (totalColIndex >= 0 && totalColIndex < numbers.length) {
      totalVolume = parseFloat(numbers[totalColIndex]);
    }
    
    // Fallback: assume first few numbers are left, right, total
    if (leftVolume === undefined && numbers.length >= 2) {
      leftVolume = parseFloat(numbers[0]);
      rightVolume = parseFloat(numbers[1]);
    }
    
    if (totalVolume === undefined && leftVolume !== undefined && rightVolume !== undefined) {
      totalVolume = leftVolume + rightVolume;
    } else if (totalVolume === undefined && numbers.length >= 3) {
      totalVolume = parseFloat(numbers[2]);
    }
    
    // Get default normative values
    const defaultData = defaultNormativeData[regionName];
    
    const region: BrainRegion = {
      name: regionName,
      leftVolume,
      rightVolume,
      totalVolume,
      normativeValue: defaultData?.norm || 1.0,
      standardDeviation: defaultData?.sd || 0.1
    };
    
    regions.push(region);
    console.log('Added region:', region);
  }
  
  return regions;
}

function identifyBrainRegion(line: string): string | null {
  const lowerLine = line.toLowerCase();
  
  for (const [key, mappedName] of Object.entries(regionNameMap)) {
    if (lowerLine.includes(key)) {
      return mappedName;
    }
  }
  
  // Direct matches for display names
  for (const regionName of Object.values(regionNameMap)) {
    if (lowerLine.includes(regionName.toLowerCase())) {
      return regionName;
    }
  }
  
  return null;
}