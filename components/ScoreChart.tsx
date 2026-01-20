import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ScoreChartProps {
  score: number;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ score }) => {
  const data = [{ name: 'Score', value: score }];
  
  // Color calculation based on score
  let color = '#22c55e'; // Green
  if (score < 50) color = '#ef4444'; // Red
  else if (score < 80) color = '#eab308'; // Yellow

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="70%" 
          outerRadius="100%" 
          barSize={10} 
          data={data} 
          startAngle={180} 
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={30 / 2}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[10%] text-center">
        <span className="text-4xl font-bold text-slate-100">{score}</span>
        <span className="block text-xs text-slate-400 uppercase tracking-wider mt-1">Security Score</span>
      </div>
    </div>
  );
};

export default ScoreChart;