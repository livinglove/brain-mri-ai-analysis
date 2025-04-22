
import React from "react";
import { BrainRegion } from "@/types/brainData";
import BrainRegionInputRow from "./BrainRegionInputRow";

interface BrainRegionInputTableProps {
  regions: BrainRegion[];
  lhColor: string;
  rhColor: string;
  onRegionChange: (idx: number, field: keyof BrainRegion, v: string) => void;
}

const BrainRegionInputTable: React.FC<BrainRegionInputTableProps> = ({
  regions, lhColor, rhColor, onRegionChange
}) => (
  <div className="space-y-4 mt-6">
    <div className="grid grid-cols-12 gap-4 font-bold text-sm bg-gray-100 p-2 rounded">
      <div className="col-span-3">Brain Region</div>
      <div className="col-span-2">Left (cm³)</div>
      <div className="col-span-2">Right (cm³)</div>
      <div className="col-span-2">Total (cm³)</div>
      <div className="col-span-2">Norm (cm³)</div>
      <div className="col-span-1">SD</div>
    </div>
    {regions.map((region, i) => 
      <BrainRegionInputRow
        key={`region-input-${i}`}
        region={region}
        index={i}
        lhColor={lhColor}
        rhColor={rhColor}
        onChange={onRegionChange}
      />
    )}
  </div>
);

export default BrainRegionInputTable;
