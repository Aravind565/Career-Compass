import React, { useState } from 'react';
import { 
  PieChart, CheckCircle, XCircle, BookOpen, Brain, Download, 
  RefreshCw, Award, TrendingUp, FileText, ChevronDown, ExternalLink, 
  Calendar, Target, Search, Zap, Users, Code, Database, 
  Cloud, Settings, Clock, ChevronRight, ArrowUpRight, Sparkles, 
  MessageSquare, Bot, Share2, Check, Trophy, Lightbulb, GraduationCap, AlertTriangle
} from 'lucide-react';

const categorizeSkill = (skillName) => {
  const lowerName = skillName.toLowerCase();
  const categories = {
    programming: ['c++', 'java', 'python', 'javascript', 'typescript'],
    frameworks: ['react', 'angular', 'vue', 'node', 'express', 'next'],
    databases: ['sql', 'mysql', 'mongodb', 'postgresql', 'database'],
    tools: ['git', 'docker', 'aws', 'azure', 'jenkins', 'postman'],
    frontend: ['html', 'css', 'tailwind', 'bootstrap']
  };

  if (categories.programming.some(lang => lowerName.includes(lang))) return 'Programming';
  if (categories.frameworks.some(fw => lowerName.includes(fw))) return 'Frameworks';
  if (categories.frontend.some(fe => lowerName.includes(fe))) return 'Frontend';
  if (categories.databases.some(db => lowerName.includes(db))) return 'Databases';
  if (categories.tools.some(tool => lowerName.includes(tool))) return 'Tools';
  
  return 'General';
};

const getScoreColor = (score) => {
  if (score >= 8) return 'emerald';
  if (score >= 6) return 'amber';
  return 'rose';
};

const getCategoryIcon = (category) => {
  switch(category?.toLowerCase()) {
    case 'programming': return <Code size={14} />;
    case 'frameworks': return <Zap size={14} />;
    case 'tools': return <Settings size={14} />;
    case 'databases': return <Database size={14} />;
    case 'cloud': return <Cloud size={14} />;
    default: return <Code size={14} />;
  }
};

