
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { extractDataFromPDFText } from '@/utils/analysisUtils';
import { PatientData } from '@/types/brainData';

interface PDFUploaderProps {
  onDataExtracted: (data: Partial<PatientData>) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onDataExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
          
          // Extract data from PDF text
          const extractedData = extractDataFromPDFText(text);
          
          if (Object.keys(extractedData).length > 0) {
            toast.success("Data extracted successfully");
            onDataExtracted(extractedData);
          } else {
            toast.error("Could not extract brain data from this PDF");
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload NeuroQuant Report</CardTitle>
        <CardDescription>
          Upload a PDF report to automatically extract brain region data
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-medical-blue mb-2 h-10 w-10">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span className="text-sm text-gray-600 font-medium">
                {file ? file.name : "Select PDF file"}
              </span>
            </div>
          </label>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={extractText}
            disabled={!file || isLoading}
            className="bg-medical-blue hover:bg-blue-700"
          >
            {isLoading ? "Processing..." : "Extract Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
