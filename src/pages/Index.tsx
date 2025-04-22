
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataEntryForm from '@/components/DataEntryForm';
import PDFUploader from '@/components/PDFUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import { PatientData, AnalysisResults } from '@/types/brainData';
import { analyzeBrainData } from '@/utils/analysisUtils';

const Index = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<PatientData> | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'pdf'>('manual');

  const handleDataSubmit = (data: PatientData) => {
    const results = analyzeBrainData(data);
    setAnalysisResults(results);
  };

  const handleDataExtracted = (data: Partial<PatientData>) => {
    setExtractedData(data);
  };

  const handleReset = () => {
    setAnalysisResults(null);
    setExtractedData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4">
          <h1 className="text-3xl font-bold text-medical-blue">Brain Atlas Oracle</h1>
          <p className="text-gray-600">NeuroQuant MRI Analysis Tool</p>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {analysisResults ? (
          <ResultsDisplay results={analysisResults} onReset={handleReset} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Brain Volume Analysis</h2>

            <Tabs value={activeTab} onValueChange={val => setActiveTab(val as 'manual' | 'pdf')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual">Manual Data Entry</TabsTrigger>
                <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <DataEntryForm 
                  onDataSubmit={handleDataSubmit} 
                  initialData={extractedData || undefined} 
                />
              </TabsContent>

              <TabsContent value="pdf">
                <PDFUploader onDataExtracted={handleDataExtracted} />
                
                {extractedData && Object.keys(extractedData).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-medium mb-4">Extracted Data</h3>
                    <p className="mb-4 text-gray-700">
                      Data has been extracted from the PDF. You can now switch to the 
                      "Manual Data Entry" tab to review, modify if needed, and analyze the data.
                    </p>
                    <div className="flex">
                      <button 
                        onClick={() => setActiveTab('manual')}
                        className="px-4 py-2 bg-medical-blue text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Switch to Manual Data Entry
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto py-4 text-center text-gray-600 text-sm">
          Brain Atlas Oracle &copy; {new Date().getFullYear()} | NeuroQuant Analysis Tool
        </div>
      </footer>
    </div>
  );
};

export default Index;
