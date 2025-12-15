import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  ChevronRight,
  Lightbulb,
  Target,
  Clock,
  Zap,
  ArrowLeft,
} from "lucide-react";

const formatMessageText = (text, isUser = false) => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];

  const userText = "text-white";
  const aiText = "text-gray-800 dark:text-gray-200";
  const finalText = isUser ? userText : aiText;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      const [, number, content] = numberMatch;
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 mb-2 ml-1">
          <span className={`font-medium min-w-[1.25rem] ${finalText}`}>{number}.</span>
          <span className={finalText}>{content}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith("- ")) {
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 mb-2 ml-1">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isUser ? "bg-white" : "bg-indigo-500"}`} />
          <span className={finalText}>{trimmed.substring(2).trim()}</span>
        </div>
      );
      return;
    }

    if (trimmed.endsWith(":") && trimmed.length < 120) {
      elements.push(
        <h4 key={`header-${index}`} className={`font-semibold mt-3 mb-2 ${finalText}`}>
          {trimmed.replace(":", "")}
        </h4>
      );
      return;
    }

 
    elements.push(
      <p key={`p-${index}`} className={`leading-relaxed mb-2 ${finalText}`}>
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
  onBack = () => {},
}) => {
  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const getWelcomeMessage = () => {
    let msg = "Hi — I'm Career Compass AI.\n\n";
    if (analysis && jobDescription && resumeText) {
      msg += "I've analyzed your resume for this job.\n\n";
      msg += `Match Score: ${analysis.score ?? "N/A"}/10 (${analysis.matchLevel ?? "Not rated"})\n`;
      msg += `Experience: ${analysis.experienceLevel ?? "Not specified"}\n\n`;
      if (analysis.skills?.present?.length) {
        msg += `Strengths: ${analysis.skills.present.slice(0, 3).map((s) => s.name).join(", ")}\n`;
      }
      if (analysis.skills?.missing?.length) {
        msg += `Gaps: ${analysis.skills.missing.slice(0, 3).map((s) => s.name).join(", ")}\n\n`;
      }
      msg += "Ask me anything about improving your fit or resume.\n\n";
    } else {
      msg += "I can help with resume tips, skill gaps, and interview prep.\n\n";
    }

    msg += "Example prompts:\n";
    msg += "- How can I better match this job?\n";
    msg += "- What skills should I prioritize?\n";
    msg += "- How should I update my resume?";
    return msg;
  };

  useEffect(() => {

    setMessages([
      {
        id: "welcome-1",
        sender: "ai",
        text: initialQuestion || getWelcomeMessage(),
        timestamp: new Date().toISOString(),
        type: "welcome",
      },
    ]);

  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const generateFallbackResponse = (query) => {
    const lower = query.toLowerCase();
    const missing = (analysis?.skills?.missing ?? []).slice(0, 3).map((s) => s.name).join(", ") || "some skills";
    const present = (analysis?.skills?.present ?? []).slice(0, 3).map((s) => s.name).join(", ") || "your strengths";

    if (lower.includes("strength") || lower.includes("strong")) {
      return `Key strengths: ${present}\n\nHighlight these prominently in your resume and examples.`;
    }
    if (lower.includes("gap") || lower.includes("missing") || lower.includes("improve")) {
      return `Skills to develop: ${missing}\n\nSuggested actions:\n- Take short online courses\n- Build small projects using these skills\n- Add them as keywords in your resume where relevant`;
    }
    if (lower.includes("resume") || lower.includes("cv")) {
      return `Resume tips:\n1. Use exact keywords from the job description\n2. Quantify your achievements with numbers\n3. Put relevant tech near the top of each role`;
    }
    return "I can help with skill gaps, resume edits, or interview prep — what would you like to focus on?";
  };

  const sendMessage = async (text = inputMessage, isQuick = false) => {
    if (!text || !text.trim()) return;
    const userText = isQuick ? text : inputMessage;
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!isQuick) setInputMessage("");
    setIsLoading(true);
  // ⚠️ CRITICAL: Log the exact URL
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  console.log("🔗 Backend URL:", backendUrl);
  console.log("📤 Full URL:", `${backendUrl}/ai-chat`);
   try {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai-chat`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobDesc: jobDescription || "",
      resumeText: resumeText || "",
      userMessage: userMsg.text,
      analysisSummary: analysis,
      conversation: messages.slice(-4).map((m) => ({ 
        sender: m.sender, 
        text: m.text?.substring(0, 300) 
      })),
    }),
  });

  console.log("📥 Response status:", response.status);
  
  if (!response.ok) {
    console.error("❌ Response not OK:", await response.text());
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ Received data from backend:", data);
  
  // ⚠️ IMPORTANT: Check if backend returned success: false
  if (data.success === false) {
    // Use the error response from backend
    const errorText = data.response || "I'm having technical difficulties. Please try again.";
    
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-error-${Date.now()}`,
        sender: "ai",
        text: errorText,
        timestamp: new Date().toISOString(),
        type: "response",
      },
    ]);
  } else {
    // Success response from backend
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.response,
        timestamp: new Date().toISOString(),
        type: "response",
      },
    ]);
  }
} catch (e) {
  console.error("❌ Fetch error:", e);
  
  // SIMPLE error message - NOT the generateFallbackResponse!
  setMessages((prev) => [
    ...prev,
    {
      id: `ai-error-${Date.now()}`,
      sender: "ai",
      text: "I'm experiencing connection issues. Please check your internet and try again.",
      timestamp: new Date().toISOString(),
      type: "response",
    },
  ]);
} finally {
  setIsLoading(false);
}
  };

  const resetConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: "Hi — let's start fresh. Ask me about your resume or this job.",
        timestamp: new Date().toISOString(),
        type: "welcome",
      },
    ]);
  };

  // quick suggestions & topics
  const quickQuestions = [
    "How can I better match this job?",
    "What skills should I prioritize learning?",
    "What's my biggest strength for this role?",
  ];
  const suggestedTopics = [
    { icon: BookOpen, label: "Skill Gap Analysis", query: "Analyze my skill gaps in detail" },
    { icon: Target, label: "Resume Optimization", query: "How can I optimize my resume for this job?" },
    { icon: Clock, label: "Learning Timeline", query: "Create a 30-day learning plan for me" },
    { icon: Zap, label: "Interview Prep", query: "What interview questions should I expect?" },
  ];

  // UI helpers
  const safeNumber = (v) => (v === undefined || v === null ? "--" : v);

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60 rounded-b-xl px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              aria-label="Back"
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/10">
                <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>
    <div className="min-w-0 leading-snug">
  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
    AI Career Coach
  </h2>
  <p className="text-xs text-gray-500 dark:text-gray-300 sm:whitespace-nowrap whitespace-normal">
    Ask about your analysis, resume or next steps
  </p>
