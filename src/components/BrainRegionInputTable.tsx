
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
  <div className="space-y-2 mt-6">
    <div className="grid grid-cols-12 gap-4 font-bold text-sm bg-gray-100 p-3 rounded">
      <div className="col-span-2 text-left">Brain Region</div>
      <div className="col-span-1 text-center">Left (cm³)</div>
      <div className="col-span-1 text-center">Right (cm³)</div>
      <div className="col-span-1 text-center">Total (cm³)</div>
      <div className="col-span-1 text-center">Norm (cm³)</div>
      <div className="col-span-1 text-center">SD</div>
      <div className="col-span-2 text-center">Z-Score</div>
      <div className="col-span-3 text-center">Status</div>
    </div>
    {regions.map((region, i) => 
      <BrainRegionInputRow
        key={`region-input-${i}`}
        region={region}
        index={i}
        lhColor={lhColor}
        rhColor={rhColor}
        onRegionChange={onRegionChange}
      />
    )}
  </div>
);

export default BrainRegionInputTable;
