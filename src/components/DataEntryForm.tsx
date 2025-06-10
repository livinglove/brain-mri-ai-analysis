
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
        
        // Calculate Z-score if we have volume data
        let zScore: number | undefined = undefined;
        let volumeForZScore: number | undefined = undefined;
        
        // Determine volume for Z-score calculation
        if (region.leftVolume !== undefined && region.rightVolume !== undefined) {
          // Use mean volume (average) for Z-score since normative values are averages
          volumeForZScore = (region.leftVolume + region.rightVolume) / 2;
        } else if (region.totalVolume !== undefined) {
          volumeForZScore = region.totalVolume;
        }
        
        if (volumeForZScore !== undefined && normValue !== undefined) {
          zScore = parseFloat(((volumeForZScore - normValue) / region.standardDeviation).toFixed(2));
          console.log(`Region: ${region.name}, Volume for Z-score: ${volumeForZScore}, Z-score: ${zScore}`);
        }
        
        return {
          ...region,
          normativeValue: normValue !== undefined ? normValue : region.normativeValue,
          ageAdjusted: normValue !== undefined,
          zScore
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

      // If LH/RH changes, always auto-update Total and Z-score
      if (field === 'leftVolume' || field === 'rightVolume') {
        const left = field === 'leftVolume' ? (value === '' ? undefined : parseFloat(value)) : newRegions[index].leftVolume;
        const right = field === 'rightVolume' ? (value === '' ? undefined : parseFloat(value)) : newRegions[index].rightVolume;
        if (left !== undefined && right !== undefined) {
          // Store sum as totalVolume for display purposes
          newRegions[index].totalVolume = parseFloat((left + right).toFixed(2));
          
          // Calculate Z-score using mean volume (average of left and right)
          const meanVolume = (left + right) / 2;
          if (newRegions[index].normativeValue !== undefined && newRegions[index].standardDeviation !== undefined) {
            newRegions[index].zScore = parseFloat(
              ((meanVolume - newRegions[index].normativeValue) / newRegions[index].standardDeviation).toFixed(2)
            );
          }
        } else {
          newRegions[index].totalVolume = undefined;
          newRegions[index].zScore = undefined;
        }
      }
      
      // If total volume changes directly, use it as-is for Z-score calculation
      if (field === 'totalVolume') {
        const totalVol = value === '' ? undefined : parseFloat(value);
        if (totalVol !== undefined && newRegions[index].normativeValue !== undefined && newRegions[index].standardDeviation !== undefined) {
          newRegions[index].zScore = parseFloat(
            ((totalVol - newRegions[index].normativeValue) / newRegions[index].standardDeviation).toFixed(2)
          );
        } else {
          newRegions[index].zScore = undefined;
        }
      }
      
      // If normative value or SD changes, recalculate Z-score
      if ((field === 'normativeValue' || field === 'standardDeviation') && newRegions[index].totalVolume !== undefined) {
        const normValue = field === 'normativeValue' ? 
          (value === '' ? undefined : parseFloat(value)) : 
          newRegions[index].normativeValue;
        
        const stdDev = field === 'standardDeviation' ? 
          (value === '' ? undefined : parseFloat(value)) : 
          newRegions[index].standardDeviation;
          
        if (normValue !== undefined && stdDev !== undefined) {
          // Use mean volume if we have left/right, otherwise use total
          let volumeForZScore = newRegions[index].totalVolume;
          if (newRegions[index].leftVolume !== undefined && newRegions[index].rightVolume !== undefined) {
            volumeForZScore = (newRegions[index].leftVolume + newRegions[index].rightVolume) / 2;
          }
          
          newRegions[index].zScore = parseFloat(
            ((volumeForZScore - normValue) / stdDev).toFixed(2)
          );
        } else {
          newRegions[index].zScore = undefined;
        }
      }
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
