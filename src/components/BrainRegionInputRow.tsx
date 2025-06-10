
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
  // Helper function to get Z-score color - fixed logic
  const getZScoreColor = (zScore: number | undefined): string => {
    if (zScore === undefined) return '';
    console.log(`Z-score color check for region ${region.name}: Z-score = ${zScore}`);
    
    if (zScore <= -2) {
      console.log('Applying red color for Z <= -2');
      return 'text-red-600 font-semibold'; // Atrophied (red)
    }
    if (zScore >= 2) {
      console.log('Applying orange color for Z >= 2');
      return 'text-orange-600 font-semibold'; // Enlarged (orange)
    }
    if (zScore < 0) {
      console.log('Applying red color for negative Z-score');
      return 'text-red-600'; // Negative but not severely atrophied
    }
    console.log('Applying green color for normal/positive Z-score');
    return 'text-green-600'; // Normal/positive (green)
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center p-3 border-b border-gray-100">
      {/* Region Name */}
      <div className="col-span-2 font-medium text-sm text-left">{region.name}</div>
      
      {/* LH Volume */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.01"
          placeholder="LH"
          value={region.leftVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'leftVolume', e.target.value)}
          className={`text-center text-xs h-8 ${lhColor}`}
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
          className={`text-center text-xs h-8 ${rhColor}`}
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
          className="text-center text-xs h-8 bg-gray-50"
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
          className="text-center text-xs h-8"
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
          className="text-center text-xs h-8"
        />
      </div>
      
      {/* Z-Score Display with correct coloring */}
      <div className="col-span-2 text-center">
        <span className={`text-xs ${getZScoreColor(region.zScore)}`}>
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
