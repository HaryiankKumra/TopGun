
# ESP32 Sensor Data JSON Format

## Endpoint
```
POST https://oknvpipzzgfufvqssauz.supabase.co/functions/v1/receive-sensor-data
```

## Headers
```
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY]
```

## JSON Payload Format

### Complete JSON Structure
```json
{
  "user_id": "cd85c225-fc57-4f51-be37-a9790faf0d3a",
  "timestamp": "2025-07-08T12:30:45.123Z",
  
  "temperature": 36.8,
  "ambient_temperature": 23.5,
  
  "gsr_value": 1250.75,
  "gsr_baseline": 1000,
  "gsr_change": 250,
  
  "raw_ecg_signal": 2048,
  "heart_rate": 72,
  "leads_off_detected": false,
  "heart_rate_variability": 45.6,
  "arrhythmia_detected": false,
  
  "device_status": {
    "battery_level": 85,
    "wifi_strength": -45,
    "sensors_active": ["MLX90614", "GSR", "AD8232"],
    "i2c_enabled": true,
    "sample_rate": 100,
    "firmware_version": "v1.2.3"
  }
}
```

### Field Descriptions

#### MLX90614 Temperature Sensor
- `temperature` (float): Body temperature in Celsius (±0.5°C accuracy)
- `ambient_temperature` (float): Environmental temperature in Celsius

#### Technotix GSR Sensor
- `gsr_value` (float): Raw GSR analog reading (0-4095 range)
- `gsr_baseline` (integer): Calibrated baseline GSR value
- `gsr_change` (integer): Difference from baseline (stress indicator)

#### AD8232 ECG Sensor
- `raw_ecg_signal` (integer): Raw ECG waveform analog value (0-4095)
- `heart_rate` (integer): Calculated beats per minute
- `leads_off_detected` (boolean): Whether electrodes are properly connected
- `heart_rate_variability` (float): Beat-to-beat timing variation in milliseconds
- `arrhythmia_detected` (boolean): Whether irregular heartbeat detected

#### System Information
- `user_id` (string): User identifier (optional, defaults if not provided)
- `timestamp` (string): ISO 8601 timestamp (optional, server time used if not provided)
- `device_status` (object): Device status information (optional)

### Minimal Required JSON
```json
{
  "heart_rate": 72,
  "temperature": 36.8,
  "gsr_value": 1250
}
```

### Example ESP32 Arduino Code Snippet
```cpp
// Create JSON payload
DynamicJsonDocument doc(1024);
doc["user_id"] = USER_ID;
doc["timestamp"] = getISOTimestamp();

// MLX90614 readings
doc["temperature"] = mlx.readObjectTempC();
doc["ambient_temperature"] = mlx.readAmbientTempC();

// GSR readings
int gsrRaw = analogRead(GSR_PIN);
doc["gsr_value"] = gsrRaw;
doc["gsr_baseline"] = gsrBaseline;
doc["gsr_change"] = gsrRaw - gsrBaseline;

// AD8232 readings
int ecgRaw = analogRead(ECG_PIN);
doc["raw_ecg_signal"] = ecgRaw;
doc["heart_rate"] = calculateHeartRate();
doc["leads_off_detected"] = digitalRead(LO_PLUS) || digitalRead(LO_MINUS);
doc["heart_rate_variability"] = calculateHRV();
doc["arrhythmia_detected"] = detectArrhythmia();

// Device status
JsonObject status = doc.createNestedObject("device_status");
status["battery_level"] = getBatteryLevel();
status["wifi_strength"] = WiFi.RSSI();
status["sample_rate"] = SAMPLE_RATE;

// Send to endpoint
String jsonString;
serializeJson(doc, jsonString);
http.POST(jsonString);
```

### Response Format
```json
{
  "success": true,
  "message": "Enhanced sensor data received successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "stress_level": "low|moderate|high",
    "stress_score": 35,
    "timestamp": "2025-07-08T12:30:45.123Z"
  },
  "calculated_stress": {
    "score": 35,
    "level": "low"
  }
}
```
