
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle,
  Heart,
  Thermometer,
  Zap
} from "lucide-react";

interface ESP32StatusProps {
  status: {
    connected: boolean;
    deviceId: string;
    lastSeen: Date | null;
    sensorsActive: number;
    i2cEnabled: boolean;
    hasRecentData?: boolean;
  };
}

const ESP32StatusCard: React.FC<ESP32StatusProps> = ({ status }) => {
  // If there's no recent data, consider device disconnected
  const isConnected = status.connected && status.hasRecentData;
  
  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-purple-900/20 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
            </div>
            <span>AD8232 ECG Device Status</span>
          </div>
          <Badge 
            className={
              isConnected 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-8">
            <div className="p-4 bg-orange-500/10 rounded-full w-fit mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Device Connected
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Connect your AD8232 ECG sensor to start monitoring your heart rate and pulse data. 
              The device will automatically appear here once connected.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-slate-300">Heart Rate</span>
                </div>
                <div className="text-lg font-bold text-white">Active</div>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Pulse</span>
                </div>
                <div className="text-lg font-bold text-white">Active</div>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">Temperature</span>
                </div>
                <div className="text-lg font-bold text-white">Active</div>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">GSR</span>
                </div>
                <div className="text-lg font-bold text-white">Active</div>
              </div>
            </div>

            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">Device ID</span>
                <code className="text-blue-400 text-sm bg-slate-700/50 px-2 py-1 rounded">
                  {status.deviceId}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Last Seen</span>
                <span className="text-green-400 text-sm">
                  {status.lastSeen ? status.lastSeen.toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ESP32StatusCard;
