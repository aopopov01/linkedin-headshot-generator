import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003';

// Simple SVG icons since we don't have heroicons
const PhotoIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 7-7 7M12 3l7 7-7 7" />
  </svg>
);

const CloudIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('corporate');
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await axios.get(`${API_URL}/health`);
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
      setError('Backend API is not available. Please start the backend service.');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Create demo user and get token
      const authResponse = await axios.post(`${API_URL}/api/auth/demo-login`, {
        email: 'demo@example.com'
      });
      
      const token = authResponse.data.token;

      // Generate headshot
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('style_template', selectedStyle);
      formData.append('num_outputs', '4');

      const response = await axios.post(`${API_URL}/api/photos/generate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const photoId = response.data.data.id;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30;
      
      const pollStatus = async () => {
        try {
          const statusResponse = await axios.get(`${API_URL}/api/photos/${photoId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const status = statusResponse.data.data;
          
          if (status.processing_status === 'completed' && status.generated_images) {
            setGeneratedImages(status.generated_images);
            setIsGenerating(false);
            return;
          } else if (status.processing_status === 'failed') {
            throw new Error('Photo generation failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollStatus, 1000);
          } else {
            throw new Error('Generation timeout - please try again');
          }
        } catch (error) {
          setError(error.message);
          setIsGenerating(false);
        }
      };

      setTimeout(pollStatus, 2000);

    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Generation failed');
      setIsGenerating(false);
    }
  };

  const styles = [
    { key: 'corporate', name: 'Corporate', description: 'Professional business look' },
    { key: 'creative', name: 'Creative', description: 'Modern and approachable' },
    { key: 'executive', name: 'Executive', description: 'Leadership and authority' },
    { key: 'startup', name: 'Startup', description: 'Innovative and casual' },
    { key: 'healthcare', name: 'Healthcare', description: 'Trustworthy and caring' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            LinkedIn Headshot Generator
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
            Create professional headshots with AI in seconds
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            padding: '0.5rem 1rem', 
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginTop: '1rem',
            backgroundColor: apiStatus === 'connected' ? '#dcfce7' : apiStatus === 'disconnected' ? '#fef2f2' : '#fef3c7',
            color: apiStatus === 'connected' ? '#166534' : apiStatus === 'disconnected' ? '#991b1b' : '#92400e'
          }}>
            <div style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              marginRight: '0.5rem',
              backgroundColor: apiStatus === 'connected' ? '#4ade80' : apiStatus === 'disconnected' ? '#f87171' : '#fbbf24'
            }}></div>
            API Status: {apiStatus === 'connected' ? 'Connected' : 
                       apiStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1024px', margin: '0 auto' }}>
          
          {/* Upload Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              1. Upload Your Photo
            </h2>
            
            <div 
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ width: '8rem', height: '8rem', objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Click to change photo</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <PhotoIcon />
                  <div>
                    <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937' }}>Upload a selfie</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* Style Selection */}
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.75rem' }}>
                2. Choose Your Style
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {styles.map((style) => (
                  <label key={style.key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="style"
                      value={style.key}
                      checked={selectedStyle === style.key}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      style={{ width: '1rem', height: '1rem', marginRight: '0.75rem' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{style.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{style.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedFile || isGenerating || apiStatus !== 'connected'}
              style={{
                width: '100%',
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                color: 'white',
                backgroundColor: (!selectedFile || isGenerating || apiStatus !== 'connected') ? '#9ca3af' : '#4f46e5',
                border: 'none',
                cursor: (!selectedFile || isGenerating || apiStatus !== 'connected') ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {isGenerating ? (
                <>
                  <div style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    marginRight: '0.75rem',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  <span style={{ marginLeft: '0.5rem' }}>Generate Headshots</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              3. Your Professional Headshots
            </h2>

            {error && (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
              </div>
            )}

            {isGenerating && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '2rem',
                  height: '2rem',
                  border: '2px solid transparent',
                  borderBottom: '2px solid #4f46e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Creating your professional headshots...
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>This may take 30-60 seconds</p>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {generatedImages.map((image, index) => (
                  <div key={index} style={{ position: 'relative', group: true }}>
                    <img
                      src={image.url}
                      alt={`Generated headshot ${index + 1}`}
                      style={{ width: '100%', height: '10rem', objectFit: 'cover', borderRadius: '0.5rem' }}
                    />
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'white',
                        color: '#1f2937',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isGenerating && generatedImages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
                <CloudIcon />
                <p style={{ marginTop: '1rem' }}>Upload a photo and select a style to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem' }}>
            Why Choose Our AI Headshots?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', maxWidth: '1024px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <SparklesIcon />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '1rem 0 0.5rem' }}>AI-Powered</h3>
              <p style={{ color: '#6b7280' }}>Advanced AI creates professional headshots in seconds</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <PhotoIcon />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '1rem 0 0.5rem' }}>Multiple Styles</h3>
              <p style={{ color: '#6b7280' }}>Choose from 5 professional styles for any industry</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <CloudIcon />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '1rem 0 0.5rem' }}>Instant Results</h3>
              <p style={{ color: '#6b7280' }}>Get 4 high-quality headshots in under a minute</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;