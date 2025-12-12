import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Bot, User, Sparkles, RefreshCw,
  Download, Copy, ThumbsUp, ThumbsDown, BookOpen,
  ChevronRight, Lightbulb, Target, Clock, Zap, ArrowLeft
} from 'lucide-react';

const AIInsights = ({
  analysis,
  jobDescription,
  resumeText,
  initialQuestion = null,
  onExport = () => {},
  onBack = () => {}
}) => {
  // SIMPLE WELCOME MESSAGE
  const getSimpleWelcomeMessage = () => {
    let welcomeMessage = "Hi! I'm Career Compass AI.\n\n";
   
    if (analysis && jobDescription && resumeText) {
      welcomeMessage += `I've analyzed your resume against the job description.\n\n`;
      welcomeMessage += `Your Match Score: ${analysis.score || 'N/A'}/10 (${analysis.matchLevel || 'Not rated'})\n`;
      welcomeMessage += `Experience Level: ${analysis.experienceLevel || 'Not specified'}\n`;
     
      if (analysis.skills?.present?.length > 0) {
        welcomeMessage += `Your Key Strengths: ${analysis.skills.present.slice(0, 3).map(s => s.name).join(', ')}\n`;
      }
     
      if (analysis.skills?.missing?.length > 0) {
        welcomeMessage += `Areas to Develop: ${analysis.skills.missing.slice(0, 3).map(s => s.name).join(', ')}\n\n`;
      }
     
      welcomeMessage += `I'm here to provide career advice based on your resume and this job.\n\n`;
    } else {
      welcomeMessage += `I'm here to provide career advice.\n\n`;
    }
   
    welcomeMessage += `What would you like to know? For example:\n`;
    welcomeMessage += `- How can I better match this job?\n`;
    welcomeMessage += `- What skills should I prioritize?\n`;
    welcomeMessage += `- How should I update my resume?\n`;
    welcomeMessage += `- What's my biggest strength for this role?\n`;
    welcomeMessage += `- Can you help with interview preparation?`;
   
    return welcomeMessage;
  };
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: initialQuestion || getSimpleWelcomeMessage(),
      sender: 'ai',
      timestamp: new Date(),
      type: 'welcome'
    }
  ]);
 
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(Date.now());
  const messagesEndRef = useRef(null);
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
  useEffect(() => {
    console.log('AIInsights Data:', {
      hasAnalysis: !!analysis,
      jobDescLength: jobDescription?.length,
      resumeTextLength: resumeText?.length,
      analysisScore: analysis?.score,
      analysisSkills: analysis?.skills?.present?.length
    });
  }, [analysis, jobDescription, resumeText]);
  const sendMessage = async (message = inputMessage, isQuickQuestion = false) => {
    if (!message.trim() && !isQuickQuestion) return;
    const userMessage = {
      id: messages.length + 1,
      text: isQuickQuestion ? message : inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
   
    if (!isQuickQuestion) {
      setInputMessage('');
    }
   
    setIsLoading(true);
    try {
      const payload = {
        jobDesc: jobDescription || '',
        resumeText: resumeText || '',
        userMessage: isQuickQuestion ? message : inputMessage,
        analysisSummary: analysis ? {
          score: analysis.score,
          matchLevel: analysis.matchLevel,
          skills: {
            present: analysis.skills?.present || [],
            missing: analysis.skills?.missing || []
          },
          experienceLevel: analysis.experienceLevel,
          insights: analysis.insights || []
        } : null,
        conversation: messages.slice(-3).map(msg => ({
          sender: msg.sender,
          text: msg.text.substring(0, 300)
        }))
      };
      const API_URL = 'http://localhost:5000';
     
      const response = await fetch(`${API_URL}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      console.log('Chat response status:', response.status);
     
      if (!response.ok) {
        let errorText = 'Server error';
        try {
          errorText = await response.text();
        } catch (e) {}
        throw new Error(`Server responded with ${response.status}: ${errorText.substring(0, 100)}`);
      }
      const data = await response.json();
      console.log('Chat response received:', data);
      const aiResponse = {
        id: messages.length + 2,
        text: data.response || "I'd be happy to help with that! Could you provide more details?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'response'
      };
     
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error details:', error);
     
      const fallbackResponse = generateSimpleFallback(
        isQuickQuestion ? message : inputMessage,
        analysis,
        jobDescription,
        resumeText
      );
     
      const errorResponse = {
        id: messages.length + 2,
        text: fallbackResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'response'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };
  // SIMPLE FALLBACK RESPONSES
  const generateSimpleFallback = (userMessage, analysis, jobDesc, resumeText) => {
    const lowerMessage = userMessage.toLowerCase();
   
    if (lowerMessage.includes('strength') || lowerMessage.includes('strong')) {
      const strengths = analysis?.skills?.present?.slice(0, 3).map(s => s.name).join(', ') || 'programming and problem-solving skills';
      return `Your key strengths: ${strengths}\n\nThese align well with the job requirements. Focus on highlighting these in your application.`;
    }
   
    if (lowerMessage.includes('gap') || lowerMessage.includes('missing') || lowerMessage.includes('improve') || lowerMessage.includes('prioritize')) {
      const gaps = analysis?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'specific technical competencies';
      return `Skills to develop: ${gaps}\n\nAction plan:\n- Take online courses on these topics\n- Build a project using these skills\n- Practice with coding challenges\n- Consider relevant certifications`;
    }
   
    if (lowerMessage.includes('match') || lowerMessage.includes('fit') || lowerMessage.includes('align')) {
      const score = analysis?.score || 'N/A';
      const present = analysis?.skills?.present?.length || 0;
      const missing = analysis?.skills?.missing?.length || 0;
      return `Career match analysis:\n\nMatch Score: ${score}/10\nSkills Present: ${present}\nSkills to Develop: ${missing}\n\nImprovement strategy:\n- Add missing keywords to resume\n- Highlight relevant projects\n- Prepare for technical interviews\n- Network in the industry`;
    }
   
    if (lowerMessage.includes('resume') || lowerMessage.includes('update') || lowerMessage.includes('cv')) {
      return `Resume optimization tips:\n\n1. Use exact keywords from job description\n2. Quantify achievements with numbers\n3. List relevant technologies prominently\n4. Tailor resume for each application\n5. Keep it concise (1-2 pages)\n\nNeed help with a specific section?`;
    }
   
    if (lowerMessage.includes('experience') || lowerMessage.includes('level')) {
      const level = analysis?.experienceLevel || 'mid-level';
      return `Experience level assessment:\n\nBased on your skills and experience, you appear to be at a ${level} level.\n\nThis matches well with typical requirements for this role. Continue building depth in your technical skills.`;
    }
   
    if (lowerMessage.includes('interview') || lowerMessage.includes('prepare') || lowerMessage.includes('prep')) {
      return `Interview preparation:\n\nTechnical questions:\n- Review common technical questions for your role\n- Practice system design questions\n- Know your projects well\n\nBehavioral questions:\n- Use STAR method for answers\n- Prepare stories from your experience\n- Research the company\n\nDo mock interviews for practice.`;
    }
   
    const contextInfo = analysis ?
      `Career snapshot:\n- Match Score: ${analysis.score}/10\n- Experience Level: ${analysis.experienceLevel}\n- Key Skills: ${analysis.skills?.present?.slice(0, 3).map(s => s.name).join(', ') || 'Various'}\n\n` :
      '';
   
    return `${contextInfo}How can I help you today?\n\nI can assist with:\n- Your career fit for this role\n- Skill development priorities\n- Resume improvement tips\n- Interview preparation strategies\n\nWhat would you like to focus on?`;
  };
  const handleQuickQuestion = (question) => {
    sendMessage(question, true);
  };
  const handleSuggestedTopic = (topic) => {
    sendMessage(topic.query, true);
  };
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };
  const resetConversation = () => {
    setMessages([
      {
        id: 1,
        text: "Hi! Let's start fresh!\n\nI'm ready to help you with your career questions. What would you like to know about your resume and this job opportunity?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'welcome'
      }
    ]);
    setConversationId(Date.now());
  };
const formatSimpleMessage = (text) => {
  if (!text) return null;
 
  // Split by lines
  const lines = text.split('\n');
  const elements = [];
 
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
   
    if (!trimmedLine) {
      if (elements.length > 0 && index < lines.length - 1) {
        elements.push(<div key={`space-${index}`} className="h-3" />);
      }
      return;
    }
   
    // Handle numbered lists (1., 2., etc.)
    const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
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
   
    // Handle bullet points with dash
    if (trimmedLine.startsWith('- ')) {
      const content = trimmedLine.substring(2).trim();
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 mb-2 ml-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300">{content}</span>
        </div>
      );
      return;
    }
   
    // Handle check marks or other symbols
    if (trimmedLine.startsWith('✅ ') || trimmedLine.startsWith('✓ ') || trimmedLine.startsWith('✔ ')) {
      const content = trimmedLine.substring(2).trim();
      elements.push(
        <div key={`check-${index}`} className="flex items-start gap-2 mb-2">
          <span className="text-green-500">✓</span>
          <span className="text-gray-700 dark:text-gray-300">{content}</span>
        </div>
      );
      return;
    }
   
    // Handle headers (ends with colon)
    if (trimmedLine.endsWith(':') && trimmedLine.length < 100) {
      elements.push(
        <h3 key={`header-${index}`} className="font-bold text-gray-800 dark:text-white mt-4 mb-2">
          {trimmedLine}
        </h3>
      );
      return;
    }
   
    // Regular paragraph
    // Split long paragraphs into sentences
    if (trimmedLine.length > 120) {
      const sentences = trimmedLine.split(/(?<=[.!?])\s+/);
      sentences.forEach((sentence, sIndex) => {
        if (sentence.trim()) {
          elements.push(
            <p key={`para-${index}-${sIndex}`} className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              {sentence.trim()}
            </p>
          );
        }
      });
    } else {
      elements.push(
        <p key={`para-${index}`} className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
          {trimmedLine}
        </p>
      );
    }
  });
 
  return elements;
};
  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 animate-in fade-in-0 duration-500">
      {/* Header with Back Button - Compact on Mobile */}
      <div className="mb-4 sm:mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm flex-shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">AI Career Coach</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ask me anything about your analysis
              </p>
            </div>
            <div className="sm:hidden">
              <h2 className="text-lg font-bold text-foreground">AI Coach</h2>
            </div>
          </div>
         
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={resetConversation}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-muted/80 hover:bg-muted backdrop-blur-sm border border-border/50 rounded-xl transition-all group text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
              <span className="hidden sm:inline font-medium text-foreground">Reset</span>
            </button>
           
            <button
              onClick={() => onExport('conversation')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all shadow-sm flex-shrink-0 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-medium">Export</span>
            </button>
          </div>
        </div>
       
        {/* Stats Bar - Responsive Grid, Hidden on Very Small Screens */}
        <div className="hidden md:grid md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6 pt-2">
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1 bg-primary/10 rounded-lg">
                <MessageSquare className="w-3 h-3 text-primary" />
              </div>
              <span className="text-muted-foreground">Messages</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground mt-1">{messages.length}</p>
          </div>
         
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1 bg-secondary/10 rounded-lg">
                <Sparkles className="w-3 h-3 text-secondary" />
              </div>
              <span className="text-muted-foreground">Analysis</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground mt-1">
              {analysis?.score || '--'}/10
            </p>
          </div>
         
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1 bg-accent/10 rounded-lg">
                <Lightbulb className="w-3 h-3 text-accent" />
              </div>
              <span className="text-muted-foreground">Topics</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-foreground mt-1">
              {analysis?.skills?.missing?.length || 0} gaps
            </div>
          </div>
         
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1 bg-destructive/10 rounded-lg">
                <Clock className="w-3 h-3 text-destructive" />
              </div>
              <span className="text-muted-foreground">Session</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground mt-1">
              {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Container - Full Height on Mobile, Fixed Height on Larger */}
      <div className="flex flex-col h-screen sm:h-[70vh] md:h-[600px] bg-background/80 dark:bg-background/80 backdrop-blur-xl rounded-2xl border border-border/30 shadow-lg overflow-hidden">
        {/* Messages Area - Improved Scrolling and Spacing */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[90%] sm:max-w-[80%] md:max-w-[75%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  {message.sender === 'ai' && (
                    <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mt-0.5 sm:mt-1 flex-shrink-0">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                  )}
                 
                  <div
                    className={`rounded-2xl p-3 sm:p-4 relative ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-br-md shadow-md'
                        : 'bg-card backdrop-blur-sm border border-border/50 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className={`text-xs sm:text-sm font-medium ${
                        message.sender === 'user' ? 'text-primary-foreground/90' : 'text-muted-foreground'
                      }`}>
                        {message.sender === 'user' ? 'You' : 'Career Compass AI'}
                      </span>
                      <button
                        onClick={() => copyMessage(message.text)}
                        className={`p-1 rounded hover:bg-accent/10 transition-colors opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 sm:static sm:opacity-100 ${
                          message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                        title="Copy message"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                   
                    <div className={`text-sm sm:text-base leading-relaxed max-w-full break-words ${
                      message.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      <div className="group relative">
                        {formatSimpleMessage(message.text)}
                      </div>
                    </div>
                   
                    {message.sender === 'ai' && message.type !== 'welcome' && (
                      <div className="flex gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30">
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent-foreground hover:bg-accent/10 p-1 rounded transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span className="hidden sm:inline">Helpful</span>
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span className="hidden sm:inline">Needs work</span>
                        </button>
                      </div>
                    )}
                  </div>
                 
                  {message.sender === 'user' && (
                    <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 mt-0.5 sm:mt-1 flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
         
          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-2 sm:gap-3 max-w-[80%] md:max-w-[75%]">
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="bg-card backdrop-blur-sm rounded-2xl rounded-bl-md p-3 sm:p-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-foreground">Analyzing your question...</div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
         
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions - Collapsible on Mobile */}
        {messages.length === 1 && (
          <div className="px-3 sm:px-4 sm:px-6 py-3 bg-accent/5 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick starts:</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickQuestions.slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs px-2.5 py-1.5 bg-card/70 hover:bg-card backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all text-foreground overflow-hidden truncate flex-1 min-w-0"
                >
                  {question}
                </button>
              ))}
              {quickQuestions.length > 3 && (
                <button className="text-xs px-2.5 py-1.5 bg-card/70 hover:bg-card backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all text-foreground flex items-center gap-1">
                  <span className="truncate">More...</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Area - Enhanced with Better Mobile Keyboard Handling */}
        <div className="p-3 sm:p-4 border-t border-border/50 bg-background/50">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder="Ask about your career fit..."
                className="w-full px-3 sm:px-4 py-3 pl-10 sm:pl-12 bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-foreground placeholder-muted-foreground disabled:opacity-50"
                disabled={isLoading}
              />
              <Bot className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
           
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="px-3 sm:px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
         
          {/* Suggested Topics - Grid Responsive, Fewer on Mobile */}
          <div className="mt-3 sm:mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Explore:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedTopic(topic)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-card/50 hover:bg-card backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group text-xs overflow-hidden"
                >
                  <div className="p-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                    <topic.icon className="w-3 h-3 text-primary" />
                  </div>
                  <span className="font-medium text-foreground truncate">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tips - Compact and Always Visible, but Slimmer on Mobile */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-accent/5 rounded-xl border border-accent/20">
        <div className="flex items-start gap-2 sm:gap-3">
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm sm:text-base">
            <p className="font-medium text-foreground mb-1.5 sm:mb-1">Pro tips:</p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                Be specific about skills or requirements
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                Ask follow-ups for clarity
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                Request examples or steps
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;