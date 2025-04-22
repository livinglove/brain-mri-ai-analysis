
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { extractDataFromPDFText, getAgeAdjustedNorm } from '@/utils/analysisUtils';
import { PatientData } from '@/types/brainData';
import { Upload } from 'lucide-react';

interface PDFUploaderProps {
  onDataExtracted: (data: Partial<PatientData>) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onDataExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setRawText(''); // Reset raw text when a new file is selected
    }
  };

  const extractText = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, we'd use a PDF library like pdf.js
      // This is a simplified version using FileReader
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // In reality, we'd parse the PDF properly
          // For demo purposes, we'll just use the raw text
          const text = e.target?.result as string || "";
          setRawText(text);
          
          // Extract data from PDF text
          const extractedData = extractDataFromPDFText(text);
          
          if (Object.keys(extractedData).length > 0 && extractedData.brainRegions && extractedData.brainRegions.length > 0) {
            // Apply age-adjusted normative values if age is available
            if (extractedData.age) {
              const age = extractedData.age;
              console.log(`Applying age-adjusted norms for age: ${age} to extracted data`);
              
              extractedData.brainRegions = extractedData.brainRegions.map(region => {
                const normValue = getAgeAdjustedNorm(region.name, age);
                if (normValue !== undefined) {
                  console.log(`Region: ${region.name}, Updated norm: ${normValue}`);
                  return {
                    ...region,
                    normativeValue: normValue,
                    ageAdjusted: true
                  };
                }
                return region;
              });
            }
            
            toast.success("Data extracted successfully from NeuroQuant report");
            onDataExtracted(extractedData);
          } else {
            toast.error("Could not find NeuroQuant Morphometry data in this PDF");
          }
        } catch (err) {
          console.error("PDF processing error:", err);
          toast.error("Error processing PDF");
        }
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast.error("Error reading file");
        setIsLoading(false);
      };
      
      // For demo purposes, we're reading as text
      // In a real app, we'd use readAsArrayBuffer with pdf.js
      reader.readAsText(file);
      
    } catch (err) {
      console.error("PDF upload error:", err);
      toast.error("Error uploading PDF");
      setIsLoading(false);
    }
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload NeuroQuant Report</CardTitle>
        <CardDescription>
          Enter data manually or upload a PDF report to automatically extract brain region data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50">
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center">
              <Upload className="text-medical-blue mb-2 h-10 w-10" />
              <span className="text-sm text-gray-600 font-medium">
                {file ? file.name : "Select PDF file"}
              </span>
            </div>
          </label>
        </div>
        
        <div className="flex justify-between">
          <Button 
            onClick={toggleDebug}
            variant="outline"
            size="sm"
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </Button>
          <Button 
            onClick={extractText}
            disabled={!file || isLoading}
            className="bg-medical-blue hover:bg-blue-700"
          >
            {isLoading ? "Processing..." : "Extract Data"}
          </Button>
        </div>

        {showDebug && rawText && (
          <div className="mt-4 border rounded-md p-3">
            <h4 className="font-medium mb-2">Extracted Text Preview</h4>
            <div className="max-h-60 overflow-y-auto bg-gray-50 p-2 text-xs font-mono">
              <pre>{rawText}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
