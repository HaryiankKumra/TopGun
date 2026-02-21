#!/usr/bin/env node

/**
 * Test script for Hugging Face Wearable Stress Detection API
 * Tests: Haryiank/stress-detector
 * 
 * Usage: node test-wearable-api.js
 */

const WEARABLE_STRESS_API = "https://Haryiank-stress-detector.hf.space";

// Generate sample sensor data
function generateSampleData() {
  // ECG: 700 samples (simulated ECG waveform)
  const ecgSamples = [];
  for (let i = 0; i < 700; i++) {
    // Simulate ECG waveform with some variation
    const base = 2048; // Typical ADC midpoint
    const signal = Math.sin(i * 0.1) * 200 + Math.sin(i * 0.05) * 100;
    const noise = (Math.random() - 0.5) * 50;
    ecgSamples.push(Math.round(base + signal + noise));
  }
  
  // EDA: 20 samples (GSR values)
  const edaSamples = [];
  for (let i = 0; i < 20; i++) {
    // Simulate GSR values (typically 0-4095)
    const base = 1000;
    const variation = (Math.random() - 0.5) * 200;
    edaSamples.push(Math.round(base + variation));
  }
  
  // TEMP: 20 samples (temperature in Celsius)
  const tempSamples = [];
  for (let i = 0; i < 20; i++) {
    // Simulate body temperature (36.0-37.5°C)
    const base = 36.5;
    const variation = (Math.random() - 0.5) * 0.5;
    tempSamples.push(parseFloat((base + variation).toFixed(2)));
  }
  
  return { ecgSamples, edaSamples, tempSamples };
}

// Format as comma-separated strings
function formatSignals(ecg, eda, temp) {
  return {
    ecgStr: ecg.map(v => v.toString()).join(','),
    edaStr: eda.map(v => v.toString()).join(','),
    tempStr: temp.map(v => v.toString()).join(',')
  };
}

