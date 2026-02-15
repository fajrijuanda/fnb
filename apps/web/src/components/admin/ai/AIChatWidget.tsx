'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import api from '@/lib/api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

export function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Halo! Saya OMDEN AI. Ada yang bisa saya bantu terkait data bisnis Anda hari ini?', sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            const res = await api.post<{ response: string }>('/ai/chat/', { query: userMessage.text });
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: res.data.response,
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Maaf, terjadi kesalahan saat memproses pesan Anda.',
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col animation-scale-in origin-bottom-right h-[500px]">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">OMDEN AI Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[10px] text-white/80">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                    ${msg.sender === 'user'
                                        ? 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'}
                                `}>
                                    {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                </div>
                                <div className={`
                                    max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                                    ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5 rounded-tl-none shadow-sm'}
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <div className="bg-white dark:bg-[#252525] px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Tanya sesuatu..."
                                className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isTyping}
                                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-white/10 text-white rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:shadow-none"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50
                    ${isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}
                `}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={26} fill="currentColor" className="opacity-90" />}

                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-black rounded-full" />
                )}
            </button>
        </div>
    );
}
