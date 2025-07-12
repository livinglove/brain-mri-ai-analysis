
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  // Helper function to get Z-score color and status text
  const getZScoreDisplay = (zScore: number | undefined): { color: string; text: string } => {
    if (zScore === undefined) return { color: '', text: '' };
    
    let status = '';
    let color = '';
    
    if (zScore <= -2) {
      status = 'Major Atrophy';
      color = 'text-red-600 font-semibold';
    } else if (zScore <= -1) {
      status = 'Atrophy';
      color = 'text-red-500';
    } else if (zScore >= 2) {
      status = 'Major Enlargement';
      color = 'text-orange-600 font-semibold';
    } else if (zScore >= 1) {
      status = 'Enlargement';
      color = 'text-orange-500';
    } else {
      status = `Z: ${zScore > 0 ? '+' : ''}${zScore}`;
      color = 'text-green-600';
    }
    
    return { color, text: status };
  };

  const zScoreDisplay = getZScoreDisplay(region.zScore);

  return (
    <div className="grid grid-cols-12 gap-3 items-center p-3 border-b border-gray-100 w-full">
      {/* Region Name */}
      <div className="col-span-1 font-medium text-xs text-left">{region.name}</div>
      
      {/* LH Volume */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          placeholder="LH"
          value={region.leftVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'leftVolume', e.target.value)}
          className={`text-center text-xs h-8 w-full ${lhColor}`}
        />
      </div>
      
      {/* RH Volume */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          placeholder="RH"
          value={region.rightVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'rightVolume', e.target.value)}
          className={`text-center text-xs h-8 w-full ${rhColor}`}
        />
      </div>
      
      {/* Total Volume */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Total"
          value={region.totalVolume?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'totalVolume', e.target.value)}
          className="text-center text-xs h-8 w-full bg-gray-50"
        />
      </div>
      
      {/* Normative Value with Age Adjusted Badge */}
      <div className="col-span-2 relative">
        <Input
          type="number"
          step="0.01"
          placeholder="Norm"
          value={region.normativeValue?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'normativeValue', e.target.value)}
          className="text-center text-xs h-8 w-full"
        />
        {region.ageAdjusted && (
          <Badge variant="secondary" className="absolute -top-2 -right-1 text-xs px-1 py-0 h-4">
            Age-Adj
          </Badge>
        )}
      </div>
      
      {/* Standard Deviation */}
      <div className="col-span-1">
        <Input
          type="number"
          step="0.001"
          placeholder="SD"
          value={region.standardDeviation?.toString() || ''}
          onChange={(e) => onRegionChange(index, 'standardDeviation', e.target.value)}
          className="text-center text-xs h-8 w-full"
        />
      </div>
      
      {/* Z-Score Display with status */}
      <div className="col-span-2 text-center">
        <span className={`text-xs ${zScoreDisplay.color}`}>
          {zScoreDisplay.text}
        </span>
      </div>
    </div>
  );
};

export default BrainRegionInputRow;
