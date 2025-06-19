import React, { useState, useEffect } from 'react';
import { Send, Key, Bot, Upload, File, X, CheckCircle, AlertCircle, Sparkles, Shield, Zap } from 'lucide-react';

const PolicyChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [modelType, setModelType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [typing, setTyping] = useState(false);

  const handleModelSelect = (type) => {
    setModelType(type);
    setShowApiInput(type === 'closed');
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;

    setLoading(true);
    setTyping(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: inputMessage }]);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/rag/?query=${encodeURIComponent(inputMessage)}`,
        {
          method: 'GET',
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      // Simulate typing effect
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
        setTyping(false);
      }, 1000);
      
    } catch (error) {
      setError('Sorry, there was an error processing your request.');
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'Sorry, there was an error processing your request.' },
      ]);
      setTyping(false);
    } finally {
      setLoading(false);
      setInputMessage('');
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploadLoading(true);
    setError(null);

    const uploadPromises = Array.from(files).map(async (file) => {
      if (file.type !== 'application/pdf') {
        throw new Error(`${file.name} is not a PDF file`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const data = await response.json();
      return { name: file.name, status: 'success', message: data.message };
    });

    try {
      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);
      setShowUploadModal(false);
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!modelType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                PARAG
              </h1>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your intelligent AI-powered policy assistant. Upload documents, ask questions, and get instant insights about your organization's policies.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Powered by advanced AI technology</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div
              className="group p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-300 border border-white/20"
              onClick={() => handleModelSelect('open')}
            >
              <div className="space-y-6 text-center">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto w-fit shadow-lg group-hover:shadow-xl transition-shadow">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Open Source Model</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Use our powerful default open source model for instant policy insights
                  </p>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  ✨ Ready to use • No setup required
                </div>
              </div>
            </div>

            <div
              className="group p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-300 border border-white/20"
              onClick={() => handleModelSelect('closed')}
            >
              <div className="space-y-6 text-center">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto w-fit shadow-lg group-hover:shadow-xl transition-shadow">
                    <Key className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Premium Model</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Connect your own API key for enhanced capabilities and performance
                  </p>
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  🚀 Enhanced features • Custom API
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">AI Assistant Online</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PARAG
            </h1>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload PDF</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {showApiInput && !apiKey && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <input
                type="password"
                placeholder="Enter your API key"
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
                onClick={() => setShowApiInput(false)}
              >
                Save Key
              </button>
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="space-y-4">
              <p className="font-semibold text-green-800 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Successfully Uploaded Files:</span>
              </p>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <File className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeUploadedFile(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 min-h-[600px] flex flex-col overflow-hidden">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto w-fit">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">How can I help you today?</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Ask me anything about your organization's policies. I'm here to provide detailed insights and answers.
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : message.role === 'system'
                      ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                    </div>
                  )}
                  <div className="leading-relaxed">{message.content}</div>
                </div>
              </div>
            ))}
            
            {typing && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-gray-500 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-6 bg-gray-50/50">
            <div className="flex space-x-4">
              <input
                type="text"
                className="flex-1 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="Ask about your organization's policies..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                onClick={handleSubmit}
                disabled={loading || !inputMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl transform animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Upload PDF Files</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                disabled={uploadLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto w-fit">
                  <File className="w-12 h-12 text-white" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {dragActive ? 'Drop your files here' : 'Drag and drop PDF files here'}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">or</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploadLoading}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    uploadLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''
                  }`}
                >
                  {uploadLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Choose Files
                    </>
                  )}
                </label>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Only PDF files are supported • Maximum file size: 10MB
            </p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PolicyChat;
