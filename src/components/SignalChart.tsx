
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SignalChartProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  quality: number;
  isActive: boolean;
}

const SignalChart: React.FC<SignalChartProps> = ({ title, icon, color, quality, isActive }) => {
  const [data, setData] = useState<Array<{ time: number; value: number }>>([]);

  // Generate realistic signal data
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const time = Date.now();
      let newValue = 0;

      // Generate different signal patterns based on title
      if (title.includes('BVP')) {
        newValue = Math.sin(time / 1000) * 0.5 + Math.random() * 0.3 + 0.2;
      } else if (title.includes('EDA')) {
        newValue = Math.cos(time / 2000) * 0.4 + Math.random() * 0.2 + 0.3;
      } else if (title.includes('Temperature')) {
        newValue = 36.5 + Math.sin(time / 5000) * 0.5 + Math.random() * 0.1;
      } else if (title.includes('Heart Rate')) {
        newValue = 70 + Math.sin(time / 800) * 10 + Math.random() * 5;
      }

      setData(prevData => {
        const newData = [...prevData, { time, value: newValue }];
        return newData.length > 50 ? newData.slice(-50) : newData;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isActive, title]);

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (quality >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-full bg-gray-100">
              {icon}
            </div>
            {title}
          </CardTitle>
          <Badge className={getQualityColor(quality)}>
            {quality.toFixed(0)}% Quality
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="time"
                  tickFormatter={formatTime}
                  domain={['dataMin', 'dataMax']}
                  hide
                />
                <YAxis hide />
                <Tooltip 
                  labelFormatter={(value) => formatTime(value as number)}
                  formatter={(value: number) => [value.toFixed(3), title]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {isActive ? 'Collecting data...' : 'Start monitoring to view signals'}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>Real-time signal</span>
          <span className={`flex items-center gap-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isActive ? 'Live' : 'Stopped'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalChart;
