import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Trash2, CheckCircle, XCircle, AlertCircle, Wrench, Search, Clipboard, Lightbulb, TrendingUp, Zap, BarChart3, Plus, History, MessageSquare, BookOpen, List, Edit2, Save, Car, Settings as SettingsIcon, Award, Users, DollarSign } from 'lucide-react';
import { chatApi, api } from '../lib/api';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showKnowledgeList, setShowKnowledgeList] = useState(false);
  const [showKnowledgeDetail, setShowKnowledgeDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<any>(null);
  const [isKnowledgeMode, setIsKnowledgeMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [knowledgeData, setKnowledgeData] = useState({
    carModel: '',
    problem: '',
    solution: ''
  });
  const [knowledgeStep, setKnowledgeStep] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if on landing page
  const isLandingPage = window.location.pathname === '/';

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const formatMessageContent = (content: string) => {
    // Emoji to Icon mapping
    const emojiMap: { [key: string]: JSX.Element } = {
      '🚗': <Car className="w-4 h-4 inline text-blue-600 mr-1" />,
      '📋': <Clipboard className="w-4 h-4 inline text-purple-600 mr-1" />,
      '✅': <CheckCircle className="w-4 h-4 inline text-green-600 mr-1" />,
      '❓': <AlertCircle className="w-4 h-4 inline text-orange-600 mr-1" />,
      '💡': <Lightbulb className="w-4 h-4 inline text-yellow-600 mr-1" />,
      '🔧': <Wrench className="w-4 h-4 inline text-blue-600 mr-1" />,
      '⚙️': <SettingsIcon className="w-4 h-4 inline text-gray-600 mr-1" />,
      '📝': <Edit2 className="w-4 h-4 inline text-indigo-600 mr-1" />,
      '🎉': <Sparkles className="w-4 h-4 inline text-pink-600 mr-1" />,
      '❌': <XCircle className="w-4 h-4 inline text-red-600 mr-1" />,
      '💰': <DollarSign className="w-4 h-4 inline text-green-600 mr-1" />,
      '👥': <Users className="w-4 h-4 inline text-blue-600 mr-1" />,
      '🏆': <Award className="w-4 h-4 inline text-yellow-600 mr-1" />,
      '📚': <BookOpen className="w-4 h-4 inline text-purple-600 mr-1" />,
      '➕': <Plus className="w-4 h-4 inline text-green-600 mr-1" />,
      '1️⃣': <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">1</span>,
      '2️⃣': <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">2</span>,
      '3️⃣': <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">3</span>,
    };

    // Icon tag mapping for chat messages
    const iconMap: { [key: string]: JSX.Element } = {
      '[CHECK]': <CheckCircle className="w-3 h-3 inline text-green-600 mr-1" />,
      '[X]': <XCircle className="w-3 h-3 inline text-red-600 mr-1" />,
      '[ALERT]': <AlertCircle className="w-3 h-3 inline text-orange-600 mr-1" />,
      '[WARNING]': <AlertCircle className="w-3 h-3 inline text-orange-600 mr-1" />,
      '[WRENCH]': <Wrench className="w-3 h-3 inline text-blue-600 mr-1" />,
      '[SEARCH]': <Search className="w-3 h-3 inline text-indigo-600 mr-1" />,
      '[CLIPBOARD]': <Clipboard className="w-3 h-3 inline text-purple-600 mr-1" />,
      '[LIGHTBULB]': <Lightbulb className="w-3 h-3 inline text-yellow-600 mr-1" />,
      '[TRENDING]': <TrendingUp className="w-3 h-3 inline text-green-600 mr-1" />,
      '[ZAPLIGHTNING]': <Zap className="w-3 h-3 inline text-yellow-600 mr-1" />,
      '[CHART]': <BarChart3 className="w-3 h-3 inline text-blue-600 mr-1" />,
    };

    // Replace emojis with icons
    let processedContent = content;
    Object.keys(emojiMap).forEach(emoji => {
      if (processedContent.includes(emoji)) {
        const parts = processedContent.split(emoji);
        processedContent = parts.join(`__EMOJI_${emoji}__`);
      }
    });

    // Split content into lines and process each
    const lines = processedContent.split('\n');
    return lines.map((line, idx) => {
      // Check if line contains any icon tag
      let hasIcon = false;
      let iconElement = null;
      let cleanLine = line;

      Object.keys(iconMap).forEach(tag => {
        if (line.includes(tag)) {
          hasIcon = true;
          iconElement = iconMap[tag];
          cleanLine = line.replace(tag, '').trim();
        }
      });

      if (hasIcon && iconElement) {
        return (
          <span key={idx} className="flex items-start gap-1 mb-1">
            {iconElement}
            <span>{cleanLine}</span>
          </span>
        );
      }

      // Replace emoji placeholders with actual icons
      const parts = line.split(/(__EMOJI_.+?__)/);
      const elements = parts.map((part, partIdx) => {
        const emojiMatch = part.match(/__EMOJI_(.+)__/);
        if (emojiMatch) {
          const emoji = emojiMatch[1];
          return <span key={partIdx}>{emojiMap[emoji]}</span>;
        }
        return <span key={partIdx}>{part}</span>;
      });

      return <span key={idx}>{elements}{idx < lines.length - 1 && <br />}</span>;
    });
  };

  // Generate or get session ID
  useEffect(() => {
    loadChatSessions();
    let sid = localStorage.getItem('chatSessionId');
    if (!sid) {
      sid = createNewSession();
    }
    setSessionId(sid);
    loadHistory(sid);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Attention animation every 5-10 seconds
  useEffect(() => {
    if (isOpen) return; // Faqat yopiq bo'lganda animatsiya

    const getRandomInterval = () => Math.floor(Math.random() * 5000) + 5000; // 5-10 sekund

    const triggerAnimation = () => {
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 2000); // 2 sekund animatsiya
    };

    // Birinchi animatsiya
    const firstTimeout = setTimeout(triggerAnimation, getRandomInterval());

    // Keyingi animatsiyalar
    const interval = setInterval(() => {
      triggerAnimation();
    }, getRandomInterval());

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  const createNewSession = (): string => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('chatSessionId', newSessionId);
    return newSessionId;
  };

  const loadChatSessions = () => {
    const sessionsData = localStorage.getItem('chatSessions');
    if (sessionsData) {
      const sessions = JSON.parse(sessionsData);
      setChatSessions(sessions.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      })));
    }
  };

  const saveChatSession = (sid: string, firstMessage: string) => {
    const sessionsData = localStorage.getItem('chatSessions');
    let sessions: ChatSession[] = sessionsData ? JSON.parse(sessionsData) : [];
    
    // Check if session already exists
    const existingIndex = sessions.findIndex(s => s.id === sid);
    const sessionData: ChatSession = {
      id: sid,
      title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
      lastMessage: firstMessage,
      timestamp: new Date()
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionData;
    } else {
      sessions.unshift(sessionData);
    }

    // Keep only last 20 sessions
    sessions = sessions.slice(0, 20);
    
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    setChatSessions(sessions);
  };

  const switchToSession = (sid: string) => {
    setSessionId(sid);
    localStorage.setItem('chatSessionId', sid);
    loadHistory(sid);
    setShowHistory(false);
  };

  const startNewChat = () => {
    const newSid = createNewSession();
    setSessionId(newSid);
    setMessages([{
      role: 'assistant',
      content: t('Assalomu alaykum! Men Mator Life AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language),
      timestamp: new Date()
    }]);
    setShowHistory(false);
  };

  const deleteSession = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sessionsData = localStorage.getItem('chatSessions');
    if (sessionsData) {
      let sessions: ChatSession[] = JSON.parse(sessionsData);
      sessions = sessions.filter(s => s.id !== sid);
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
      setChatSessions(sessions);
      
      if (sid === sessionId) {
        startNewChat();
      }
    }
  };

  const loadHistory = async (sid: string) => {
    try {
      const response = await chatApi.getHistory(sid, 50);
      if (response.messages && response.messages.length > 0) {
        setMessages(response.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt)
        })));
      } else {
        // Show welcome message
        setMessages([{
          role: 'assistant',
          content: t('Assalomu alaykum! Men Mator Life AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language) + ' 🚗',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Load history error:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Knowledge mode handling
    if (isKnowledgeMode) {
      handleKnowledgeInput(input.trim());
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const messageContent = input.trim();
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage({
        message: messageContent,
        sessionId,
        language // Til parametrini qo'shamiz
      });

      // Create empty AI message first
      const aiMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);

      // Typewriter effect - show text word by word
      const words = response.message.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: currentText
          };
          return newMessages;
        });
        
        // Wait 50ms between words (adjust for speed)
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Save session after successful message
      saveChatSession(sessionId, messageContent);
      
    } catch (error: any) {
      console.error('Send message error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || t('Xabar yuborishda xatolik', language);
      toast.error(errorMessage);
      
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await chatApi.clearHistory(sessionId);
      setMessages([{
        role: 'assistant',
        content: t('Assalomu alaykum! Men Mator Life AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language) + ' 🚗',
        timestamp: new Date()
      }]);
      toast.success(t('Chat tarixi tozalandi', language));
    } catch (error) {
      toast.error(t('Tozalashda xatolik', language));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons based on user role
  const getQuickActions = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'master') {
      return [
        t('Shogirt ishini tekshirish', language),
        t('Vazifa berish', language),
        t('Hisobotlar', language),
        t('Qaysi mashinalar bor?', language),
        t('Qarzlar holati', language)
      ];
    } else if (user.role === 'apprentice') {
      return [
        t('Bugungi vazifalarim', language),
        t('Qanday topshiraman?', language),
        t('Ehtiyot qismlar', language),
        t("Xizmatlar ro'yxati", language)
      ];
    } else {
      return [
        t('Manzil qayerda?', language),
        t('Telefon raqam', language),
        t('Xizmatlar va narxlar', language),
        t('Ish vaqti', language),
        t('Qanday xizmatlar bor?', language)
      ];
    }
  };

  const quickActions = getQuickActions();

  const startKnowledgeMode = () => {
    setIsKnowledgeMode(true);
    setKnowledgeStep(0);
    setKnowledgeData({ carModel: '', problem: '', solution: '' });
    setMessages([{
      role: 'assistant',
      content: t("📚 Bilim qo'shish rejimiga xush kelibsiz!", language) + '\n\n' + t('Men sizga yordam beraman. Keling, boshlaylik:', language) + '\n\n1️⃣ ' + t("Qaysi mashina haqida ma'lumot qo'shmoqchisiz?", language) + '\n\n' + t('Masalan: "Chevrolet Gentra", "Nexia 3", "Cobalt" va h.k.', language),
      timestamp: new Date()
    }]);
  };

  // Typewriter effect for knowledge mode
  const typewriterEffect = async (content: string) => {
    // Create empty message first
    const emptyMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, emptyMsg]);
    setLoading(false);

    // Type word by word
    const words = content.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: currentText
        };
        return newMessages;
      });
      
      // Wait 50ms between words
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const handleKnowledgeInput = async (userInput: string) => {
    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Normal knowledge creation flow
      if (knowledgeStep === 0) {
        // Step 1: Car model
        setKnowledgeData(prev => ({ ...prev, carModel: userInput }));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const content = `✅ ${t('Ajoyib!', language)} ${userInput} ${t("uchun ma'lumot qo'shamiz.", language)}\n\n2️⃣ ${t('Endi qanday muammo yoki vaziyat haqida gapirmoqchisiz?', language)}\n\n${t('Masalan:', language)}\n• "${t('Motor ishlamayapti', language)}"\n• "${t("Yoqilg'i sarfi ko'p", language)}"\n• "${t('Tormoz zaif', language)}"\n• "${t('Suspenziya shovqin chiqaradi', language)}"`;
        
        await typewriterEffect(content);
        setKnowledgeStep(1);
        
      } else if (knowledgeStep === 1) {
        // Step 2: Problem
        setKnowledgeData(prev => ({ ...prev, problem: userInput }));
        
        // Ask AI for suggestions
        const aiResponse = await chatApi.sendMessage({
          message: `Men ustoz sifatida bilimlar bazasiga ma'lumot qo'shmoqdaman. Mashina: ${knowledgeData.carModel}, Muammo: ${userInput}. Bu muammo uchun professional yechim taklif qiling. Qisqa va aniq javob bering.`,
          sessionId: 'knowledge_helper_' + Date.now()
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const content = `✅ ${t('Tushundim:', language)} "${userInput}"\n\n💡 ${t('AI tavsiyasi:', language)}\n${aiResponse.message}\n\n3️⃣ ${t("Endi o'zingizning yechimingizni yozing yoki yuqoridagi tavsiyani tahrirlang:", language)}\n\n(${t('Bosqichma-bosqich yozing', language)})`;
        
        await typewriterEffect(content);
        setKnowledgeStep(2);
        
      } else if (knowledgeStep === 2) {
        // Step 3: Solution - Save to database
        setKnowledgeData(prev => ({ ...prev, solution: userInput }));
        
        try {
          const response = await api.post('/knowledge', {
            carModel: knowledgeData.carModel,
            problem: knowledgeData.problem,
            solution: userInput,
            category: 'boshqa'
          });

          if (response.data.success) {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const content = `✅ ${t('Ajoyib! Bilim muvaffaqiyatli saqlandi!', language)}\n\n📋 ${t("Qo'shilgan ma'lumot:", language)}\n• ${t('Mashina:', language)} ${knowledgeData.carModel}\n• ${t('Muammo:', language)} ${knowledgeData.problem}\n• ${t('Yechim saqlandi', language)}\n\n${t("Endi shogirtlar bu muammo haqida so'rashsa, sizning yechimingiz ko'rsatiladi!", language)} 🎉\n\n${t("Yana bilim qo'shish uchun kitob belgisini bosing.", language)}`;
            
            await typewriterEffect(content);
            
            toast.success(t('Bilim saqlandi!', language));
            
            // Reset knowledge mode
            setTimeout(() => {
              setIsKnowledgeMode(false);
              setKnowledgeStep(0);
              setKnowledgeData({ carModel: '', problem: '', solution: '' });
            }, 2000);
          }
        } catch (error: any) {
          const content = `❌ ${t('Xatolik yuz berdi:', language)} ${error.response?.data?.message || t('Bilimni saqlashda muammo', language)}\n\n${t('Iltimos, qaytadan urinib ko\'ring.', language)}`;
          
          await typewriterEffect(content);
          toast.error(t('Saqlashda xatolik', language));
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Knowledge mode error:', error);
      setLoading(false);
      toast.error(t('Xatolik yuz berdi', language));
    }
  };

  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role;
  };

  const loadKnowledgeList = async () => {
    try {
      const response = await api.get('/knowledge');
      setKnowledgeList(response.data.knowledge || []);
    } catch (error) {
      console.error('Load knowledge error:', error);
    }
  };

  const handleViewKnowledge = (knowledge: any) => {
    setSelectedKnowledge(knowledge);
    setShowKnowledgeDetail(true);
  };

  const handleEditKnowledge = (knowledge: any) => {
    setSelectedKnowledge(knowledge);
    setKnowledgeData({
      carModel: knowledge.carModel,
      problem: knowledge.problem,
      solution: knowledge.solution
    });
    setShowEditModal(true);
    setShowKnowledgeDetail(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedKnowledge) return;
    
    try {
      const response = await api.put(`/knowledge/${selectedKnowledge._id}`, knowledgeData);
      
      if (response.data.success) {
        toast.success(t('Bilim yangilandi!', language));
        setShowEditModal(false);
        setSelectedKnowledge(null);
        loadKnowledgeList();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Yangilashda xatolik', language));
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      await api.delete(`/knowledge/${id}`);
      toast.success(t("Bilim o'chirildi", language));
      loadKnowledgeList();
    } catch (error) {
      toast.error(t("O'chirishda xatolik", language));
    }
  };

  if (!isOpen) {
    return (
      <button
        data-ai-chat-button
        onClick={() => setIsOpen(true)}
        className={`fixed ${isLandingPage ? 'bottom-6 right-6' : 'bottom-20 right-4 sm:bottom-6 sm:right-6'} lg:bottom-6 lg:right-6 transition-all duration-300 hover:scale-105 z-30 group ${
          shouldAnimate ? 'animate-bounce-attention' : ''
        }`}
      >
        {isLandingPage ? (
          <div className="relative">
            {/* Simple logo without background */}
            <img 
              src="/logo.jpg" 
              alt="Mator Life AI" 
              className="w-16 h-16 object-cover rounded-full shadow-2xl hover:shadow-3xl transition-shadow"
            />
            
            {/* Status indicator */}
            <span className={`absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg ${
              shouldAnimate ? 'animate-ping' : 'animate-pulse'
            }`}></span>
            {shouldAnimate && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></span>
            )}
            
            {/* Tooltip */}
            <div className={`absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl transition-opacity whitespace-nowrap pointer-events-none shadow-xl ${
              shouldAnimate ? 'opacity-100 animate-bounce-in' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>{t('AI bilan suhbatlashing', language)}</span>
              </div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ) : (
          <>
            <img src="/logo.jpg" alt="Mator Life AI" className={`w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full shadow-xl ${shouldAnimate ? 'animate-wiggle' : ''}`} />
            <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white ${
              shouldAnimate ? 'animate-ping' : 'animate-pulse'
            }`}></span>
            {shouldAnimate && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full animate-ping"></span>
            )}
            <div className={`absolute bottom-full right-0 mb-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-xs sm:text-sm rounded-lg transition-opacity whitespace-nowrap pointer-events-none ${
              shouldAnimate ? 'opacity-100 animate-bounce-in' : 'opacity-0 group-hover:opacity-100'
            }`}>
              Mator Life AI
            </div>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-2 sm:bottom-6 sm:right-6 lg:bottom-6 lg:right-6 w-[calc(100vw-16px)] sm:w-96 h-[calc(100vh-140px)] sm:h-[600px] lg:h-[600px] bg-white rounded-xl sm:rounded-2xl shadow-xl flex flex-col z-30 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <img src="/logo.jpg" alt="Mator Life AI" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full shadow-lg" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base truncate">Mator Life AI</h3>
            <p className="text-xs text-purple-100 truncate">{t('Online • Avto Servis Yordamchisi', language)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {getUserRole() === 'master' && !isKnowledgeMode && (
            <button
              onClick={startKnowledgeMode}
              className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={t("Bilim qo'shish", language)}
            >
              <BookOpen className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
            </button>
          )}
          {isKnowledgeMode && (
            <>
              <button
                onClick={() => {
                  setShowKnowledgeList(!showKnowledgeList);
                  if (!showKnowledgeList) loadKnowledgeList();
                }}
                className={`p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors ${showKnowledgeList ? 'bg-white/20' : ''}`}
                title={t("Bilimlar ro'yxati", language)}
              >
                <List className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </button>
              <button
                onClick={() => {
                  setKnowledgeStep(0);
                  setKnowledgeData({ carModel: '', problem: '', solution: '' });
                  setMessages([{
                    role: 'assistant',
                    content: t("📚 Yangi bilim qo'shish!", language) + '\n\n1️⃣ ' + t("Qaysi mashina haqida ma'lumot qo'shmoqchisiz?", language) + '\n\n' + t('Masalan: "Chevrolet Gentra", "Nexia 3", "Cobalt" va h.k.', language),
                    timestamp: new Date()
                  }]);
                }}
                className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={t("Yangi bilim qo'shish", language)}
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </button>
              <button
                onClick={() => {
                  setIsKnowledgeMode(false);
                  setKnowledgeStep(0);
                  loadHistory(sessionId);
                }}
                className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors bg-white/10"
                title={t('Oddiy chatga qaytish', language)}
              >
                <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </button>
            </>
          )}
          {!isKnowledgeMode && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors ${showHistory ? 'bg-white/20' : ''}`}
                title="Chat tarixi"
              >
                <History className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </button>
              <button
                onClick={startNewChat}
                className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Yangi chat"
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Tarixni tozalash"
              >
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && !isKnowledgeMode && (
        <>
          {/* Overlay to close sidebar */}
          <div 
            className="absolute inset-0 bg-black/20 z-10 rounded-2xl"
            onClick={() => setShowHistory(false)}
          />
          <div className="absolute top-0 left-0 w-64 h-full bg-white border-r border-gray-200 rounded-l-2xl shadow-lg z-20">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t('Chat Tarixi', language)}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {chatSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {t("Hali chat tarixi yo'q", language)}
                </div>
              ) : (
                <div className="p-2">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => switchToSession(session.id)}
                      className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group ${
                        session.id === sessionId ? 'bg-purple-50 border border-purple-200' : 'border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.timestamp.toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Knowledge List Sidebar */}
      {showKnowledgeList && isKnowledgeMode && (
        <>
          {/* Overlay to close sidebar */}
          <div 
            className="absolute inset-0 bg-black/20 z-10 rounded-2xl"
            onClick={() => setShowKnowledgeList(false)}
          />
          <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 rounded-r-2xl shadow-lg z-20 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <List className="w-5 h-5 text-purple-600" />
                {t("Bilimlar ro'yxati", language)}
              </h3>
              <button
                onClick={() => setShowKnowledgeList(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {knowledgeList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>{t("Hali bilimlar yo'q", language)}</p>
                  <button
                    onClick={() => {
                      setShowKnowledgeList(false);
                      startKnowledgeMode();
                    }}
                    className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-semibold"
                  >
                    {t("Birinchi bilimni qo'shish", language)}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeList.map((knowledge) => (
                    <div
                      key={knowledge._id}
                      onClick={() => handleViewKnowledge(knowledge)}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-purple-600 truncate">
                            {knowledge.carModel}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {knowledge.problem}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-3">
                        {knowledge.solution}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Knowledge Detail View */}
      {showKnowledgeDetail && selectedKnowledge && (
        <>
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/20 z-10 rounded-2xl"
            onClick={() => setShowKnowledgeDetail(false)}
          />
          <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 rounded-r-2xl shadow-lg z-20 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                {t('Bilim tafsiloti', language)}
              </h3>
              <button
                onClick={() => setShowKnowledgeDetail(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t('Mashina', language)}</label>
                  <p className="text-lg font-bold text-purple-600 mt-1">
                    {selectedKnowledge.carModel}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t('Muammo', language)}</label>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
                    {selectedKnowledge.problem}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t('Yechim', language)}</label>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
                    {selectedKnowledge.solution}
                  </p>
                </div>

                {selectedKnowledge.category && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">{t('Kategoriya', language)}</label>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {selectedKnowledge.category}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t("Qo'shilgan sana", language)}</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedKnowledge.createdAt).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  handleEditKnowledge(selectedKnowledge);
                  setShowKnowledgeDetail(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Edit2 className="w-4 h-4" />
                {t('Tahrirlash', language)}
              </button>
              <button
                onClick={() => {
                  handleDeleteKnowledge(selectedKnowledge._id);
                  setShowKnowledgeDetail(false);
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                {t("O'chirish", language)}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedKnowledge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-6 h-6 text-blue-600" />
                  {t('Bilimni tahrirlash', language)}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedKnowledge(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Mashina modeli', language)} *
                  </label>
                  <input
                    type="text"
                    value={knowledgeData.carModel}
                    onChange={(e) => setKnowledgeData({ ...knowledgeData, carModel: e.target.value })}
                    placeholder={t('Masalan: Chevrolet Gentra', language)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Muammo', language)} *
                  </label>
                  <textarea
                    value={knowledgeData.problem}
                    onChange={(e) => setKnowledgeData({ ...knowledgeData, problem: e.target.value })}
                    placeholder={t('Muammoni batafsil yozing...', language)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Yechim', language)} *
                  </label>
                  <textarea
                    value={knowledgeData.solution}
                    onChange={(e) => setKnowledgeData({ ...knowledgeData, solution: e.target.value })}
                    placeholder={t('Yechimni bosqichma-bosqich yozing...', language)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      {t("Matnni to'g'ridan-to'g'ri tahrirlang. Barcha o'zgarishlar saqlanadi.", language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedKnowledge(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!knowledgeData.carModel || !knowledgeData.problem || !knowledgeData.solution}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {t('Saqlash', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              <div className="text-base sm:text-sm whitespace-pre-wrap leading-relaxed">
                {msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content}
              </div>
              <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && !isKnowledgeMode && (
        <div className="px-4 py-2 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500 mb-2">{t('Tez savollar:', language)}</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              const prevValue = input;
              
              // Birinchi harfni katta qilish
              if (value.length === 1 || (value.trim().length === 1 && prevValue.trim().length === 0)) {
                setInput(value.charAt(0).toUpperCase() + value.slice(1));
              }
              // Nuqta, savol yoki undov belgisidan keyin katta harf
              else if (value.length > prevValue.length) {
                const lastChars = prevValue.slice(-2);
                const newChar = value.slice(-1);
                
                // Agar oxirgi belgi nuqta/savol/undov + bo'shliq bo'lsa va yangi harf kiritilsa
                if ((lastChars.match(/[.!?]\s$/) || prevValue.match(/[.!?]$/)) && newChar.match(/[a-zA-Z]/)) {
                  setInput(value.slice(0, -1) + newChar.toUpperCase());
                } else {
                  setInput(value);
                }
              } else {
                setInput(value);
              }
            }}
            onKeyDown={handleKeyPress}
            placeholder={t('Xabar yozing...', language)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-sm resize-none overflow-hidden"
            disabled={loading}
            autoCapitalize="sentences"
            rows={1}
            style={{
              minHeight: '48px',
              maxHeight: '140px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 140) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
