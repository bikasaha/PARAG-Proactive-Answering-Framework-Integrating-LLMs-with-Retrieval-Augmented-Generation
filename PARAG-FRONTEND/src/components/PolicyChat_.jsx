import React, { useState } from 'react';
import { Send, Key, Bot } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const PolicyChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [modelType, setModelType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [error, setError] = useState(null);

  const handleModelSelect = (type) => {
    setModelType(type);
    setShowApiInput(type === 'closed');
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;

    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: inputMessage }]);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/rag/?query=${encodeURIComponent(inputMessage)}`,
        {
          method: 'GET', // Explicitly set the method to GET
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setError('Sorry, there was an error processing your request.');
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setLoading(false);
      setInputMessage('');
    }
  };

  if (!modelType) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">PARAG</h1>
            <p className="text-gray-600">Your AI-Powered Policy Assistant</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleModelSelect('open')}
            >
              <CardContent className="space-y-4 text-center">
                <Bot className="w-12 h-12 mx-auto text-blue-500" />
                <h2 className="text-xl font-semibold">Open Source Model</h2>
                <p className="text-gray-600">Use our default open source model</p>
              </CardContent>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleModelSelect('closed')}
            >
              <CardContent className="space-y-4 text-center">
                <Key className="w-12 h-12 mx-auto text-purple-500" />
                <h2 className="text-xl font-semibold">Closed Source Model</h2>
                <p className="text-gray-600">Use your own API key</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">PARAG</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 space-y-4">
        {showApiInput && !apiKey && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              <div className="flex items-center space-x-4">
                <input
                  type="password"
                  placeholder="Enter your API key"
                  className="flex-1 p-2 border rounded"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setShowApiInput(false)}
                >
                  Save Key
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 bg-white rounded-lg shadow-sm border min-h-[600px] flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">Thinking...</div>
              </div>
            )}
          </div>

          <div className="border-t p-4">
            <div className="flex space-x-4">
              <input
                type="text"
                className="flex-1 p-2 border rounded"
                placeholder="Ask about policies..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={loading || !inputMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PolicyChat;