
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainRegion, PatientData } from '@/types/brainData';
import { sampleNormativeData, getAgeAdjustedNorm } from '@/utils/analysisUtils';
import { toast } from 'sonner';
import PatientInfoForm from "./PatientInfoForm";
import BrainRegionInputTable from "./BrainRegionInputTable";

interface DataEntryFormProps {
  onDataSubmit: (data: PatientData) => void;
  initialData?: Partial<PatientData>;
}

const LH_INPUT_COLOR = "bg-[#D3E4FD]"; // Soft blue
const RH_INPUT_COLOR = "bg-[#E5DEFF]"; // Soft purple

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
        totalVolume: undefined,
      }))
  );

  // Update normative values when age changes
  useEffect(() => {
    if (age && !isNaN(parseInt(age))) {
      const currentAge = parseInt(age);
      console.log(`Updating normative values for age: ${currentAge}`);
      
      const updatedRegions = brainRegions.map(region => {
        // Make sure to use the exact region name (with proper pluralization) when getting the norm
        const normValue = getAgeAdjustedNorm(region.name, currentAge);
        console.log(`Region: ${region.name}, Previous norm: ${region.normativeValue}, New norm: ${normValue}`);
        
        return {
          ...region,
          normativeValue: normValue !== undefined ? normValue : region.normativeValue,
          ageAdjusted: normValue !== undefined
        };
      });
      
      setBrainRegions(updatedRegions);
    }
  }, [age]);

  const handleRegionChange = (index: number, field: keyof BrainRegion, value: string) => {
    const newRegions = [...brainRegions];
    if (['leftVolume', 'rightVolume', 'totalVolume', 'normativeValue', 'standardDeviation'].includes(field)) {
      newRegions[index] = {
        ...newRegions[index],
        [field]: value === '' ? undefined : parseFloat(value)
      };

      // If LH/RH changes, always auto-update Total
      if (field === 'leftVolume' || field === 'rightVolume') {
        const left = field === 'leftVolume' ? (value === '' ? undefined : parseFloat(value)) : newRegions[index].leftVolume;
        const right = field === 'rightVolume' ? (value === '' ? undefined : parseFloat(value)) : newRegions[index].rightVolume;
        if (left !== undefined && right !== undefined) {
          newRegions[index].totalVolume = parseFloat((left + right).toFixed(2));
        } else {
          newRegions[index].totalVolume = undefined;
        }
      }
      // Changing totalVolume does not alter LH/RH (but totalVolume input will not be shown)
    } else {
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

  const handleAgeChange = (newAge: string) => {
    setAge(newAge);
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
        <PatientInfoForm
          patientId={patientId}
          age={age}
          sex={sex}
          onPatientIdChange={setPatientId}
          onAgeChange={handleAgeChange}
          onSexChange={setSex}
        />
        <BrainRegionInputTable
          regions={brainRegions}
          lhColor={LH_INPUT_COLOR}
          rhColor={RH_INPUT_COLOR}
          onRegionChange={handleRegionChange}
        />
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
