
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
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
    
    const zScoreText = zScore > 0 ? `+${zScore}` : `${zScore}`;
    
    if (zScore <= -2) {
      return { color: 'text-red-600 font-bold', text: `${zScoreText} Atrophied` };
    } else if (zScore <= -1) {
      return { color: 'text-red-500', text: `${zScoreText} Atrophied` };
    } else if (zScore >= 2) {
      return { color: 'text-green-600 font-bold', text: `${zScoreText} Enlarged` };
    } else if (zScore >= 1) {
      return { color: 'text-green-500', text: `${zScoreText} Enlarged` };
    } else {
      return { color: 'text-gray-900', text: zScoreText };
    }
  };

  const zScoreDisplay = getZScoreDisplay(region.zScore);

  return (
    <div className="grid grid-cols-12 gap-3 items-center p-3 border-b border-gray-100 w-full">
      {/* Region Name */}
      <div className="col-span-2 font-medium text-xs text-left">{region.name}</div>
      
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
      
      {/* Normative Value with Age Adjusted Check */}
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
          <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-600 font-bold stroke-2" />
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
      <div className="col-span-1 text-center">
        <span className={`text-xs ${zScoreDisplay.color}`}>
          {zScoreDisplay.text}
        </span>
      </div>
    </div>
  );
};

export default BrainRegionInputRow;