async function testAPI() {
  console.log('🧪 Testing Hugging Face Wearable Stress Detection API');
  console.log('=' .repeat(60));
  console.log(`📍 Endpoint: ${WEARABLE_STRESS_API}/api/predict`);
  console.log('');
  
  // Generate sample data
  const { ecgSamples, edaSamples, tempSamples } = generateSampleData();
  const { ecgStr, edaStr, tempStr } = formatSignals(ecgSamples, edaSamples, tempSamples);
  
  console.log('📊 Sample Data Generated:');
  console.log(`   ECG samples: ${ecgSamples.length} (first 5: ${ecgSamples.slice(0, 5).join(', ')})`);
  console.log(`   EDA samples: ${edaSamples.length} (values: ${edaSamples.join(', ')})`);
  console.log(`   TEMP samples: ${tempSamples.length} (values: ${tempSamples.join(', ')})`);
  console.log('');
  
  // Test 1: Check if Space is awake
  console.log('1️⃣ Checking if Space is awake...');
  try {
    const healthCheck = await fetch(WEARABLE_STRESS_API);
    if (healthCheck.ok) {
      console.log('   ✅ Space is accessible (HTTP ' + healthCheck.status + ')');
    } else {
      console.log('   ⚠️  Space returned HTTP ' + healthCheck.status);
      console.log('   💡 Open ' + WEARABLE_STRESS_API + ' in browser to wake it up');
    }
  } catch (error) {
    console.log('   ❌ Cannot reach Space:', error.message);
    console.log('   💡 Make sure the Space is public and accessible');
    return;
  }
  console.log('');
  
  // Test 2: Test API endpoint (try multiple formats)
  console.log('2️⃣ Testing API endpoints...');
  
  // Try Format 1: Gradio Client API format
  console.log('   Trying Format 1: /api/predict (Gradio Client format)...');
  try {
    const requestBody = {
      data: [ecgStr, edaStr, tempStr],
      api_name: "/predict"
    };
    
    console.log('   📤 Sending request...');
    console.log('   Request body size:');
    console.log(`      ECG string length: ${ecgStr.length} chars`);
    console.log(`      EDA string length: ${edaStr.length} chars`);
    console.log(`      TEMP string length: ${tempStr.length} chars`);
    
    const startTime = Date.now();
    const response = await fetch(`${WEARABLE_STRESS_API}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`   ⏱️  Response time: ${responseTime}ms`);
    console.log(`   📥 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Format 1 failed: ${response.status} - ${errorText.substring(0, 200)}`);
      console.log('');
      
      // Try Format 2: Gradio Queue API format
      console.log('   Trying Format 2: /queue/push (Gradio Queue format)...');
      try {
        const queueResponse = await fetch(`${WEARABLE_STRESS_API}/queue/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [ecgStr, edaStr, tempStr],
            event_data: null,
            fn_index: 0
          }),
        });
        
        if (queueResponse.ok) {
          const queueResult = await queueResponse.json();
          console.log('   ✅ Format 2 succeeded!');
          console.log('   Response: ' + JSON.stringify(queueResult, null, 2).substring(0, 500));
          return;
        } else {
          const queueError = await queueResponse.text();
          console.log(`   ❌ Format 2 failed: ${queueResponse.status} - ${queueError.substring(0, 200)}`);
        }
      } catch (queueErr) {
        console.log('   ❌ Format 2 error: ' + queueErr.message);
      }
      
      // Try Format 3: Direct Gradio API
      console.log('');
      console.log('   Trying Format 3: /gradio_api/call/predict (Gradio API format)...');
      try {
        const gradioResponse = await fetch(`${WEARABLE_STRESS_API}/gradio_api/call/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [ecgStr, edaStr, tempStr]
          }),
        });
        
        if (gradioResponse.ok) {
          const gradioResult = await gradioResponse.json();
          console.log('   ✅ Format 3 request accepted!');
          console.log('   Event ID: ' + gradioResult.event_id);
          
          // Poll for result (Gradio async pattern)
          console.log('   ⏳ Polling for result...');
          const eventId = gradioResult.event_id;
          let attempts = 0;
          const maxAttempts = 30;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            attempts++;
            
            try {
              const resultResponse = await fetch(`${WEARABLE_STRESS_API}/gradio_api/call/predict/${eventId}`);
              const resultText = await resultResponse.text();
              
              // Parse SSE response
              const dataMatch = resultText.match(/data:\s*(\[.*\])/);
              if (dataMatch) {
                const resultData = JSON.parse(dataMatch[1]);
                console.log('   ✅ Result received!');
                console.log('   Prediction: ' + JSON.stringify(resultData, null, 2));
                return;
              } else if (resultText.includes('"status":"COMPLETE"')) {
                // Try parsing as JSON
                try {
                  const jsonResult = JSON.parse(resultText);
                  console.log('   ✅ Result received!');
                  console.log('   Prediction: ' + JSON.stringify(jsonResult, null, 2));
                  return;
                } catch (e) {
                  // Continue polling
                }
              }
              
              if (attempts % 5 === 0) {
                console.log(`   ⏳ Still waiting... (${attempts}/${maxAttempts} attempts)`);
              }
            } catch (pollErr) {
              // Continue polling
            }
          }
          
          console.log('   ⚠️  Timeout waiting for result');
        } else {
          const gradioError = await gradioResponse.text();
          console.log(`   ❌ Format 3 failed: ${gradioResponse.status} - ${gradioError.substring(0, 200)}`);
        }
      } catch (gradioErr) {
        console.log('   ❌ Format 3 error: ' + gradioErr.message);
      }
      
      console.log('');
      console.log('❌ All API formats failed. Please check:');
      console.log('   1. The Space URL is correct');
      console.log('   2. The Space is public and running');
      console.log('   3. Check the Space API documentation');
      return;
    }
    
    const result = await response.json();
    console.log('');
    console.log('   ✅ API Response received:');
    console.log('   ' + JSON.stringify(result, null, 2).substring(0, 500));
    console.log('');
    
    // Parse result
    let prediction = '';
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      prediction = result.data[0];
    } else if (typeof result === 'string') {
      prediction = result;
    } else {
      prediction = JSON.stringify(result);
    }
    
    const isStressed = prediction.toLowerCase().includes('stress') && 
                       !prediction.toLowerCase().includes('not stressed') &&
                       !prediction.toLowerCase().includes('non-stress');
    
    console.log('3️⃣ Result Analysis:');
    console.log(`   Prediction: ${prediction}`);
    console.log(`   Detected as: ${isStressed ? 'Stressed' : 'Not Stressed'}`);
    console.log('');
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.log('');
    console.log('   ❌ API Call Failed:');
    console.log('   ' + error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure the Space is awake (open in browser)');
    console.log('   2. Check if the Space is public');
    console.log('   3. Verify the API endpoint format');
    console.log('   4. Check network connectivity');
  }
}

// Run test
testAPI().catch(console.error);