</div>


            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetConversation}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setExportMenuOpen((s) => !s);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"
                aria-expanded={exportMenuOpen}
              >
                <Download className="w-4 h-4" /> Export
              </button>

              {exportMenuOpen && (
                <>
                  <div onClick={() => setExportMenuOpen(false)} className="fixed inset-0 z-10" />
                  <div className="absolute right-0 mt-2 w-44 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-2">
                    <button
                      onClick={() => {
                        onExport("conversation");
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                      Export conversation (.txt)
                    </button>
                    <button
                      onClick={() => {
                        onExport("report");
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                      Export analysis (.txt)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SMALL QUICK STATS - responsive */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="text-xs text-gray-500">Messages</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{messages.length}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{safeNumber(analysis?.score)}/10</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="text-xs text-gray-500">Gaps</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{analysis?.skills?.missing?.length ?? 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="text-xs text-gray-500">Time</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      </div>

      {/* CHAT CARD */}
      <div className="mt-4 relative">
        <div className="flex flex-col h-[70vh] md:h-[72vh] lg:h-[72vh] bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[92%] md:max-w-[70%]`}>
                    <div className="flex items-start gap-3">
                      {!isUser && (
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex-shrink-0">
                          <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                      )}

                      <div className={`${isUser ? "text-right" : "text-left"} relative`}>
                        <div
                          className={`inline-block rounded-2xl px-4 py-3 break-words ${
                            isUser
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md rounded-br-md"
                              : "bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                          }`}
                          role="article"
                          aria-label={isUser ? "Your message" : "AI message"}
                        >
                          <div className="text-sm sm:text-base leading-relaxed">{formatMessageText(msg.text, msg.sender === "user")}
</div>
                        </div>

                        <div className="mt-2 text-xs text-gray-400 dark:text-gray-400 flex items-center gap-2 justify-between">
                          <div className={isUser ? "flex justify-end gap-2" : "flex gap-2"}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.text)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Copy message"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        {/* feedback buttons for AI responses */}
                        {!isUser && msg.type !== "welcome" && (
                          <div className="mt-2 flex gap-2 justify-start">
                            <button className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                              <ThumbsUp className="w-3.5 h-3.5" /> Helpful
                            </button>
                            <button className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                              <ThumbsDown className="w-3.5 h-3.5" /> Needs work
                            </button>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="p-2 bg-gray-100 dark:bg-gray-800/60 rounded-full flex-shrink-0">
                          <User className="w-5 h-5 text-gray-800 dark:text-gray-100" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/70 p-3 rounded-2xl">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">Thinking</div>
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Quick starts</div>
                <button
                  onClick={() => sendMessage("Show more quick prompts", true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400"
                >
                  More
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q, true)}
                    className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-lg"
                  >
                    {q}
                  </button>
                ))}
                <button
                  onClick={() => setMessages((p) => [...p, { id: `s-${Date.now()}`, sender: "ai", text: "Try asking about 'resume bullets' or '30-day plan'." }])}
                  className="text-xs px-2 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about your career fit, resume, or job..."
                  aria-label="Message input"
                  disabled={isLoading}
                  className="w-full rounded-xl px-9 py-3 pr-12 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <Bot className="w-4 h-4" />
                </div>
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl disabled:opacity-50 transition"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* footer tips */}
        <div className="mt-3 flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Pro tips</p>
            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300 mt-1">
              <span className="flex items-center gap-2"><ChevronRight className="w-3 h-3" />Be specific about skills</span>
              <span className="flex items-center gap-2"><ChevronRight className="w-3 h-3" />Ask follow-ups</span>
              <span className="flex items-center gap-2"><ChevronRight className="w-3 h-3" />Request examples</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;