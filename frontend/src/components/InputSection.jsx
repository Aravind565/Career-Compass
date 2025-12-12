import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Briefcase, Sparkles, X, 
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
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [resumeTextLocal, setResumeTextLocal] = useState("");
  const [resumeMode, setResumeMode] = useState('upload');
  const [localError, setLocalError] = useState(null);

  const validateAndSetFile = (uploadedFile) => {
    setLocalError(null);
    onErrorClear?.();

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

    const isTxt = uploadedFile.name.toLowerCase().endsWith('.txt');
    if (!validTypes.includes(uploadedFile.type) && !isTxt) {
      setLocalError("Invalid file type. Please upload PDF, DOCX, or TXT.");
      return;
    }

    setFile(uploadedFile);
    if (setSelectedFile) setSelectedFile(uploadedFile);
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 mb-4 text-sm">
          <Sparkles size={16} />
          AI Career Intelligence
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Analyze Your <span className="text-indigo-600">Career Fit</span>
        </h1>

        <p className="text-gray-600 mt-2 text-sm md:text-base max-w-xl mx-auto">
          Upload your resume or paste it, add a job description, and get instant gap analysis.
        </p>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* JOB DESC COLUMN */}
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Briefcase className="text-indigo-500" size={18} />
              Job Description
            </h3>

            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste job description here..."
              className="w-full min-h-[220px] md:min-h-[300px] rounded-xl p-4 border border-gray-300 
                         focus:ring-2 focus:ring-indigo-400 outline-none resize-y"
            />
          </div>

          {/* RESUME COLUMN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="text-indigo-500" size={18} />
                Your Resume
              </h3>

              {/* Toggle Upload/Paste */}
              <div className="flex bg-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setResumeMode('upload')}
                  className={`px-4 py-2 text-sm font-medium ${
                    resumeMode === 'upload'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setResumeMode('text')}
                  className={`px-4 py-2 text-sm font-medium ${
                    resumeMode === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  Paste
                </button>
              </div>
            </div>

            {/* UPLOAD MODE */}
            {resumeMode === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full min-h-[220px] md:min-h-[300px] border-2 border-dashed rounded-xl 
                  flex flex-col items-center justify-center text-center p-4 cursor-pointer
                  ${
                    file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-indigo-400'
                  }
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => validateAndSetFile(e.target.files[0])}
                />

                {!file ? (
                  <>
                    <Upload size={36} className="text-indigo-500" />
                    <p className="mt-2 text-gray-500">Click to upload your resume</p>
                    <p className="text-xs text-gray-400">PDF / DOCX / TXT • Max 10MB</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-green-500 mb-2" size={30} />
                    <p className="font-semibold">{file.name}</p>
                    <button
                      className="mt-3 text-red-500 text-sm underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setSelectedFile(null);
                      }}
                    >
                      Remove File
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* TEXT MODE */
              <textarea
                value={resumeTextLocal}
                onChange={(e) => setResumeTextLocal(e.target.value)}
                placeholder="Paste resume text..."
                className="w-full min-h-[220px] md:min-h-[300px] rounded-xl p-4 border border-gray-300 
                           focus:ring-2 focus:ring-indigo-400 outline-none resize-y"
              />
            )}
          </div>
        </div>

        {/* ERROR */}
        {(localError || error) && (
          <div className="mt-6 p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{localError || error}</span>
            <button className="ml-auto" onClick={() => setLocalError(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        {/* BUTTON */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleAnalyzeClick}
            disabled={!isReady || loading}
            className={`px-8 py-4 rounded-xl font-semibold text-white text-lg flex items-center gap-2
              ${
                isReady && !loading
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? "Processing..." : "Start Career Analysis"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
