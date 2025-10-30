
import React from 'react';

interface IntentGaugeProps {
  score: number;
}

const IntentGauge: React.FC<IntentGaugeProps> = ({ score }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getColor = () => {
    if (normalizedScore < 40) return 'text-red-500';
    if (normalizedScore < 70) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const colorClass = getColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-slate-200"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-3xl font-bold ${colorClass}`}>{normalizedScore}</span>
      </div>
    </div>
  );
};

export default IntentGauge;
