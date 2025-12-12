import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Bot, User, Sparkles, RefreshCw,
  Download, Copy, ThumbsUp, ThumbsDown, BookOpen,
  ChevronRight, Lightbulb, Target, Clock, Zap, ArrowLeft
} from 'lucide-react';

// Helper to format text with basic markdown-like features
const formatMessageText = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (elements.length > 0 && index < lines.length - 1) {
        elements.push(<div key={`space-${index}`} className="h-3" />);
      }
      return;
    }

    // Numbered lists
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      const [, number, content] = numberMatch;
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 mb-2 ml-1">
          <span className="font-medium text-blue-500 min-w-6">{number}.</span>
          <span className="text-gray-700 dark:text-gray-300 flex-1">{content}</span>
        </div>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 mb-2 ml-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300">{trimmed.substring(2).trim()}</span>
        </div>
      );
      return;
    }

    // Checkmarks
    if (/^[✅✓✔]/.test(trimmed)) {
      elements.push(
        <div key={`check-${index}`} className="flex items-start gap-2 mb-2">
          <span className="text-green-500">✓</span>
          <span className="text-gray-700 dark:text-gray-300">{trimmed.substring(2).trim()}</span>
        </div>
      );
      return;
    }

    // Headers
    if (trimmed.endsWith(':') && trimmed.length < 100) {
      elements.push(
        <h3 key={`header-${index}`} className="font-bold text-gray-800 dark:text-white mt-4 mb-2">
          {trimmed}
        </h3>
      );
      return;
    }

    // Paragraphs
    elements.push(
      <p key={`para-${index}`} className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
        {trimmed}
      </p>
    );
  });

  return elements;
};