const ResultsView = ({ 
  result, 
  onEdit, 
  previousScore, 
  jobDescription,
  resumeText,
  onOpenAIChat
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [searchSkill, setSearchSkill] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Safe data handling with defaults
  const safeResult = {
    score: result?.score || 0,
    atsScore: result?.atsScore || 0,
    experienceLevel: result?.experienceLevel || 'mid',
    matchLevel: result?.matchLevel || 'Good Fit',
    summary: result?.summary || 'Analysis complete.',
    skills: {
      required: result?.skills?.required || [],
      present: result?.skills?.present || [],
      missing: result?.skills?.missing || []
    },
    insights: result?.insights || [],
    learningPath: result?.learningPath || [],
    aiGuidance: result?.aiGuidance || '## Analysis\n\nReview the detailed insights below.',
    conversationalAI: result?.conversationalAI || ''
  };

  const presentSkillsCount = safeResult.skills.present.length;
  const missingSkillsCount = safeResult.skills.missing.length;
  const totalSkills = presentSkillsCount + missingSkillsCount;
  const matchPercentage = totalSkills > 0 ? Math.round((presentSkillsCount / totalSkills) * 100) : 0;
  const overallScore = Math.min(10, Math.max(0, safeResult.score));
  const scoreColor = getScoreColor(overallScore);

  const improvements = safeResult.insights.filter(i => i.type === 'improvement');
  const strengths = safeResult.insights.filter(i => i.type === 'strength');
  const advice = safeResult.insights.filter(i => i.type === 'advice');
  const extractionFailed =
  safeResult.skills.present.length === 0 &&
  safeResult.skills.missing.length === 0 &&
  result?.metadata?.fileType === "application/pdf";


  const filteredPresent = safeResult.skills.present.filter(s => 
    s.name.toLowerCase().includes(searchSkill.toLowerCase()) || 
    s.category.toLowerCase().includes(searchSkill.toLowerCase())
  );

  const filteredMissing = safeResult.skills.missing.filter(s => 
    s.name.toLowerCase().includes(searchSkill.toLowerCase()) || 
    s.category.toLowerCase().includes(searchSkill.toLowerCase())
  );

  const handleShare = () => {
    const text = `🎯 CAREER COMPASS REPORT\nScore: ${overallScore}/10\nMatch: ${safeResult.matchLevel}\nATS Score: ${safeResult.atsScore}%\nSummary: ${safeResult.summary}`;
    navigator.clipboard.writeText(text).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleTxtExport = () => {
    const text = `CAREER COMPASS REPORT\n------------------\nScore: ${overallScore}/10\nMatch Level: ${safeResult.matchLevel}\n\nSUMMARY:\n${safeResult.summary}\n\nSKILLS:\nPresent: ${safeResult.skills.present.map(s => s.name).join(', ')}\nMissing: ${safeResult.skills.missing.map(s => s.name).join(', ')}`;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Career_Analysis.txt";
    document.body.appendChild(element);
    element.click();
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) return <h4 key={idx} className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">{line.replace('### ', '')}</h4>;
      if (line.startsWith('## ')) return <h3 key={idx} className="text-xl font-bold mt-6 mb-3 text-indigo-600 dark:text-indigo-400">{line.replace('## ', '')}</h3>;
      if (line.startsWith('- ') || line.startsWith('• ')) return <li key={idx} className="ml-4 mb-1 text-gray-700 dark:text-gray-300 list-disc">{line.substring(2)}</li>;
      return <p key={idx} className="mb-2 text-gray-600 dark:text-gray-300 leading-relaxed">{line}</p>;
    });
  };

  const tabs = [
    { id: 'overview', icon: PieChart, label: 'Overview' },
    { id: 'skills', icon: CheckCircle, label: 'Skills Gap' },
    { id: 'learning', icon: BookOpen, label: 'Learning Path' },
    { id: 'insights', icon: Award, label: 'Insights' },
    { id: 'guidance', icon: Brain, label: 'AI Coach' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 px-2 sm:px-4 lg:px-6 font-sans">
   {/* Header */}
<div className="relative mb-10 pt-6">

  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 via-purple-400/10 to-pink-400/10 blur-2xl -z-10 rounded-3xl" />

  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">

    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="
          px-3 py-1 rounded-full 
          bg-indigo-100 dark:bg-indigo-900/30
          text-indigo-700 dark:text-indigo-300 
          text-xs font-bold uppercase tracking-wider
          border border-indigo-200 dark:border-indigo-800/40
        ">
          Analysis Complete
        </span>

        <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
          <Calendar size={12} /> {new Date().toLocaleDateString()}
        </span>
      </div>

      <h1 className="
        text-3xl sm:text-4xl font-extrabold 
        bg-clip-text text-transparent 
        bg-gradient-to-r from-gray-900 to-gray-600 
        dark:from-white dark:to-gray-300
      ">
        Career Analysis Report
      </h1>

      <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl text-base sm:text-lg leading-relaxed">
        Summary of how your profile aligns with the <strong className="text-gray-800 dark:text-gray-200">Job Requirements</strong>, based on our AI-powered evaluation.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-3">

      <button
        onClick={handleShare}
        className="
          group flex items-center gap-2 px-5 py-2.5 
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 
          rounded-xl shadow-sm 
          hover:bg-gray-50 dark:hover:bg-gray-750 
          transition-all
        "
      >
        {shareCopied ? (
          <Check size={18} className="text-green-500" />
        ) : (
          <Share2 size={18} className="text-gray-600 dark:text-gray-300" />
        )}
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {shareCopied ? "Copied" : "Share"}
        </span>
      </button>

      <div className="relative">
        <button
          onClick={() => setExportMenuOpen(!exportMenuOpen)}
          className="
            flex items-center gap-2 px-5 py-2.5  
            bg-white dark:bg-gray-800  
            border border-gray-200 dark:border-gray-700 
            rounded-xl shadow-sm 
            hover:bg-gray-50 dark:hover:bg-gray-750 
            transition-all
          "
        >
          <Download size={18} className="text-gray-600 dark:text-gray-300" />
          <span className="font-medium text-gray-700 dark:text-gray-200">Export</span>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`} 
          />
        </button>

        {exportMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setExportMenuOpen(false)} 
            />

            <div className="
              absolute right-0 top-full mt-2 w-48 
              bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700  
              rounded-xl shadow-xl z-40 p-1 
              animate-in fade-in zoom-in-95 duration-150
            ">
              <button 
                onClick={handleTxtExport}
                className="
                  w-full flex items-center gap-3 px-3 py-2 
                  text-sm text-gray-700 dark:text-gray-200 
                  hover:bg-gray-100 dark:hover:bg-gray-700 
                  rounded-lg transition-colors text-left
                "
              >
                <FileText size={16} className="text-indigo-500" /> 
                Save as .TXT
              </button>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onEdit}
        className="
          flex items-center gap-2 px-5 py-2.5 
          bg-gradient-to-r from-indigo-600 to-blue-600 
          text-white rounded-xl shadow-md 
          hover:shadow-lg hover:scale-105 
          transition-all duration-300 font-semibold
        "
      >
        <RefreshCw size={18} />
        Re-analyze
      </button>

    </div>
  </div>
</div>

{overallScore === 0 &&
 presentSkillsCount === 0 &&
 (resumeText?.length || 0) < 200 && (
  <div className="
    mt-4 p-4 rounded-xl 
    bg-amber-100 dark:bg-amber-900/20 
    text-amber-800 dark:text-amber-300 
    border border-amber-300 dark:border-amber-700
    flex items-start gap-3
  ">
 
    <p className="text-sm leading-relaxed font-medium">
      Note : We could not fully read your resume. This usually happens with 
      <strong> scanned PDFs or image-based resumes</strong>.  
      <br />
      For best results, please upload a <strong>text-based PDF</strong> or try the 
      <strong> Paste Resume Text</strong> option.
    </p>
  </div> 
)}
<br></br>

{/* Tabs */}
<div className="sticky top-14 sm:top-20 lg:top-24 z-20 mb-8 overflow-x-auto pb-2 scrollbar-hide ">
<div className="
  flex items-center gap-2 
  bg-white/60 dark:bg-gray-900/50 
  backdrop-blur-xl 
  border border-indigo-300/30 dark:border-indigo-400/20
  p-1.5 rounded-2xl 
  w-max mx-auto shadow-lg shadow-gray-200/20 dark:shadow-black/20
">


    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold 
                    transition-all duration-300 ${
          activeTab === tab.id
            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105 ring-1 ring-gray-100 dark:ring-gray-700'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
        }`}
      >
        <tab.icon size={16} className={activeTab === tab.id ? 'animate-pulse' : ''} />
        {tab.label}
      </button>
    ))}
  </div>
