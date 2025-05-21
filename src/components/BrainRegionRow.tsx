
import React from "react";
import { Input } from "@/components/ui/input";
import { BrainRegion } from "@/types/brainData";

interface BrainRegionRowProps {
  region: BrainRegion;
  index: number;
  lhColor: string;
  rhColor: string;
  handleRegionChange: (index: number, field: keyof BrainRegion, value: string) => void;
}

const BrainRegionRow: React.FC<BrainRegionRowProps> = ({
  region, index, lhColor, rhColor, handleRegionChange,
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
          onChange={e => handleRegionChange(index, "leftVolume", e.target.value)}
          placeholder="Left"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          className={rhColor}
          value={region.rightVolume === undefined ? '' : region.rightVolume}
          onChange={e => handleRegionChange(index, "rightVolume", e.target.value)}
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
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          value={region.normativeValue}
          onChange={e => handleRegionChange(index, "normativeValue", e.target.value)}
          placeholder="Norm"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          value={region.standardDeviation}
          onChange={e => handleRegionChange(index, "standardDeviation", e.target.value)}
          placeholder="SD"
        />
      </div>
    </div>
  );
};

export default BrainRegionRow;