const AIInsights = ({
  analysis,
  jobDescription,
  resumeText,
  initialQuestion = null,
  onExport = () => {},
  onBack = () => {}
}) => {
  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getWelcomeMessage = () => {
    let msg = "Hi! I'm Career Compass AI.\n\n";
    
    if (analysis && jobDescription && resumeText) {
      msg += "I've analyzed your resume against the job description.\n\n";
      msg += `Your Match Score: ${analysis.score || 'N/A'}/10 (${analysis.matchLevel || 'Not rated'})\n`;
      msg += `Experience Level: ${analysis.experienceLevel || 'Not specified'}\n`;
      
      if (analysis.skills?.present?.length > 0) {
        msg += `Your Key Strengths: ${analysis.skills.present.slice(0, 3).map(s => s.name).join(', ')}\n`;
      }
      
      if (analysis.skills?.missing?.length > 0) {
        msg += `Areas to Develop: ${analysis.skills.missing.slice(0, 3).map(s => s.name).join(', ')}\n\n`;
      }
      msg += "I'm here to provide career advice based on your resume and this job.\n\n";
    } else {
      msg += "I'm here to provide career advice.\n\n";
    }
    
    msg += "What would you like to know? For example:\n";
    msg += "- How can I better match this job?\n";
    msg += "- What skills should I prioritize?\n";
    msg += "- How should I update my resume?";
    
    return msg;
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: initialQuestion || getWelcomeMessage(),
      sender: 'ai',
      timestamp: new Date(),
      type: 'welcome'
    }
  ]);

  const quickQuestions = [
    "How can I better match this job?",
    "What skills should I prioritize learning?",
    "What's my biggest strength for this role?",
    "How should I update my resume?",
    "Can you help with interview prep?",
    "What's my experience level for this job?",
    "How to address my skill gaps?"
  ];

  const suggestedTopics = [
    { icon: BookOpen, label: "Skill Gap Analysis", query: "Analyze my skill gaps in detail" },
    { icon: Target, label: "Resume Optimization", query: "How can I optimize my resume for this job?" },
    { icon: Clock, label: "Learning Timeline", query: "Create a 30-day learning plan for me" },
    { icon: Zap, label: "Interview Prep", query: "What interview questions should I expect?" }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateFallbackResponse = (query) => {
    const lower = query.toLowerCase();
    const missing = analysis?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'technical skills';
    const present = analysis?.skills?.present?.slice(0, 3).map(s => s.name).join(', ') || 'core competencies';

    if (lower.includes('strength') || lower.includes('strong')) {
      return `Your key strengths: ${present}\n\nThese align well with the job requirements. Focus on highlighting these in your application.`;
    }
    if (lower.includes('gap') || lower.includes('missing') || lower.includes('improve')) {
      return `Skills to develop: ${missing}\n\nAction plan:\n- Take online courses on these topics\n- Build a project using these skills\n- Practice with coding challenges`;
    }
    if (lower.includes('resume') || lower.includes('cv')) {
      return `Resume optimization tips:\n\n1. Use exact keywords from job description\n2. Quantify achievements with numbers\n3. List relevant technologies prominently`;
    }
    
    return "I can assist with career fit, skill development, and interview prep. What specific area would you like to focus on?";
  };

  const sendMessage = async (text = inputMessage, isQuick = false) => {
    if (!text.trim() && !isQuick) return;

    const userMsg = {
      id: messages.length + 1,
      text: isQuick ? text : inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!isQuick) setInputMessage('');
    setIsLoading(true);

    try {
    const response = await fetch(
  `${import.meta.env.VITE_BACKEND_URL}/ai-chat`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDesc: jobDescription || '',
      resumeText: resumeText || '',
      userMessage: userMsg.text,
      analysisSummary: analysis,
      conversation: messages.slice(-3).map(m => ({
        sender: m.sender,
        text: m.text.substring(0, 300)
      }))
    })
  }
);


      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: prev.length + 2,
        text: data.response || "Could you provide more details?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'response'
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: prev.length + 2,
        text: generateFallbackResponse(userMsg.text),
        sender: 'ai',
        timestamp: new Date(),
        type: 'response'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([{
      id: 1,
      text: "Hi! Let's start fresh!\n\nI'm ready to help you with your career questions.",
      sender: 'ai',
      timestamp: new Date(),
      type: 'welcome'
    }]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 animate-in fade-in-0 duration-500">
      {/* Header */}
      <div className="mb-4 sm:mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <button onClick={onBack} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm flex-shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">AI Career Coach</h2>
              <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">Ask me anything about your analysis</p>
            </div>
          </div>
          
          <div className="flex gap-1 sm:gap-2">
            <button onClick={resetConversation} className="flex items-center gap-2 px-4 py-2 bg-muted/80 hover:bg-muted border border-border/50 rounded-xl transition-all text-sm">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline font-medium">Reset</span>
            </button>
            <button onClick={() => onExport('conversation')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl transition-all shadow-sm text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Export</span>
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden md:grid md:grid-cols-4 gap-3 mb-6 pt-2">
          {[
            { icon: MessageSquare, label: 'Messages', value: messages.length, color: 'text-primary', bg: 'bg-primary/10' },
            { icon: Sparkles, label: 'Score', value: `${analysis?.score || '--'}/10`, color: 'text-secondary', bg: 'bg-secondary/10' },
            { icon: Lightbulb, label: 'Gaps', value: analysis?.skills?.missing?.length || 0, color: 'text-accent', bg: 'bg-accent/10' },
            { icon: Clock, label: 'Time', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: 'text-destructive', bg: 'bg-destructive/10' }
          ].map((stat, i) => (
            <div key={i} className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 border border-border/50">
              <div className="flex items-center gap-2 text-xs">
                <div className={`p-1 ${stat.bg} rounded-lg`}>
                  <stat.icon className={`w-3 h-3 ${stat.color}`} />
                </div>
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-screen sm:h-[70vh] md:h-[600px] bg-background/80 backdrop-blur-xl rounded-2xl border border-border/30 shadow-lg overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[90%] md:max-w-[75%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-start gap-3">
                  {msg.sender === 'ai' && (
                    <div className="p-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mt-1 flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
                  <div className={`rounded-2xl p-4 relative ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-br-md shadow-md' 
                      : 'bg-card backdrop-blur-sm border border-border/50 rounded-bl-md shadow-sm'
                  }`}>
                    <div className="flex justify-between mb-2">
                      <span className={`text-sm font-medium ${msg.sender === 'user' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                        {msg.sender === 'user' ? 'You' : 'Career Compass AI'}
                      </span>
                      <button onClick={() => navigator.clipboard.writeText(msg.text)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className={`text-sm sm:text-base leading-relaxed ${msg.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {formatMessageText(msg.text)}
                    </div>

                    {msg.sender === 'ai' && msg.type !== 'welcome' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <ThumbsUp className="w-3 h-3" /> Helpful
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                          <ThumbsDown className="w-3 h-3" /> Needs work
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 mt-1 flex-shrink-0">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[75%]">
                <div className="p-2 rounded-full bg-primary/10"><Bot className="w-5 h-5 text-primary" /></div>
                <div className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-2">
                  <span className="text-sm">Thinking</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions (only on start) */}
        {messages.length === 1 && (
          <div className="px-4 py-3 bg-accent/5 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick starts:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.slice(0, 3).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q, true)} className="text-xs px-3 py-1.5 bg-card hover:bg-card/80 border rounded-lg transition-all truncate max-w-[200px]">
                  {q}
                </button>
              ))}
              <button className="text-xs px-2 py-1.5 bg-card border rounded-lg"><ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}

       {/* Input Area */}
<div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
  <div className="flex gap-3">

    {/* Text Input */}
    <div className="flex-1 relative">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
        placeholder="Ask about your career fit..."
        className="
          w-full px-4 py-3 pl-12 
          bg-gray-100 dark:bg-gray-800 
          text-gray-900 dark:text-white
          border border-gray-300 dark:border-gray-700
          rounded-xl 
          focus:ring-2 focus:ring-indigo-500/40
          outline-none transition-all
        "
        disabled={isLoading}
      />
      <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
    </div>

    {/* Send Button */}
    <button
      onClick={() => sendMessage()}
      disabled={isLoading || !inputMessage.trim()}
      className="
        px-6 py-3 
        bg-gradient-to-r from-indigo-600 to-purple-600 
        text-white 
        rounded-xl 
        hover:opacity-90 
        disabled:opacity-50 
        transition-all 
        flex items-center gap-2
      "
    >
      <Send className="w-4 h-4" />
      <span className="hidden sm:inline">Send</span>
    </button>

  </div>
</div>

      </div>

      {/* Footer Tips */}
      <div className="mt-6 p-4 bg-accent/5 rounded-xl border border-accent/20 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-accent-foreground mt-0.5" />
        <div>
          <p className="font-medium text-sm mb-1">Pro tips:</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Be specific about skills</span>
            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Ask follow-ups</span>
            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Request examples</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;