</div>

      <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {extractionFailed && (
  <div className="
    mb-8 p-5 rounded-2xl
    bg-red-100/60 dark:bg-red-900/30 
    border border-red-300/40 dark:border-red-700/40
    text-red-700 dark:text-red-300
    shadow-sm backdrop-blur-md
  ">
    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
      <XCircle size={20} className="text-red-500" />
      Unable to Read Your PDF
    </h3>

    <p className="text-sm leading-relaxed">
      Your uploaded PDF appears to be scanned or image-based. Our system couldn't extract text, so your
      results may be incomplete or inaccurate.
      <br />
      <span className="font-semibold">Try uploading a text-based PDF or use the “Paste” mode for best accuracy.</span>
    </p>
  </div>
)}

     {/* OVERVIEW */}
{activeTab === "overview" && (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="
        md:col-span-2 
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl p-6 shadow-sm
      ">
        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
          Overall Match
        </h3>

        <div className="flex items-center justify-between">

          <div>
            <div className="flex items-end gap-2">
              <span
                className={`
                  text-5xl font-black 
                  ${
                    overallScore >= 8
                      ? "text-emerald-600 dark:text-emerald-400"
                      : overallScore >= 6
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }
                `}
              >
                {overallScore.toFixed(1)}
              </span>
              <span className="text-xl text-gray-400 font-bold">/10</span>
            </div>

            <p
              className={`
                mt-2 text-lg font-semibold
                ${
                  overallScore >= 8
                    ? "text-emerald-700 dark:text-emerald-300"
                    : overallScore >= 6
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-rose-700 dark:text-rose-300"
                }
              `}
            >
              {safeResult.matchLevel}
            </p>

            {previousScore && (
              <div className="
                inline-flex items-center gap-2 
                px-3 py-1 mt-3 
                text-sm rounded-lg 
                bg-gray-50 dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700
              ">
                <span className="text-gray-500">Previous:</span>
                <span className="font-bold">{previousScore}</span>
                {overallScore > previousScore && (
                  <span className="text-emerald-500 text-xs">▲ Improved</span>
                )}
              </div>
            )}
          </div>

  
<div className="relative w-28 h-28 flex items-center justify-center">

  <svg className="w-full h-full transform -rotate-90">
    <circle
      cx="56"
      cy="56"
      r="48"
      strokeWidth="10"
      fill="transparent"
      className="text-gray-200 dark:text-gray-700 opacity-40"
    />
    <circle
      cx="56"
      cy="56"
      r="48"
      strokeWidth="10"
      fill="transparent"
      strokeDasharray={301.44}
      strokeDashoffset={301.44 - (301.44 * overallScore) / 10}
      className={`text-${scoreColor}-500 transition-all duration-700`}
      strokeLinecap="round"
    />
  </svg>

  <div className="
    absolute -top-10 -right-2
    p-2 rounded-xl 
    bg-white dark:bg-gray-800 
    shadow-md border border-gray-200 dark:border-gray-700
  ">
    <Award
      className={`text-${scoreColor}-500`}
      size={20}
    />
  </div>

</div>

        </div>
      </div>

      <div className="
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl p-6 shadow-sm
      ">
        <div className="flex justify-between mb-4">
          <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
            ATS Compatibility
          </h3>
          <Target className="text-blue-500" size={20} />
        </div>

        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {safeResult.atsScore}%
        </p>

        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${safeResult.atsScore}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-gray-500">Parsability by automated systems</p>
      </div>


      <div className="
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl p-6 shadow-sm
      ">
        <div className="flex justify-between mb-4">
          <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
            Skills Match
          </h3>
          <Database className="text-purple-500" size={20} />
        </div>

        <div className="flex items-end gap-1">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {presentSkillsCount}
          </p>
          <span className="text-sm text-gray-500">/ {totalSkills} total</span>
        </div>

        <div className="flex h-2 mt-3">
          <div className="bg-emerald-500 rounded-l-full" style={{ flex: presentSkillsCount }}></div>
          <div className="bg-rose-400 rounded-r-full" style={{ flex: missingSkillsCount }}></div>
        </div>

        <p className="mt-2 text-xs text-gray-500">{matchPercentage}% skills found</p>
      </div>
    </div>

    <div className="
      bg-white dark:bg-gray-900 
      border border-gray-200 dark:border-gray-700 
      rounded-2xl p-6 shadow-sm
    ">
     <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-4">
  <Bot className="text-indigo-500" /> Analysis Summary
</h3>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {safeResult.summary}
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">

      <div className="
        bg-emerald-50 dark:bg-emerald-900/10 
        rounded-xl p-5 border border-emerald-200 dark:border-emerald-800
      ">
        <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3">
          <CheckCircle size={18} /> Top Strengths
        </h4>

        <ul className="space-y-2">
          {strengths.slice(0, 3).map((item, i) => (
            <li key={i} className="text-sm text-gray-800 dark:text-gray-200 flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
              {item.message}
            </li>
          ))}
        </ul>
      </div>

      <div className="
        bg-amber-50 dark:bg-amber-900/10 
        rounded-xl p-5 border border-amber-200 dark:border-amber-800
      ">
        <h4 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
          <TrendingUp size={18} /> Priority Improvements
        </h4>

        {improvements.length > 0 ? (
          <ul className="space-y-2">
            {improvements.slice(0, 3).map((item, i) => (
              <li key={i} className="text-sm text-gray-800 dark:text-gray-200 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                {item.message}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
            <Trophy size={20} />
            <div>
              <p className="font-bold text-sm">Mastery Achieved</p>
              <p className="text-xs opacity-80">No critical gaps identified.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}


        {/* SKILLS TAB */}
{activeTab === "skills" && (
  <div className="space-y-8">

    <div className="relative">
      <div
        className="
          flex items-center gap-3
          bg-white dark:bg-gray-900
          border border-indigo-200 dark:border-indigo-700
          rounded-xl px-4 py-2.5
          shadow-sm
        "
      >
        <Search
          size={20}
          className="text-indigo-600 dark:text-indigo-400"
        />

        <input
          type="text"
          placeholder="Search skills (e.g., React, SQL, Java)..."
          value={searchSkill}
          onChange={(e) => setSearchSkill(e.target.value)}
          className="
            flex-1 bg-transparent outline-none
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
          "
        />
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">


      <div className="
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl p-6 shadow
      ">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={20} /> Matched Skills
          </h3>
          <span className="
            bg-emerald-100 dark:bg-emerald-900/30 
            text-emerald-700 dark:text-emerald-300 
            px-3 py-1 rounded-full text-xs font-semibold
          ">
            {filteredPresent.length} Found
          </span>
        </div>

        {filteredPresent.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filteredPresent.map((skill, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-2
                  px-3 py-1.5
                  bg-gray-50 dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-lg shadow-sm
                  hover:shadow-md hover:scale-[1.02]
                  transition cursor-default
                "
              >
                {getCategoryIcon(skill.category)}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {skill.name}
                </span>
                <span className="text-[10px] uppercase text-gray-500">
                  {skill.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-6">
            No matched skills found.
          </p>
        )}
      </div>

<div className="
  bg-white dark:bg-gray-900
  border border-gray-200 dark:border-gray-700
  rounded-2xl p-6 shadow
">
  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <XCircle className="text-rose-600 dark:text-rose-300" size={20} /> Missing Skills
    </h3>
    <span className="
      bg-rose-100 dark:bg-rose-900/20
      text-rose-700 dark:text-rose-300
      px-3 py-1 rounded-full text-xs font-semibold
    ">
      {filteredMissing.length} Missing
    </span>
  </div>

  {filteredMissing.length > 0 ? (
    <div className="space-y-3">
      {filteredMissing.map((skill, i) => (
        <div
          key={i}
          className="
            flex items-center justify-between
            p-4 rounded-xl
            bg-rose-50 dark:bg-rose-900/10
            border border-rose-200 dark:border-rose-800/20
            hover:bg-rose-100 dark:hover:bg-rose-900/20
            transition
          "
        >
          <div className="flex items-center gap-3">
            <div className="
              p-2 bg-white dark:bg-gray-800
              rounded-lg shadow-sm
              text-rose-600 dark:text-rose-300
            ">
              {getCategoryIcon(skill.category)}
            </div>

            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {skill.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {skill.category}
              </p>
            </div>
          </div>

          <span className="
            text-xs font-semibold 
            text-rose-700 dark:text-rose-300
            bg-white dark:bg-gray-800
            px-2 py-1 rounded-md
            border border-rose-200 dark:border-rose-800/20
          ">
            Critical
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="
        w-16 h-16 
        bg-emerald-200 dark:bg-emerald-900/20 
        rounded-full flex items-center justify-center 
        border border-emerald-300 dark:border-emerald-800
      ">
        <Trophy className="text-emerald-600 dark:text-emerald-300" size={32} />
      </div>
      <h4 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
        All Skills Matched!
      </h4>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
        You meet all the required skills for this role.
      </p>
    </div>
  )}
</div>

    </div>
  </div>
)}


        {/* LEARNING PATH TAB */}
{activeTab === "learning" && (
  <div className="grid lg:grid-cols-3 gap-8">

    <div className="lg:col-span-2 space-y-8">

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm">

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-300">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Recommended Learning Path
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A structured roadmap based on your missing skills
            </p>
          </div>
        </div>

        {safeResult.learningPath.length > 0 ? (
          <div className="space-y-6">

            {safeResult.learningPath.map((step, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
    
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {index + 1}. {step.skill}
                  </h4>

                  <span
                    className={`
                      text-xs font-bold px-2 py-1 rounded-md border 
                      ${
                        step.priority === "High"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : step.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }
                    `}
                  >
                    {step.priority}
                  </span>
                </div>

        
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> {step.timeEstimate}
                  </div>

                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    Difficulty:{" "}
                    <span className="font-semibold">
                      {step.difficulty || "Medium"}
                    </span>
                  </div>
                </div>

             
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                    Resources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.resources.map((res, r) => (
                      <a
                        key={r}
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          res + " " + step.skill
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          px-3 py-1.5 text-xs rounded-lg 
                          bg-white dark:bg-gray-700 border 
                          border-gray-200 dark:border-gray-600 
                          hover:bg-indigo-50 dark:hover:bg-indigo-900 
                          transition text-gray-700 dark:text-gray-300 flex items-center gap-1
                        "
                      >
                        {res}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>

           
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                    Suggested Project
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.projectSuggestion ||
                      `Build a mini project using ${step.skill} to strengthen your practical understanding.`}
                  </p>
                </div>
              </div>
            ))}

          </div>
        ) : (
  
          <div className="text-center py-12 px-6 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="w-16 h-16 border-2 border-indigo-300 dark:border-indigo-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Sparkles size={26} className="text-indigo-600 dark:text-indigo-300" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              You're Already Qualified!
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              You match all required skills. Consider focusing on advanced topics like:
              <span className="font-medium"> system design</span>,{" "}
              <span className="font-medium">cloud architecture</span>, and{" "}
              <span className="font-medium">communication skills</span>.
            </p>
          </div>
        )}

      </div>
    </div>

    <div className="space-y-8">

      <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-500" /> Pro Tip
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {safeResult.learningPath.length > 0
            ? "Combine multiple missing skills into one project. This accelerates learning and strengthens resume impact."
            : "Since your skills match the job, shift your focus to mock interviews and real-world project depth."}
        </p>
      </div>

  
      <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Brain size={18} className="text-indigo-600" /> Study Techniques
        </h3>

        <div className="space-y-4">

      
          {[
            { title: "Pomodoro", desc: "25m work, 5m break", icon: Clock },
            { title: "Feynman", desc: "Explain to learn deeply", icon: Users },
            { title: "Active Recall", desc: "Self-test frequently", icon: Zap },
            { title: "Spaced Repetition", desc: "Review at increasing intervals", icon: BookOpen },
          ].map((tech, i) => (
            <div
              key={i}
              className="
                flex items-center gap-3 p-3 
                bg-gray-50 dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 
                rounded-xl shadow-sm hover:shadow-md transition
              "
            >
              <tech.icon size={18} className="text-indigo-600" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{tech.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{tech.desc}</p>
              </div>
            </div>
          ))}

        </div>
      </div>

    </div>
  </div>
)}


       {/* GUIDANCE TAB */}
{activeTab === "guidance" && (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 lg:p-10 shadow-sm">
    
    <div className="max-w-3xl mx-auto">

      <div className="flex items-center justify-center mb-8">
        <div className="
          w-20 h-20 
          bg-indigo-100 dark:bg-indigo-900 
          rounded-2xl flex items-center justify-center 
          shadow-sm border border-indigo-200 dark:border-indigo-700
        ">
          <Bot size={40} className="text-indigo-600 dark:text-indigo-300" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI Career Coach
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
          Personalized guidance based on your resume, skills, and job role.
        </p>
      </div>


      <div className="
        bg-gray-50 dark:bg-gray-800 
        rounded-2xl p-8
        border border-gray-200 dark:border-gray-700 
        shadow-sm
      ">

        <div className="w-full h-1 bg-indigo-500 rounded-full mb-4"></div>

   
        <div className="prose dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300">
          {renderMarkdown(safeResult.aiGuidance)}
        </div>
      </div>


      <div className="
        mt-10 p-6 
        rounded-2xl 
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700
        shadow-sm
      ">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-500" />
          AI Insight
        </h3>

        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
          {safeResult.learningPath.length > 0
            ? "Consider combining 2–3 missing skills into a mini project. This accelerates learning and boosts your resume impact."
            : "Your skills already match the role. Focus on enhancing communication, problem-solving stories, and mock interviews."}
        </p>
      </div>


      <div className="mt-10 flex flex-col items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
          Want deeper clarification?
        </p>

        <button
          onClick={onOpenAIChat}
          className="
            flex items-center gap-3 
            px-8 py-4 
            bg-indigo-600 hover:bg-indigo-700 
            text-white rounded-2xl 
            font-semibold shadow-md hover:shadow-lg 
            transition-all duration-300 active:scale-95
          "
        >
          <MessageSquare size={20} />
          Ask the AI Coach
        </button>
      </div>

    </div>
  </div>
)}

{/* INSIGHTS TAB */}
{activeTab === "insights" && (
  <>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

 
      <div className="
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl p-6 shadow-sm
      ">
        <div className="flex items-center gap-3 mb-5">
          <div className="
            p-2 bg-emerald-100 dark:bg-emerald-900/30 
            rounded-xl border border-emerald-200 dark:border-emerald-800
          ">
            <Award className="text-emerald-600 dark:text-emerald-300" size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Key Strengths
          </h3>
        </div>

        {strengths.length > 0 ? (
          <ul className="space-y-3">
            {strengths.map((item, idx) => (
              <li 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl 
                           bg-gray-50 dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle className="text-emerald-500 mt-0.5" size={16} />
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No strengths identified.</p>
        )}
      </div>

  
      <div className="
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl p-6 shadow-sm
      ">
        <div className="flex items-center gap-3 mb-5">
          <div className="
            p-2 bg-rose-100 dark:bg-rose-900/30 
            rounded-xl border border-rose-200 dark:border-rose-800
          ">
            <TrendingUp className="text-rose-600 dark:text-rose-300" size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Growth Areas
          </h3>
        </div>

        {improvements.length > 0 ? (
          <ul className="space-y-3">
            {improvements.map((item, idx) => (
              <li 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl 
                           bg-gray-50 dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700"
              >
                <ArrowUpRight className="text-rose-500 mt-0.5" size={16} />
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <Trophy size={36} className="mx-auto mb-2 text-emerald-500" />
            <p className="text-gray-900 dark:text-gray-100 font-semibold">
              Mastery Achieved
            </p>
            <p className="text-xs text-gray-500 mt-1">
              No major improvement areas found.
            </p>
          </div>
        )}
      </div>

      <div className="
        bg-white dark:bg-gray-900 
        border border-gray-200 dark:border-gray-700 
        rounded-2xl p-6 shadow-sm
      ">
        <div className="flex items-center gap-3 mb-5">
          <div className="
            p-2 bg-blue-100 dark:bg-blue-900/30 
            rounded-xl border border-blue-200 dark:border-blue-800
          ">
            <Lightbulb className="text-blue-600 dark:text-blue-300" size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Strategic Advice
          </h3>
        </div>

        {advice.length > 0 ? (
          <ul className="space-y-3">
            {advice.map((item, idx) => (
              <li 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl 
                           bg-gray-50 dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700"
              >
                <Sparkles className="text-blue-500 mt-0.5" size={16} />
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No advice available.</p>
        )}
      </div>

    </div>

    
    <div className="w-full flex justify-center mt-8">
      <button 
        onClick={onOpenAIChat}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 
                   text-white text-sm font-semibold rounded-xl 
                   shadow-md hover:shadow-lg transition-all"
      >
        Want deeper clarification? Ask AI →
      </button>
    </div>
  </>
)}
    </div>
      <div className="mt-16 text-center border-t border-gray-200/50 dark:border-gray-800/50 pt-8 pb-4">
        <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
          Career Compass AI • Enhanced Analysis Engine
        </p>
      </div>
    </div>
  );
};

export default ResultsView;