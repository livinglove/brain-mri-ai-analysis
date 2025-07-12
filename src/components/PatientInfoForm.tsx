
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";

export interface PatientInfoProps {
  patientId: string;
  age: string;
  sex: "male" | "female";
  onPatientIdChange: (val: string) => void;
  onAgeChange: (val: string) => void;
  onSexChange: (val: "male" | "female") => void;
}

const PatientInfoForm: React.FC<PatientInfoProps> = ({
  patientId,
  age,
  sex,
  onPatientIdChange,
  onAgeChange,
  onSexChange
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="space-y-2">
      <Label htmlFor="patient-id" className="block h-5">Patient ID</Label>
      <Input
        id="patient-id"
        value={patientId}
        onChange={e => onPatientIdChange(e.target.value)}
        placeholder="Enter patient ID"
        className="h-10"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="age" className="flex items-center gap-2 h-5">
        Age
        {age && <Check className="h-4 w-4 text-green-600 font-bold stroke-[3]" />}
      </Label>
      <Input
        id="age"
        type="number"
        value={age}
        onChange={e => onAgeChange(e.target.value)}
        placeholder="Enter age"
        className="h-10"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="sex" className="block h-5">Sex</Label>
      <Select value={sex} onValueChange={val => onSexChange(val as "male" | "female")}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder="Select sex" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default PatientInfoForm;
