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
      setLocalError("File size exceeds 10MB limit.");
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

    if (resumeMode === "text" && resumeTextLocal.length < 50) {
      setLocalError("Please paste sufficient resume content.");
      return;
    }

    if (resumeMode === "upload" && !file) {
      setLocalError("Please upload a resume file.");
      return;
    }

    setLocalError(null);
    onAnalyze(file, resumeTextLocal);
  };

  const isReady =
    jobDesc?.length > 20 &&
    (resumeMode === "upload" ? !!file : resumeTextLocal.length > 50);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">

      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
          bg-indigo-100 dark:bg-indigo-900/30 
          text-indigo-700 dark:text-indigo-300 mb-4 text-sm">
          <Sparkles size={16} />
          AI Career Intelligence
        </div>

        <h1 className="text-3xl md:text-4xl font-bold 
          text-gray-900 dark:text-white">
          Analyze Your <span className="text-indigo-600 dark:text-indigo-400">Career Fit</span>
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm md:text-base max-w-xl mx-auto">
          Upload or paste your resume, add a job description, and get instant AI analysis.
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white dark:bg-gray-900 
        rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* JOB DESCRIPTION LEFT SIDE */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
              <Briefcase className="text-indigo-500" size={18} />
              Job Description
            </h3>

            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full min-h-[220px] md:min-h-[300px]
                rounded-xl p-4 border 
                bg-white dark:bg-gray-800
                text-gray-800 dark:text-white
                border-gray-300 dark:border-gray-700
                focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                outline-none resize-y"
            />
          </div>

          {/* RESUME SECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FileText className="text-indigo-500" size={18} />
                Your Resume
              </h3>

              {/* MODE TOGGLE */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                <button
                  onClick={() => setResumeMode("upload")}
                  className={`px-4 py-2 text-sm font-medium transition-all 
                    ${resumeMode === "upload"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-300"
                    }`}
                >
                  Upload
                </button>

                <button
                  onClick={() => setResumeMode("text")}
                  className={`px-4 py-2 text-sm font-medium transition-all 
                    ${resumeMode === "text"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-300"
                    }`}
                >
                  Paste
                </button>
              </div>
            </div>

            {/* UPLOAD MODE */}
            {resumeMode === "upload" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full min-h-[220px] md:min-h-[300px] 
                  border-2 border-dashed rounded-xl 
                  flex flex-col items-center justify-center p-4 cursor-pointer 
                  transition-all text-center
                  ${
                    file
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-400 dark:border-gray-600 hover:border-indigo-400"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => validateAndSetFile(e.target.files[0])}
                />

                {!file ? (
                  <>
                    <Upload size={36} className="text-indigo-500" />
                    <p className="mt-2 text-gray-500 dark:text-gray-300">
                      Click to upload your resume
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      PDF / DOCX / TXT • Max 10MB
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-green-500 mb-2" size={30} />
                    <p className="font-semibold text-gray-800 dark:text-white">{file.name}</p>

                    <button
                      className="mt-3 text-red-500 dark:text-red-400 text-sm underline"
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
                className="w-full min-h-[220px] md:min-h-[300px]
                  rounded-xl p-4 border 
                  bg-white dark:bg-gray-800
                  text-gray-800 dark:text-white
                  border-gray-300 dark:border-gray-700
                  focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                  outline-none resize-y"
              />
            )}
          </div>
        </div>

        {/* ERRORS */}
        {(localError || error) && (
          <div className="mt-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 
            text-red-600 dark:text-red-300 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{localError || error}</span>

            <button
              className="ml-auto"
              onClick={() => setLocalError(null)}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* BUTTON */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleAnalyzeClick}
            disabled={!isReady || loading}
            className={`px-8 py-4 rounded-xl font-semibold text-white text-lg flex items-center gap-2 transition-all
              ${
                isReady && !loading
                  ? "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-lg"
                  : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
              }`}
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
