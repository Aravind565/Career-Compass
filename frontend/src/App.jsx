import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsView from './components/ResultsView';
import AIInsights from './components/AIInsights';

const App = () => {
  const [theme, setTheme] = useState('light');
  const [jobDescription, setJobDescription] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previousScore, setPreviousScore] = useState(undefined);
  const [showHistory, setShowHistory] = useState(false);
  const [activeView, setActiveView] = useState('input');
  const [conversationData, setConversationData] = useState({
    jobDesc: '',
    resumeText: '',
    fileContent: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleAnalyze = async (file, resumeTextContent) => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      setError("Please provide a detailed job description (at least 20 characters).");
      return;
    }

    if (!file && !resumeTextContent?.trim()) {
      setError("Please upload a resume file or paste resume text.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('jobDescription', jobDescription);
      
      if (userQuestion) {
        formData.append('userQuery', userQuestion);
      }
      
      if (file) {
        formData.append('resume', file);
      } else if (resumeTextContent) {
        formData.append('resumeText', resumeTextContent);
      }

const API_URL = import.meta.env.VITE_BACKEND_URL;
const response = await fetch(`${API_URL}/analyze`, {
  method: 'POST',
  body: formData,
});


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error ${response.status}`);
      }
      
      const data = await response.json();

      if (result && typeof result.score === 'number') {
        setPreviousScore(Number(result.score));
      }

      let extractedResumeText = '';
      if (file) {
        try {
          if (file.type === 'text/plain') {
            extractedResumeText = await file.text();
          } else {
            extractedResumeText = 'File content processed';
          }
        } catch (e) {
          console.error('Error extracting text:', e);
          extractedResumeText = 'File content unavailable';
        }
      } else {
        extractedResumeText = resumeTextContent;
      }

      setConversationData({
        jobDesc: jobDescription,
        resumeText: extractedResumeText,
        fileContent: file ? 'File uploaded' : resumeTextContent
      });

      setResult(data);
      setActiveView('results');

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!result) return;

    try {
   const response = await fetch(`${API_URL}/export-analysis`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    analysis: result,
    format: format
  }),
});

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      let filename = `Career-Analysis-${Date.now()}`;
      if (format === 'pdf') filename += '.pdf';
      else if (format === 'txt') filename += '.txt';
      else if (format === 'json') filename += '.json';
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Export error:', err);
      setError('Export failed. Please try again.');
    }
  };

  const handleExportConversation = () => {
    if (!conversationData) return;

    const conversationExport = {
      timestamp: new Date().toISOString(),
      jobDescription: conversationData.jobDesc,
      resumePreview: conversationData.resumeText?.substring(0, 500),
      analysisSummary: result,
      conversationHistory: []
    };

    const blob = new Blob([JSON.stringify(conversationExport, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Career-Chat-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleNewAnalysis = () => {
    setJobDescription('');
    setUserQuestion('');
    setResult(null);
    setError('');
    setSelectedFile(null);
    setResumeText("");
    setActiveView('input');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 text-gray-900'
    }`}>
      <Header 
        theme={theme}
        toggleTheme={toggleTheme}
        toggleHistory={() => setShowHistory(!showHistory)}
        onNewAnalysis={handleNewAnalysis}
      />

      <main className="pt-24 pb-12">
        {activeView === 'input' && (
          <InputSection
            jobDesc={jobDescription}
            setJobDesc={setJobDescription}
            userQuestion={userQuestion}
            setUserQuestion={setUserQuestion}
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error}
            onErrorClear={() => setError('')}
            setSelectedFile={setSelectedFile}
            setResumeText={setResumeText}
          />
        )}

        {activeView === 'results' && result && (
          <ResultsView
            result={result}
            onEdit={() => setActiveView('input')}
            previousScore={previousScore}
            onExport={handleExport}
            jobDescription={jobDescription}
            resumeText={conversationData.resumeText}
            onOpenAIChat={() => setActiveView('aiInsights')}
          />
        )}

        {activeView === 'aiInsights' && (
          <AIInsights
            analysis={result}
            jobDescription={conversationData.jobDesc}
            resumeText={conversationData.fileContent || conversationData.resumeText}
            initialQuestion={userQuestion}
            onExport={handleExportConversation}
            onBack={() => setActiveView('results')}
          />
        )}
      </main>

      <footer className="py-6 px-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Career Compass AI • Powered by Groq AI • {new Date().getFullYear()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Your AI-powered career analysis assistant
          </p>
        </div>
      </footer>

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-bold mt-6 mb-2 text-gray-900 dark:text-white">Analyzing with AI</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Our AI is analyzing your resume against the job description...
              </p>
              <div className="mt-6 flex gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;