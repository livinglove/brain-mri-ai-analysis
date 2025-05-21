
import React from "react";
import { Input } from "@/components/ui/input";
import { BrainRegion } from "@/types/brainData";
import { Badge } from "@/components/ui/badge";

interface BrainRegionInputRowProps {
  region: BrainRegion;
  index: number;
  lhColor: string;
  rhColor: string;
  onChange: (index: number, field: keyof BrainRegion, value: string) => void;
}

const BrainRegionInputRow: React.FC<BrainRegionInputRowProps> = ({
  region, index, lhColor, rhColor, onChange,
}) => {
  const getZScoreColor = (zScore?: number) => {
    if (zScore === undefined) return "";
    if (zScore <= -2) return "text-red-600 font-medium";
    if (zScore >= 2) return "text-yellow-600 font-medium";
    return "text-green-600";
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-3 flex items-center">
        <span>{region.name}</span>
        {region.zScore !== undefined && (
          <span className={`ml-2 text-xs ${getZScoreColor(region.zScore)}`}>
            (Z: {region.zScore > 0 ? '+' : ''}{region.zScore})
          </span>
        )}
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          className={lhColor}
          value={region.leftVolume === undefined ? '' : region.leftVolume}
          onChange={e => onChange(index, "leftVolume", e.target.value)}
          placeholder="Left"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          className={rhColor}
          value={region.rightVolume === undefined ? '' : region.rightVolume}
          onChange={e => onChange(index, "rightVolume", e.target.value)}
          placeholder="Right"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          value={region.totalVolume === undefined ? '' : region.totalVolume}
          disabled
          placeholder="Total"
        />
      </div>
      <div className="col-span-2 relative">
        <Input
          type="number"
          step="0.01"
          value={region.normativeValue}
          onChange={e => onChange(index, "normativeValue", e.target.value)}
          placeholder="Norm"
          className={region.ageAdjusted ? "border-green-500" : ""}
        />
        {region.ageAdjusted && (
          <Badge className="absolute -top-2 -right-2 bg-green-500" variant="outline">
            Age adjusted
          </Badge>
        )}
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          value={region.standardDeviation}
          onChange={e => onChange(index, "standardDeviation", e.target.value)}
          placeholder="SD"
        />
      </div>
    </div>
  );
};

export default BrainRegionInputRow;
