
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter
} from "lucide-react";

const HistoricalData: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');

  // Generate sample historical data
  const generateHistoricalData = (hours: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseStress = 0.3 + Math.sin(i / 8) * 0.2; // Daily rhythm
      const noise = (Math.random() - 0.5) * 0.3;
      const stressLevel = Math.max(0, Math.min(1, baseStress + noise));
      
      data.push({
        time: time.toISOString(),
        timestamp: time.getTime(),
        stress: stressLevel * 100,
        bvp: 50 + Math.random() * 30,
        eda: 40 + Math.random() * 40,
        temp: 35 + Math.random() * 5,
        hr: 60 + Math.random() * 40,
        quality: 85 + Math.random() * 15,
        status: stressLevel < 0.3 ? 'low' : stressLevel < 0.6 ? 'moderate' : 'high'
      });
    }
    
    return data;
  };

  const data24h = generateHistoricalData(24);
  const data7d = generateHistoricalData(24 * 7);
  const data30d = generateHistoricalData(24 * 30);

  const getCurrentData = () => {
    switch (timeRange) {
      case '7d': return data7d;
      case '30d': return data30d;
      default: return data24h;
    }
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7d') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStressStats = () => {
    const currentData = getCurrentData();
    const stressLevels = currentData.map(d => d.stress);
    const avgStress = stressLevels.reduce((sum, val) => sum + val, 0) / stressLevels.length;
    const maxStress = Math.max(...stressLevels);
    const minStress = Math.min(...stressLevels);
    
    const highStressCount = currentData.filter(d => d.status === 'high').length;
    const moderateStressCount = currentData.filter(d => d.status === 'moderate').length;
    const lowStressCount = currentData.filter(d => d.status === 'low').length;
    
    return {
      average: avgStress,
      maximum: maxStress,
      minimum: minStress,
      highCount: highStressCount,
      moderateCount: moderateStressCount,
      lowCount: lowStressCount,
      totalSamples: currentData.length
    };
  };

  const stats = getStressStats();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Historical Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('24h')}
              >
                24 Hours
              </Button>
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.average.toFixed(1)}%</div>
            <div className="text-sm text-blue-600">Average Stress</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {stats.average > 50 ? 
                <TrendingUp className="w-4 h-4 text-red-500" /> : 
                <TrendingDown className="w-4 h-4 text-green-500" />
              }
              <span className="text-xs text-gray-600">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.maximum.toFixed(1)}%</div>
            <div className="text-sm text-red-600">Peak Stress</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-600">{stats.highCount} episodes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.minimum.toFixed(1)}%</div>
            <div className="text-sm text-green-600">Lowest Stress</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">{stats.lowCount} periods</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.totalSamples}</div>
            <div className="text-sm text-purple-600">Data Points</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600">{timeRange} range</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="stress" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="stress">Stress Levels</TabsTrigger>
          <TabsTrigger value="signals">All Signals</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="stress" className="space-y-4">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Stress Level Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getCurrentData()}>
                    <XAxis 
                      dataKey="time"
                      tickFormatter={formatXAxisLabel}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Stress Level']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="#ef4444"
                      fill="url(#stressGradient)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>All Physiological Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getCurrentData()}>
                    <XAxis 
                      dataKey="time"
                      tickFormatter={formatXAxisLabel}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} name="Stress %" />
                    <Line type="monotone" dataKey="bvp" stroke="#3b82f6" strokeWidth={1} name="BVP" />
                    <Line type="monotone" dataKey="eda" stroke="#10b981" strokeWidth={1} name="EDA" />
                    <Line type="monotone" dataKey="hr" stroke="#8b5cf6" strokeWidth={1} name="HR" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Stress Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <h4 className="text-lg font-semibold mb-4">Status Distribution</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Low', count: stats.lowCount, color: '#10b981' },
                      { name: 'Moderate', count: stats.moderateCount, color: '#f59e0b' },
                      { name: 'High', count: stats.highCount, color: '#ef4444' }
                    ]}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Time Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>Low Stress</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{((stats.lowCount / stats.totalSamples) * 100).toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">{stats.lowCount} periods</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span>Moderate Stress</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{((stats.moderateCount / stats.totalSamples) * 100).toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">{stats.moderateCount} periods</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>High Stress</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{((stats.highCount / stats.totalSamples) * 100).toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">{stats.highCount} periods</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Pattern Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Daily Patterns</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Morning (6-12 PM)</span>
                        <Badge className="bg-green-100 text-green-800">Low Stress</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">Afternoon (12-6 PM)</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">Evening (6-12 AM)</span>
                        <Badge className="bg-red-100 text-red-800">Variable</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Night (12-6 AM)</span>
                        <Badge className="bg-green-100 text-green-800">Low Stress</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Key Insights</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800">Peak Stress Times</p>
                        <p className="text-gray-600">Typically between 2-4 PM and 8-10 PM</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800">Recovery Periods</p>
                        <p className="text-gray-600">Most effective recovery during 10 PM - 6 AM</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800">Consistency</p>
                        <p className="text-gray-600">Stress patterns show {timeRange === '24h' ? 'hourly' : 'daily'} regularity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalData;
