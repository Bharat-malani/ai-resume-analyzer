import React from 'react';

export default function ScoreRing({ score = 0, size = 120, strokeWidth = 10, label = 'ATS Score' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (clamped / 100) * circumference;

  let strokeColor = '#10B981'; // emerald-500
  let textColor = 'text-emerald-600';
  let badgeBg = 'bg-emerald-50 text-emerald-700';

  if (clamped < 60) {
    strokeColor = '#EF4444'; // rose-500
    textColor = 'text-rose-600';
    badgeBg = 'bg-rose-50 text-rose-700';
  } else if (clamped < 75) {
    strokeColor = '#F59E0B'; // amber-500
    textColor = 'text-amber-600';
    badgeBg = 'bg-amber-50 text-amber-700';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
            {clamped}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            / 100
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2 text-xs font-semibold text-slate-600">
          {label}
        </span>
      )}
    </div>
  );
}
