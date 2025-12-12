import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Briefcase, Sparkles, X, File as FileIcon, 
  Type, CheckCircle, AlertTriangle, ArrowRight 
} from 'lucide-react';

const InputSection = ({
  jobDesc,
  setJobDesc,
  onAnalyze,
  loading,
  error,
  onErrorClear,
  setSelectedFile,
  setResumeText
}) => {
  const [file, setFile] = useState(null);
  const [resumeTextLocal, setResumeTextLocal] = useState("");
  const [resumeMode, setResumeMode] = useState('upload'); // 'upload' | 'text'
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null); // For validation errors
  const fileInputRef = useRef(null);

  // --- Handlers ---

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile) => {
    setLocalError(null);
    onErrorClear?.();

    // Size limit (10MB)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setLocalError("File size exceeds 10MB limit.");
      return;
    }

    const validTypes = [
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Check type or extension
    const isTxt = uploadedFile.name.toLowerCase().endsWith('.txt');
    if (!validTypes.includes(uploadedFile.type) && !isTxt) {
      setLocalError("Invalid file type. Please upload PDF, DOCX, or TXT.");
      return;
    }

    setFile(uploadedFile);
    if (setSelectedFile) setSelectedFile(uploadedFile);
  };

  const handleResumeTextChange = (text) => {
    setResumeTextLocal(text);
    if (setResumeText) setResumeText(text);
    if (localError) setLocalError(null);
  };

  const handleAnalyzeClick = () => {
    if (!jobDesc || jobDesc.length < 20) {
      setLocalError("Please enter a detailed job description.");
      return;
    }
    
    if (resumeMode === 'text' && resumeTextLocal.length < 50) {
      setLocalError("Please paste sufficient resume content.");
      return;
    }

    if (resumeMode === 'upload' && !file) {
      setLocalError("Please upload a resume file.");
      return;
    }

    setLocalError(null);
    onAnalyze(file, resumeTextLocal);
  };

  const isReady = jobDesc?.length > 20 && (resumeMode === 'upload' ? !!file : resumeTextLocal.length > 50);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      
      {/* 1. Hero Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] -z-10" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md border border-indigo-100 dark:border-indigo-900/50 mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">AI-Powered Career Intelligence</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          Check Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Career Fit</span>
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Upload your resume and a job description to get an instant gap analysis, ATS score, and personalized learning path.
        </p>
      </div>

      {/* 2. Main Input Card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[2rem] border border-white/40 dark:border-gray-700/40 shadow-2xl p-6 md:p-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* LEFT: Job Description */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <Briefcase size={22} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Target Role</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paste the job requirements</p>
              </div>
            </div>

            <div className="relative flex-1 group">
              <textarea
                value={jobDesc}
                onChange={(e) => {
                  setJobDesc(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="e.g. Senior Frontend Engineer&#10;&#10;Key Responsibilities:&#10;- 5+ years with React...&#10;- Experience with AWS..."
                className="w-full h-[320px] lg:h-full p-6 rounded-2xl bg-white dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-base text-gray-700 dark:text-gray-200 shadow-inner group-hover:border-gray-200 dark:group-hover:border-gray-600"
              />
              <div className={`absolute bottom-4 right-4 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                jobDesc.length > 20 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400'
              }`}>
                {jobDesc.length} chars
              </div>
            </div>
          </div>

          {/* RIGHT: Resume Input */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Your Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resume / CV</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setResumeMode('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    resumeMode === 'upload' 
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Upload size={16} /> Upload
                </button>
                <button
                  onClick={() => setResumeMode('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    resumeMode === 'text' 
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Type size={16} /> Paste
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              {resumeMode === 'upload' ? (
                <div
                  className={`relative h-[320px] lg:h-full rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer group overflow-hidden
                    ${dragActive 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[0.99]' 
                      : file 
                        ? 'border-emerald-400 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-900/10'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full z-10">
                      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center mb-4 text-emerald-500 relative">
                        <FileText size={40} />
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
                          <CheckCircle size={14} fill="currentColor" className="text-white" />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-800 dark:text-white text-lg truncate max-w-[90%] mb-1">
                        {file.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            if (setSelectedFile) setSelectedFile(null);
                          }}
                          className="px-5 py-2.5 bg-white dark:bg-gray-800 text-red-500 border border-red-200 dark:border-red-900/50 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                        >
                          Remove
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-1">
                      <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-gray-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Upload size={32} className="text-indigo-500 group-hover:text-indigo-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Upload your Resume
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                        Drag & drop your PDF, DOCX, or TXT file here, or click to browse
                      </p>
                      <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        Max Size: 10MB
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative group h-full">
                  <textarea
                    value={resumeTextLocal}
                    onChange={(e) => handleResumeTextChange(e.target.value)}
                    placeholder="Paste your full resume content here..."
                    className="w-full h-[320px] lg:h-full p-6 rounded-2xl bg-white dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all resize-none text-base text-gray-700 dark:text-gray-200 shadow-inner group-hover:border-gray-200 dark:group-hover:border-gray-600"
                  />
                  <div className={`absolute bottom-4 right-4 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                    resumeTextLocal.length > 50 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400'
                  }`}>
                    {resumeTextLocal.length} chars
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Action Footer */}
        <div className="mt-10 flex flex-col items-center">
          
          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
              <div className="flex items-center gap-3 px-5 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 shadow-sm">
                <AlertTriangle size={20} />
                <span className="font-medium">{localError || error}</span>
                <button 
                  onClick={() => { setLocalError(null); onErrorClear?.(); }}
                  className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-800/40 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeClick}
            disabled={loading || !isReady}
            className={`
              relative group flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 w-full md:w-auto min-w-[300px]
              ${loading || !isReady
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} className={isReady ? 'animate-pulse' : ''} />
                <span>Start Career Analysis</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
            Powered by Groq AI • Secure & Private Analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputSection;