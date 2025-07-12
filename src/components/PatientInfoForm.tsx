
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
      <Label htmlFor="patient-id">Patient ID</Label>
      <Input
        id="patient-id"
        value={patientId}
        onChange={e => onPatientIdChange(e.target.value)}
        placeholder="Enter patient ID"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="age" className="flex items-center gap-2">
        Age
        {age && <Check className="h-4 w-4 text-green-600" />}
      </Label>
      <Input
        id="age"
        type="number"
        value={age}
        onChange={e => onAgeChange(e.target.value)}
        placeholder="Enter age"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="sex">Sex</Label>
      <Select value={sex} onValueChange={val => onSexChange(val as "male" | "female")}>
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
);

export default PatientInfoForm;
