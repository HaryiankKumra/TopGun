
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  FileText, 
  Calendar, 
  AlertCircle, 
  Heart, 
  Pill,
  Activity,
  Edit,
  Trash2,
  Search,
  Watch,
  Thermometer,
  Zap,
  RefreshCw
} from "lucide-react";

interface HealthRecord {
  id: string;
  condition: string;
  diagnosis_date: string;
  severity: string;
  status: string;
  symptoms: string[];
  medications: string[];
  notes: string | null;
  created_at: string;
}

interface WearableReading {
  id: string;
  heart_rate: number | null;
  temperature: number | null;
  gsr_value: number | null;
  raw_ecg_signal: number | null;
  stress_score: number | null;
  stress_level: string | null;
  facial_emotion: string | null;
  created_at: string;
}

const HealthRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wearableReadings, setWearableReadings] = useState<WearableReading[]>([]);
  const [isFetchingWearable, setIsFetchingWearable] = useState(false);
  const [newRecord, setNewRecord] = useState({
    condition: '',
    diagnosis_date: '',
    severity: 'mild',
    status: 'active',
    symptoms: '',
    medications: '',
    notes: ''
  });

  const severityColors = {
    mild: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    severe: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const statusColors = {
    active: 'bg-red-500/20 text-red-400 border-red-500/30',
    managed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  useEffect(() => {
    if (user) {
      fetchHealthRecords();
      fetchWearableReadings();
    }
  }, [user]);

  const fetchWearableReadings = async () => {
    if (!user) return;
    setIsFetchingWearable(true);
    try {
      const { data, error } = await (supabase as any)
        .from('biometric_data_enhanced')
        .select('id, heart_rate, temperature, gsr_value, raw_ecg_signal, stress_score, stress_level, facial_emotion, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setWearableReadings(data || []);
    } catch (error) {
      console.error('Error fetching wearable readings:', error);
    } finally {
      setIsFetchingWearable(false);
    }
  };

  const fetchHealthRecords = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords((data || []) as HealthRecord[]);
    } catch (error) {
      console.error('Error fetching health records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch health records.",
        variant: "destructive",
      });
    }
  };

  const saveRecord = async () => {
    if (!user || !newRecord.condition || !newRecord.diagnosis_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordData = {
        user_id: user.id,
        condition: newRecord.condition,
        diagnosis_date: newRecord.diagnosis_date,
        severity: newRecord.severity,
        status: newRecord.status,
        symptoms: newRecord.symptoms ? newRecord.symptoms.split(',').map(s => s.trim()) : [],
        medications: newRecord.medications ? newRecord.medications.split(',').map(m => m.trim()) : [],
        notes: newRecord.notes || null,
      };

      let error;
      if (editingRecord) {
        const { error: updateError } = await (supabase as any)
          .from('health_records')
          .update(recordData)
          .eq('id', editingRecord.id);
        error = updateError;
      } else {
        const { error: insertError } = await (supabase as any)
          .from('health_records')
          .insert(recordData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Health record ${editingRecord ? 'updated' : 'created'} successfully.`,
      });

      setIsDialogOpen(false);
      setEditingRecord(null);
      setNewRecord({
        condition: '',
        diagnosis_date: '',
        severity: 'mild',
        status: 'active',
        symptoms: '',
        medications: '',
        notes: ''
      });
      fetchHealthRecords();
    } catch (error) {
      console.error('Error saving health record:', error);
      toast({
        title: "Error",
        description: "Failed to save health record.",
        variant: "destructive",
      });
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('health_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Health record deleted successfully.",
      });
      fetchHealthRecords();
    } catch (error) {
      console.error('Error deleting health record:', error);
      toast({
        title: "Error",
        description: "Failed to delete health record.",
        variant: "destructive",
      });
    }
  };

  const editRecord = (record: HealthRecord) => {
    setEditingRecord(record);
    setNewRecord({
      condition: record.condition,
      diagnosis_date: record.diagnosis_date,
      severity: record.severity,
      status: record.status,
      symptoms: record.symptoms.join(', '),
      medications: record.medications.join(', '),
      notes: record.notes || ''
    });
    setIsDialogOpen(true);
  };

  const filteredRecords = records.filter(record =>
    record.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.symptoms.some(symptom => symptom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    record.medications.some(medication => medication.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Health Records</h1>
            <p className="text-slate-300">Manage your medical history and conditions</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Health Record
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Health Record</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Input
                      id="condition"
                      value={newRecord.condition}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, condition: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                      placeholder="e.g., Hypertension, Diabetes"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis_date">Diagnosis Date *</Label>
                    <Input
                      id="diagnosis_date"
                      type="date"
                      value={newRecord.diagnosis_date}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosis_date: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={newRecord.severity} onValueChange={(value) => setNewRecord(prev => ({ ...prev, severity: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newRecord.status} onValueChange={(value) => setNewRecord(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="managed">Managed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
                  <Input
                    id="symptoms"
                    value={newRecord.symptoms}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, symptoms: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                    placeholder="e.g., Headache, Fatigue, Dizziness"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medications">Medications (comma-separated)</Label>
                  <Input
                    id="medications"
                    value={newRecord.medications}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, medications: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                    placeholder="e.g., Lisinopril 10mg, Metformin 500mg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                    placeholder="Additional notes about the condition..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveRecord} className="bg-blue-600 hover:bg-blue-700">
                    {editingRecord ? 'Update' : 'Save'} Record
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search health records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Records Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    <CardTitle className="text-white text-lg">{record.condition}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editRecord(record)}
                      className="h-8 w-8 p-0 hover:bg-blue-600/20"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRecord(record.id)}
                      className="h-8 w-8 p-0 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="w-4 h-4" />
                  Diagnosed: {new Date(record.diagnosis_date).toLocaleDateString()}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={severityColors[record.severity as keyof typeof severityColors]}>
                    {record.severity}
                  </Badge>
                  <Badge className={statusColors[record.status as keyof typeof statusColors]}>
                    {record.status}
                  </Badge>
                </div>

                {record.symptoms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Symptoms
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {record.symptoms.slice(0, 3).map((symptom, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-slate-400 border-slate-600">
                          {symptom}
                        </Badge>
                      ))}
                      {record.symptoms.length > 3 && (
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          +{record.symptoms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {record.medications.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <Pill className="w-4 h-4" />
                      Medications
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {record.medications.slice(0, 2).map((medication, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-slate-400 border-slate-600">
                          {medication}
                        </Badge>
                      ))}
                      {record.medications.length > 2 && (
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          +{record.medications.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-1">
                      <FileText className="w-4 h-4" />
                      Notes
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{record.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Health Records Found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? 'No records match your search criteria.' : 'Start by adding your first health record.'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Health Record
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wearable Readings */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Watch className="w-5 h-5 text-green-400" />
                Wearable Sensor Readings
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchWearableReadings}
                disabled={isFetchingWearable}
                className="border-slate-600 text-slate-300"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isFetchingWearable ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {wearableReadings.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                No wearable data found for your account. Connect your ESP32 to start recording.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left pb-2 pr-4">Time</th>
                      <th className="text-left pb-2 pr-4"><Heart className="w-3 h-3 inline mr-1 text-red-400" />HR</th>
                      <th className="text-left pb-2 pr-4"><Thermometer className="w-3 h-3 inline mr-1 text-orange-400" />Temp</th>
                      <th className="text-left pb-2 pr-4"><Zap className="w-3 h-3 inline mr-1 text-purple-400" />EDA</th>
                      <th className="text-left pb-2 pr-4">Stress</th>
                      <th className="text-left pb-2">Emotion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wearableReadings.map((r) => (
                      <tr key={r.id} className="border-b border-slate-700/50 text-slate-300">
                        <td className="py-2 pr-4 text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">{r.heart_rate ?? '--'} <span className="text-slate-500">bpm</span></td>
                        <td className="py-2 pr-4">{r.temperature?.toFixed(1) ?? '--'} <span className="text-slate-500">°C</span></td>
                        <td className="py-2 pr-4">{r.gsr_value?.toFixed(0) ?? '--'} <span className="text-slate-500">Ω</span></td>
                        <td className="py-2 pr-4">
                          {r.stress_score !== null ? (
                            <Badge className={r.stress_score > 60 ? 'bg-red-500/20 text-red-400' : r.stress_score > 30 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                              {r.stress_score}%
                            </Badge>
                          ) : '--'}
                        </td>
                        <td className="py-2 capitalize">{r.facial_emotion ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ESP32 Connection Info */}
        <Card className="bg-blue-500/10 border-blue-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              ESP32 Integration Guide
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <h4 className="text-blue-300 font-medium">1. Hardware Setup:</h4>
                <p>Connect sensors to your ESP32: Heart Rate (A0), Temperature (D2), GSR (A1)</p>
              </div>
              <div>
                <h4 className="text-blue-300 font-medium">2. User Authentication:</h4>
                <p>Include user ID in your ESP32 code: <code className="text-purple-400 bg-slate-800 px-2 py-1 rounded">user_id: "{user?.id || 'YOUR_USER_ID'}"</code></p>
              </div>
              <div>
                <h4 className="text-blue-300 font-medium">3. API Endpoint:</h4>
                <p>POST to: <code className="text-purple-400 bg-slate-800 px-2 py-1 rounded">https://ogrlozmfbkotgdcnlobo.supabase.co/functions/v1/receive-sensor-data</code></p>
              </div>
              <div>
                <h4 className="text-blue-300 font-medium">4. Data Format:</h4>
                <pre className="bg-slate-800 p-3 rounded text-purple-400 text-xs overflow-x-auto">
{`{
  "user_id": "${user?.id || 'YOUR_USER_ID'}",
  "heart_rate": 75,
  "temperature": 36.5,
  "gsr_value": 450,
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthRecordsPage;
