import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const toneFor = (score) => (score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--destructive)');

/**
 * Shared circular score gauge — replaces the near-identical hand-rolled SVG
 * semi-circle arcs previously duplicated in Dashboard.jsx and ProposalDetails.jsx.
 */
const ScoreGauge = ({ score = 0, label = 'Score', size = 140 }) => {
  const value = Math.max(0, Math.min(100, score));
  const tone = toneFor(value);
  const data = [{ value, fill: tone }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: 'var(--muted)' }} dataKey="value" cornerRadius={6} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-2xl font-extrabold leading-none" style={{ color: tone }}>{Math.round(value)}%</p>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 text-muted-foreground">{label}</p>
    </div>
  );
};

export default ScoreGauge;
