import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
}

const DiagnosticTest = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    // List of endpoints to test
    const endpoints = [
      { name: 'Rate Limit', url: ENDPOINTS.TWITTER.RATE_LIMIT },
      { name: 'Tweets', url: ENDPOINTS.TWITTER.TWEETS },
      { 
        name: 'OpenAI Test', 
        url: ENDPOINTS.OPENAI.TEST, 
        method: 'post',
        data: {
          tweetText: 'This is a test tweet to validate the OpenAI integration'
        }
      }
    ];
    
    // Test each endpoint sequentially
    for (const endpoint of endpoints) {
      const newResult: TestResult = {
        endpoint: endpoint.name,
        status: 'loading'
      };
      
      setResults(prev => [...prev, newResult]);
      
      try {
        // Handle different HTTP methods
        let response;
        
        if (endpoint.method === 'post') {
          console.log(`Testing POST endpoint ${endpoint.name}:`, endpoint.url);
          console.log('Request data:', endpoint.data);
          response = await axios.post(endpoint.url, endpoint.data);
        } else {
          // Default to GET
          console.log(`Testing GET endpoint ${endpoint.name}:`, endpoint.url);
          response = await axios.get(endpoint.url, {
            params: { _t: new Date().getTime() }
          });
        }
        
        console.log(`${endpoint.name} SUCCESS:`, response.status, response.statusText);
        console.log(`${endpoint.name} RESPONSE:`, response.data);
        
        // Update with success
        setResults(prev => 
          prev.map(r => 
            r.endpoint === endpoint.name 
              ? { ...r, status: 'success', data: response.data } 
              : r
          )
        );
      } catch (err: any) {
        // Update with error
        setResults(prev => 
          prev.map(r => 
            r.endpoint === endpoint.name 
              ? { 
                  ...r, 
                  status: 'error', 
                  error: err.message || 'Unknown error',
                  data: err.response?.data 
                } 
              : r
          )
        );
      }
    }
    
    setIsRunning(false);
  };
  
  // Run the tests automatically on mount
  useEffect(() => {
    runTests();
  }, []);
  
  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '20px auto',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <h2>API Connection Diagnostic</h2>
      
      <button 
        onClick={runTests}
        disabled={isRunning}
        style={{
          padding: '8px 16px',
          backgroundColor: '#1d9bf0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'wait' : 'pointer',
          opacity: isRunning ? 0.7 : 1
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Tests Again'}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        {results.length === 0 && isRunning && (
          <p>Starting tests...</p>
        )}
        
        {results.map((result, index) => (
          <div key={index} style={{ 
            marginBottom: '15px',
            padding: '15px',
            borderRadius: '4px',
            backgroundColor: 
              result.status === 'success' ? '#e3f2fd' : 
              result.status === 'error' ? '#ffebee' : '#f5f5f5',
            border: 
              result.status === 'success' ? '1px solid #bbdefb' : 
              result.status === 'error' ? '1px solid #ffcdd2' : '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>
              {result.endpoint} 
              {result.status === 'loading' && ' - Testing...'}
              {result.status === 'success' && ' ✅'}
              {result.status === 'error' && ' ❌'}
            </h3>
            
            {result.status === 'success' && (
              <div>
                <p><strong>SUCCESS:</strong> Connection established</p>
                <details>
                  <summary>Response Data</summary>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f0f8ff', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflowX: 'auto' 
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {result.status === 'error' && (
              <div>
                <p><strong>ERROR:</strong> {result.error}</p>
                {result.data && (
                  <details>
                    <summary>Error Details</summary>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap',
                      backgroundColor: '#fff0f0', 
                      padding: '10px', 
                      borderRadius: '4px',
                      overflowX: 'auto' 
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
        <h3>Browser Information</h3>
        <ul>
          <li><strong>User Agent:</strong> {navigator.userAgent}</li>
          <li><strong>API Base URL:</strong> {ENDPOINTS.TWITTER.RATE_LIMIT.split('/api/')[0]}</li>
          <li><strong>Frontend URL:</strong> {window.location.href}</li>
        </ul>
      </div>
    </div>
  );
};

export default DiagnosticTest;
