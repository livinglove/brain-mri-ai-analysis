
import React from 'react';
import { Input } from '@/components/ui/input';
import { BrainRegion } from '@/types/brainData';

interface BrainRegionInputRowProps {
  region: BrainRegion;
  index: number;
  lhColor: string;
  rhColor: string;
  onRegionChange: (index: number, field: keyof BrainRegion, value: string) => void;
}

const BrainRegionInputRow: React.FC<BrainRegionInputRowProps> = ({
  region,
  index,
  lhColor,
  rhColor,
  onRegionChange
}) => {
  // Helper function to get Z-score color
  const getZScoreColor = (zScore: number | undefined): string => {
    if (zScore === undefined) return '';
    if (zScore <= -2) return 'text-red-600 font-semibold'; // Atrophied (red)
    if (zScore >= 2) return 'text-orange-600 font-semibold'; // Enlarged (orange/yellow)
    return 'text-green-600'; // Normal (green)
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100">
      {/* Region Name */}
      <div className="col-span-2 font-medium text-sm">{region.name}</div>
      
      {/* LH Volume */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          placeholder="LH"
          value={region.leftVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'leftVolume', e.target.value)}
          className={`text-center ${lhColor}`}
        />
      </div>
      
      {/* RH Volume */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          placeholder="RH"
          value={region.rightVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'rightVolume', e.target.value)}
          className={`text-center ${rhColor}`}
        />
      </div>
      
      {/* Total Volume */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          placeholder="Total"
          value={region.totalVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'totalVolume', e.target.value)}
          className="text-center bg-gray-50"
        />
      </div>
      
      {/* Normative Value */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          placeholder="Norm"
          value={region.normativeValue?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'normativeValue', e.target.value)}
          className="text-center"
        />
      </div>
      
      {/* Standard Deviation */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.001"
          placeholder="SD"
          value={region.standardDeviation?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'standardDeviation', e.target.value)}
          className="text-center"
        />
      </div>
      
      {/* Z-Score Display with correct coloring */}
      <div className="col-span-2 text-center">
        <span className={`text-sm ${getZScoreColor(region.zScore)}`}>
          {region.zScore !== undefined ? `Z: ${region.zScore > 0 ? '+' : ''}${region.zScore}` : ''}
        </span>
      </div>
      
      {/* Age Adjusted Indicator */}
      <div className="col-span-3 text-center">
        <span className="text-xs text-gray-500">
          {region.ageAdjusted ? '✓ Age-adjusted' : ''}
        </span>
      </div>
    </div>
  );
};

export default BrainRegionInputRow;
