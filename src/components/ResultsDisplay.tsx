
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisResults } from '@/types/brainData';

interface ResultsDisplayProps {
  results: AnalysisResults;
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'atrophied': return 'text-medical-red bg-red-50';
      case 'enlarged': return 'text-medical-yellow bg-yellow-50';
      case 'normal': return 'text-gray-700';
      default: return 'text-gray-700';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'atrophied':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-medical-red">
            <path d="m6 18 6-12 6 12"></path>
          </svg>
        );
      case 'enlarged':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-medical-yellow">
            <path d="m6 6 6 12 6-12"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-medical-green">
            <path d="M5 12h14"></path>
          </svg>
        );
    }
  };
  
  return (
    <div className="w-full animate-fade-in">
      <Card className="w-full mb-6">
        <CardHeader className="bg-medical-blue text-white">
          <CardTitle className="flex justify-between items-center">
            <span>NeuroQuant Analysis Results</span>
            <button 
              onClick={onReset} 
              className="px-2 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
            >
              New Analysis
            </button>
          </CardTitle>
          <CardDescription className="text-white/80">
            Patient ID: {results.patientId} | Age: {results.age} | Sex: {results.sex.charAt(0).toUpperCase() + results.sex.slice(1)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <div className="font-semibold text-medical-red mb-2">Atrophied Regions</div>
              <div className="text-2xl font-bold">{results.summary.atrophiedRegions.length}</div>
              <div className="text-sm text-gray-500">Regions below normative range</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
              <div className="font-semibold text-medical-yellow mb-2">Enlarged Regions</div>
              <div className="text-2xl font-bold">{results.summary.enlargedRegions.length}</div>
              <div className="text-sm text-gray-500">Regions above normative range</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <div className="font-semibold text-medical-blue mb-2">Asymmetries</div>
              <div className="text-2xl font-bold">{results.summary.asymmetricRegions.length}</div>
              <div className="text-sm text-gray-500">Significant left/right differences</div>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Regions</TabsTrigger>
              <TabsTrigger value="atrophied">Atrophied</TabsTrigger>
              <TabsTrigger value="enlarged">Enlarged</TabsTrigger>
              <TabsTrigger value="asymmetry">Asymmetries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-3 font-semibold bg-gray-50 border-b">
                  <div className="col-span-3">Brain Region</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">SD Score</div>
                  <div className="col-span-2">Asymmetry</div>
                  <div className="col-span-3">Notes</div>
                </div>
                
                {results.results.map((result, index) => (
                  <div 
                    key={`result-${index}`}
                    className={`grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 ${
                      result.status !== 'normal' || (result.asymmetry && result.asymmetry.significantAsymmetry) 
                        ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="col-span-3 font-medium">{result.brainRegion}</div>
                    <div className={`col-span-2 flex items-center gap-1 font-medium ${getStatusColor(result.status)}`}>
                      {getStatusIcon(result.status)}
                      <span className="capitalize">{result.status}</span>
                    </div>
                    <div className="col-span-2">
                      {result.deviationScore > 0 ? '+' : ''}{result.deviationScore} SD
                    </div>
                    <div className="col-span-2">
                      {result.asymmetry ? 
                        <span className={result.asymmetry.significantAsymmetry ? 'text-medical-blue font-medium' : ''}>
                          {result.asymmetry.percentDifference.toFixed(1)}%
                        </span> : 
                        'N/A'
                      }
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">
                      {result.status === 'atrophied' && 'Volume significantly below normal range'}
                      {result.status === 'enlarged' && 'Volume significantly above normal range'}
                      {result.asymmetry?.significantAsymmetry && result.status === 'normal' && 'Significant asymmetry detected'}
                      {result.status === 'normal' && (!result.asymmetry || !result.asymmetry.significantAsymmetry) && 'Within normal limits'}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="atrophied" className="mt-4">
              {results.summary.atrophiedRegions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No atrophied regions detected
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-3 font-semibold bg-gray-50 border-b">
                    <div className="col-span-4">Brain Region</div>
                    <div className="col-span-3">SD Score</div>
                    <div className="col-span-5">Clinical Implication</div>
                  </div>
                  
                  {results.results
                    .filter(r => r.status === 'atrophied')
                    .map((result, index) => (
                      <div 
                        key={`atrophied-${index}`}
                        className="grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 bg-red-50"
                      >
                        <div className="col-span-4 font-medium">{result.brainRegion}</div>
                        <div className="col-span-3 text-medical-red font-medium">
                          {result.deviationScore} SD
                        </div>
                        <div className="col-span-5 text-sm">
                          Volume is significantly below age-matched normative values
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="enlarged" className="mt-4">
              {results.summary.enlargedRegions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No enlarged regions detected
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-3 font-semibold bg-gray-50 border-b">
                    <div className="col-span-4">Brain Region</div>
                    <div className="col-span-3">SD Score</div>
                    <div className="col-span-5">Clinical Implication</div>
                  </div>
                  
                  {results.results
                    .filter(r => r.status === 'enlarged')
                    .map((result, index) => (
                      <div 
                        key={`enlarged-${index}`}
                        className="grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 bg-yellow-50"
                      >
                        <div className="col-span-4 font-medium">{result.brainRegion}</div>
                        <div className="col-span-3 text-medical-yellow font-medium">
                          +{result.deviationScore} SD
                        </div>
                        <div className="col-span-5 text-sm">
                          Volume is significantly above age-matched normative values
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="asymmetry" className="mt-4">
              {results.summary.asymmetricRegions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No significant asymmetries detected
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-3 font-semibold bg-gray-50 border-b">
                    <div className="col-span-4">Brain Region</div>
                    <div className="col-span-3">Asymmetry %</div>
                    <div className="col-span-5">Clinical Implication</div>
                  </div>
                  
                  {results.results
                    .filter(r => r.asymmetry && r.asymmetry.significantAsymmetry)
                    .map((result, index) => (
                      <div 
                        key={`asymmetry-${index}`}
                        className="grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 bg-blue-50"
                      >
                        <div className="col-span-4 font-medium">{result.brainRegion}</div>
                        <div className="col-span-3 text-medical-blue font-medium">
                          {result.asymmetry?.percentDifference.toFixed(1)}%
                        </div>
                        <div className="col-span-5 text-sm">
                          Significant difference between left and right hemisphere volumes
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
