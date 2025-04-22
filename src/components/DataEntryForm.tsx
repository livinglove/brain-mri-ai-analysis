
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainRegion, PatientData } from '@/types/brainData';
import { sampleNormativeData } from '@/utils/analysisUtils';
import { toast } from 'sonner';

interface DataEntryFormProps {
  onDataSubmit: (data: PatientData) => void;
  initialData?: Partial<PatientData>;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ onDataSubmit, initialData }) => {
  const [patientId, setPatientId] = useState(initialData?.patientId || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [sex, setSex] = useState<'male' | 'female'>(initialData?.sex || 'male');
  const [brainRegions, setBrainRegions] = useState<BrainRegion[]>(
    initialData?.brainRegions || 
    sampleNormativeData.map(region => ({ 
      ...region,
      leftVolume: undefined,
      rightVolume: undefined,
      totalVolume: undefined
    }))
  );

  const handleRegionChange = (index: number, field: keyof BrainRegion, value: string) => {
    const newRegions = [...brainRegions];
    
    // Handle numeric fields
    if (['leftVolume', 'rightVolume', 'totalVolume', 'normativeValue', 'standardDeviation'].includes(field)) {
      newRegions[index] = {
        ...newRegions[index],
        [field]: value === '' ? undefined : parseFloat(value)
      };
      
      // If left and right are provided, calculate total
      if (field === 'leftVolume' || field === 'rightVolume') {
        const left = field === 'leftVolume' ? parseFloat(value) : newRegions[index].leftVolume;
        const right = field === 'rightVolume' ? parseFloat(value) : newRegions[index].rightVolume;
        
        if (left !== undefined && right !== undefined) {
          newRegions[index].totalVolume = parseFloat((left + right).toFixed(2));
        }
      }
    } else {
      // Handle string fields
      newRegions[index] = {
        ...newRegions[index],
        [field]: value
      };
    }
    
    setBrainRegions(newRegions);
  };

  const validateForm = (): boolean => {
    if (!patientId.trim()) {
      toast.error("Patient ID is required");
      return false;
    }
    
    if (!age.trim() || isNaN(parseInt(age))) {
      toast.error("Valid age is required");
      return false;
    }
    
    // Check if at least one region has values
    const hasData = brainRegions.some(region => 
      region.totalVolume !== undefined || 
      (region.leftVolume !== undefined && region.rightVolume !== undefined)
    );
    
    if (!hasData) {
      toast.error("Please enter data for at least one brain region");
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const patientData: PatientData = {
      patientId,
      age: parseInt(age),
      sex,
      brainRegions: brainRegions.filter(region => 
        region.totalVolume !== undefined || 
        (region.leftVolume !== undefined && region.rightVolume !== undefined)
      )
    };
    
    onDataSubmit(patientData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Patient Brain Data</CardTitle>
        <CardDescription>
          Enter patient information and brain region measurements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patient-id">Patient ID</Label>
            <Input 
              id="patient-id" 
              value={patientId} 
              onChange={e => setPatientId(e.target.value)}
              placeholder="Enter patient ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input 
              id="age" 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)}
              placeholder="Enter age"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex">Sex</Label>
            <Select value={sex} onValueChange={(value) => setSex(value as 'male' | 'female')}>
              <SelectTrigger>
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Brain Region Data Entry */}
        <Tabs defaultValue="volume" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="volume">Total Volume</TabsTrigger>
            <TabsTrigger value="laterality">Left/Right Volumes</TabsTrigger>
          </TabsList>
          
          {/* Total Volume Tab */}
          <TabsContent value="volume" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-bold text-sm bg-gray-100 p-2 rounded">
                <div className="col-span-4">Brain Region</div>
                <div className="col-span-3">Total Volume (cm³)</div>
                <div className="col-span-3">Normative Value (cm³)</div>
                <div className="col-span-2">SD</div>
              </div>
              
              {brainRegions.map((region, index) => (
                <div key={`region-${index}`} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">{region.name}</div>
                  <div className="col-span-3">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.totalVolume === undefined ? '' : region.totalVolume} 
                      onChange={e => handleRegionChange(index, 'totalVolume', e.target.value)}
                      placeholder="Volume"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.normativeValue} 
                      onChange={e => handleRegionChange(index, 'normativeValue', e.target.value)}
                      placeholder="Norm Value"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.standardDeviation} 
                      onChange={e => handleRegionChange(index, 'standardDeviation', e.target.value)}
                      placeholder="SD"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Left/Right Volumes Tab */}
          <TabsContent value="laterality" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-bold text-sm bg-gray-100 p-2 rounded">
                <div className="col-span-3">Brain Region</div>
                <div className="col-span-2">Left (cm³)</div>
                <div className="col-span-2">Right (cm³)</div>
                <div className="col-span-2">Total (cm³)</div>
                <div className="col-span-2">Norm (cm³)</div>
                <div className="col-span-1">SD</div>
              </div>
              
              {brainRegions.map((region, index) => (
                <div key={`region-lat-${index}`} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">{region.name}</div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.leftVolume === undefined ? '' : region.leftVolume} 
                      onChange={e => handleRegionChange(index, 'leftVolume', e.target.value)}
                      placeholder="Left"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.rightVolume === undefined ? '' : region.rightVolume} 
                      onChange={e => handleRegionChange(index, 'rightVolume', e.target.value)}
                      placeholder="Right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.totalVolume === undefined ? '' : region.totalVolume} 
                      onChange={e => handleRegionChange(index, 'totalVolume', e.target.value)}
                      placeholder="Total"
                      disabled
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.normativeValue} 
                      onChange={e => handleRegionChange(index, 'normativeValue', e.target.value)}
                      placeholder="Norm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={region.standardDeviation} 
                      onChange={e => handleRegionChange(index, 'standardDeviation', e.target.value)}
                      placeholder="SD"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          className="ml-auto bg-medical-blue hover:bg-blue-700"
        >
          Analyze Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataEntryForm;
