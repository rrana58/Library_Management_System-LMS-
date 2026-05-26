import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

const Chatbot: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hello! I am your Library Assistant. How can I help you today? You can ask about library hours, book availability, or late fines.' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = prompt;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setPrompt('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/ask', { prompt: userMessage });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Sorry, I encountered an error. Please try again later.';
      toast.error('Chatbot error');
      setMessages(prev => [...prev, { role: 'bot', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-8 flex items-center space-x-3">
        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Library Assistant</h1>
          <p className="text-sm text-gray-500 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
            AI-powered support
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-2xl text-xs text-yellow-800 dark:text-yellow-200 mb-4">
            <p className="flex items-center font-bold mb-1">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Professional AI Ethics
            </p>
            Our Library Assistant is designed to provide unbiased and fair recommendations. We prioritize data minimization and respect your privacy in every interaction.
          </div>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start space-x-3",
                  msg.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl",
                  msg.role === 'bot' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                )}>
                  {msg.role === 'bot' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'bot' 
                    ? "bg-blue-50 text-gray-800 rounded-tl-none" 
                    : "bg-blue-600 text-white rounded-tr-none shadow-md"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="relative flex items-center">
            <input
              type="text"
              className="block w-full pl-4 pr-12 py-4 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-inner"
              placeholder="Ask anything about the library..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
