import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Briefcase,
  Sparkles,
  X,
  Type,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const InputSection = ({
  jobDesc,
  setJobDesc,
  onAnalyze,
  loading,
  error,
  onErrorClear,
  setSelectedFile,
  setResumeText,
}) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [resumeTextLocal, setResumeTextLocal] = useState("");
  const [resumeMode, setResumeMode] = useState("upload");
  const [localError, setLocalError] = useState(null);

  const validateAndSetFile = (uploadedFile) => {
    setLocalError(null);
    onErrorClear?.();

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setLocalError("File size exceeds 10MB.");
      return;
    }

    const validTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isTxt = uploadedFile.name.toLowerCase().endsWith(".txt");

    if (!validTypes.includes(uploadedFile.type) && !isTxt) {
      setLocalError("Invalid file type. Upload PDF, DOCX, or TXT.");
      return;
    }

    setFile(uploadedFile);
    setSelectedFile?.(uploadedFile);
  };

  const handleAnalyzeClick = () => {
    if (!jobDesc || jobDesc.length < 20) {
      setLocalError("Please provide a detailed job description.");
      return;
    }

    if (resumeMode === "text" && resumeTextLocal.length < 50) {
      setLocalError("Please paste enough resume text.");
      return;
    }

    if (resumeMode === "upload" && !file) {
      setLocalError("Please upload your resume file.");
      return;
    }

    setLocalError(null);
    onAnalyze(file, resumeTextLocal);
  };

  const isReady =
    jobDesc?.length > 20 &&
    (resumeMode === "upload" ? !!file : resumeTextLocal.length > 50);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-700">

      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-gradient-to-r from-indigo-500/10 to-purple-500/10
            text-indigo-600 dark:text-indigo-300 border border-indigo-300/40 dark:border-indigo-700/40
            backdrop-blur-xl shadow-sm
          "
        >
          <Sparkles size={16} />
          AI Career Intelligence
        </div>

       <h1
  className="
    text-3xl md:text-4xl font-extrabold mt-4 
    bg-clip-text text-transparent 
    bg-gradient-to-r from-indigo-600 to-purple-600
    dark:bg-gradient-to-r dark:from-gray-100 dark:via-gray-300 dark:to-gray-100
  "
>
  Analyze Your Career Fit
</h1>


        <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mt-2 max-w-xl mx-auto">
          Upload or paste your resume, add a job description, and get instant AI-powered career analysis.
        </p>
      </div>

      {/* Main Card */}
      <div
        className="
          bg-white/70 dark:bg-gray-900/50 backdrop-blur-2xl
          border border-gray-300/40 dark:border-gray-700/40
          rounded-3xl shadow-xl p-6 md:p-10
        "
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Job Description */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3 text-lg">
              <Briefcase className="text-indigo-500" size={18} />
              Job Description
            </h3>

            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here..."
              className="
                w-full min-h-[240px] md:min-h-[300px]
                rounded-2xl p-4 
                bg-white/80 dark:bg-gray-800/60 
                border border-gray-300/60 dark:border-gray-700/60
                text-gray-900 dark:text-gray-100
                shadow-inner
                focus:ring-2 focus:ring-indigo-500/40
                outline-none resize-y
              "
            />
          </div>

          {/* Resume Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                <FileText className="text-indigo-500" size={18} />
                Your Resume
              </h3>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300/50 dark:border-gray-700/50">
                {["upload", "text"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setResumeMode(mode)}
                    className={`
                      px-4 py-2 text-sm font-medium transition-all
                      ${resumeMode === mode
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
                      }
                    `}
                  >
                    {mode === "upload" ? "Upload" : "Paste"}
                  </button>
                ))}
              </div>
            </div>

            {/* UPLOAD MODE */}
            {resumeMode === "upload" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  w-full min-h-[240px] md:min-h-[300px]
                  border-2 border-dashed rounded-2xl
                  flex flex-col items-center justify-center text-center p-6
                  cursor-pointer transition-all
                  bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl
                  ${
                    file
                      ? "border-green-400 bg-green-50/60 dark:bg-green-900/20"
                      : "border-gray-400/50 dark:border-gray-600 hover:border-indigo-500/60"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => validateAndSetFile(e.target.files[0])}
                />

                {!file ? (
                  <>
                    <Upload size={40} className="text-indigo-500" />
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      Click to upload your resume
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF / DOCX / TXT (Max 10MB)
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-green-500 mb-2" size={32} />
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{file.name}</p>
                    <button
                      className="mt-3 text-red-600 dark:text-red-400 text-xs 
px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 
hover:bg-red-100 dark:hover:bg-red-900/30
transition-all font-semibold"


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
                onChange={(e) => {
                  setResumeTextLocal(e.target.value);
                  setResumeText(e.target.value);
                }}
                placeholder="Paste resume text here..."
                className="
                  w-full min-h-[240px] md:min-h-[300px]
                  rounded-2xl p-4 
                  bg-white/80 dark:bg-gray-800/60 
                  border border-gray-300/60 dark:border-gray-700/60
                  text-gray-900 dark:text-gray-100
                  shadow-inner
                  focus:ring-2 focus:ring-indigo-500/40
                  outline-none resize-y
                "
              />
            )}
          </div>
        </div>

        {/* Error Box */}
        {(localError || error) && (
          <div
            className="
              mt-6 p-4 rounded-xl
              bg-red-100/60 dark:bg-red-900/30
              text-red-700 dark:text-red-300
              flex items-center gap-3
              border border-red-300/40 dark:border-red-700/40
            "
          >
            <AlertTriangle size={20} />
            <span>{localError || error}</span>

            <button className="ml-auto" onClick={() => setLocalError(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        {/* CTA Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleAnalyzeClick}
            disabled={!isReady || loading}
            className={`
              px-8 py-4 rounded-xl font-semibold text-white text-lg flex items-center gap-2
              transition-all duration-300 active:scale-95
              ${
                isReady && !loading
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 shadow-lg shadow-indigo-500/20"
                  : "bg-gray-400/70 dark:bg-gray-700 cursor-not-allowed"
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
