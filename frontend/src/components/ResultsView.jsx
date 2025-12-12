import React, { useState } from 'react';
import { 
  PieChart, CheckCircle, XCircle, BookOpen, Brain, Download, 
  RefreshCw, Award, TrendingUp, FileText, ChevronDown, ExternalLink, 
  Calendar, Target, Search, Zap, Users, Code, Database, 
  Cloud, Settings, Clock, ChevronRight, ArrowUpRight, Sparkles, 
  MessageSquare, Bot, Share2, Check, Trophy, Lightbulb, GraduationCap
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
    { id: 'guidance', icon: Brain, label: 'AI Coach' },
    { id: 'insights', icon: Award, label: 'Insights' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 px-2 sm:px-4 lg:px-6 font-sans">
      
      {/* Header */}
      <div className="relative mb-8 pt-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10 rounded-full" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-700/50">
                Analysis Complete
              </span>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Calendar size={12} /> {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Career Analysis Report
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
              Here is how your profile matches the <strong>Job Requirements</strong> based on our deep learning models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleShare}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
            >
              {shareCopied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} className="text-gray-600 dark:text-gray-300" />}
              <span className="font-medium text-gray-700 dark:text-gray-200">{shareCopied ? 'Copied' : 'Share'}</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
              >
                <Download size={18} className="text-gray-600 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-200">Export</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl z-40 p-1 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={handleTxtExport} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                      <FileText size={16} className="text-blue-500" /> Save as .TXT
                    </button>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300"
            >
              <RefreshCw size={18} />
              <span className="font-semibold">Re-analyze</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-4 z-20 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-1.5 rounded-2xl w-max mx-auto shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
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

      {/* Content Area */}
      <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Score Card */}
              <div className="md:col-span-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br from-${scoreColor}-500/5 via-transparent to-transparent`} />
                <div className="flex flex-row items-center justify-between h-full relative z-10">
                  <div className="flex-1">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-xs mb-1">Overall Match</h3>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-black text-${scoreColor}-600 dark:text-${scoreColor}-400 tracking-tight`}>
                        {overallScore}
                      </span>
                      <span className="text-2xl text-gray-400 font-bold">/10</span>
                    </div>
                    <p className={`mt-2 font-semibold text-lg text-${scoreColor}-700 dark:text-${scoreColor}-300`}>
                      {safeResult.matchLevel}
                    </p>
                    
                    {previousScore && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-gray-700/50 rounded-lg text-sm border border-gray-100 dark:border-gray-600">
                         <span className="text-gray-500">Previous:</span>
                         <span className="font-bold">{previousScore}</span>
                         {Number(overallScore) > Number(previousScore) && <span className="text-emerald-500 text-xs">▲ Improved</span>}
                      </div>
                    )}
                  </div>

                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200 dark:text-gray-700 opacity-30" />
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={351.86} 
                        strokeDashoffset={351.86 - (351.86 * overallScore) / 10} 
                        className={`text-${scoreColor}-500 transition-all duration-1000 ease-out`} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Award className={`w-10 h-10 text-${scoreColor}-500`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ATS Score */}
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">ATS Compatibility</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{safeResult.atsScore}%</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                    <Target size={20} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${safeResult.atsScore}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-3">Parsability by automated systems</p>
              </div>

              {/* Skills Ratio */}
              <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Skills Match</h3>
                    <div className="flex items-end gap-1 mt-1">
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">{presentSkillsCount}</p>
                        <span className="text-sm text-gray-500 mb-1">/ {totalSkills} total</span>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
                    <Database size={20} />
                  </div>
                </div>
                <div className="flex gap-1 h-2">
                    <div className="bg-emerald-500 rounded-l-full" style={{flex: presentSkillsCount}}></div>
                    <div className="bg-rose-400 rounded-r-full" style={{flex: missingSkillsCount}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-3">{matchPercentage}% skills found in resume</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-lg">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white mb-4">
                    <Bot className="text-indigo-500" /> Executive Summary
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                    {safeResult.summary}
                </p>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-5 backdrop-blur-sm">
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} /> Top Strengths
                    </h4>
                    <ul className="space-y-2">
                        {strengths.slice(0, 3).map((insight, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-emerald-900 dark:text-emerald-200">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"/>
                                {insight.message}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-center">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <TrendingUp size={18} /> Priority Improvements
                    </h4>
                    {improvements.length > 0 ? (
                      <ul className="space-y-2">
                          {improvements.slice(0, 3).map((insight, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"/>
                                  {insight.message}
                              </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                        <Trophy size={20} className="text-emerald-500" />
                        <div>
                            <p className="text-sm font-bold">Mastery Achieved</p>
                            <p className="text-xs opacity-90">No critical gaps! You are a perfect match.</p>
                        </div>
                      </div>
                    )}
                </div>
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-1 flex items-center border border-white/20 dark:border-gray-700">
                    <Search className="ml-3 text-gray-400" size={20}/>
                    <input 
                        type="text"
                        placeholder="Search for a specific skill (e.g., 'React', 'Python')..."
                        value={searchSkill}
                        onChange={(e) => setSearchSkill(e.target.value)}
                        className="w-full bg-transparent p-3 outline-none text-gray-800 dark:text-white placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Present Skills */}
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-200/50 dark:border-gray-700/50 pb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <CheckCircle className="text-emerald-500" /> Matched Skills
                        </h3>
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                            {filteredPresent.length} Found
                        </span>
                    </div>
                    
                    {filteredPresent.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {filteredPresent.map((skill, i) => (
                                <div key={i} className="group flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-800/50 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-default">
                                    {getCategoryIcon(skill.category)}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{skill.name}</span>
                                    <span className="text-[10px] uppercase text-gray-400 ml-1">{skill.category}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center py-8">No matching skills found.</p>
                    )}
                </div>

                {/* Missing Skills */}
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-6 border-b border-gray-200/50 dark:border-gray-700/50 pb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <XCircle className="text-rose-500" /> Missing Skills
                        </h3>
                        <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold">
                            {filteredMissing.length} Missing
                        </span>
                    </div>

                    {filteredMissing.length > 0 ? (
                        <div className="space-y-3">
                            {filteredMissing.map((skill, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-xl hover:bg-rose-100/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-rose-500">
                                            {getCategoryIcon(skill.category)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{skill.name}</p>
                                            <p className="text-xs text-gray-500">{skill.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-800/30">
                                        Critical
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-50 dark:border-emerald-800/50">
                                <Trophy className="text-emerald-500" size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white">All Skills Matched!</h4>
                            <p className="text-gray-500 text-sm mt-1 max-w-xs">
                                You possess all the required skills for this job. You are a top-tier candidate.
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        {/* LEARNING PATH TAB */}
        {activeTab === 'learning' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recommended Learning Path</h3>
                            <p className="text-sm text-gray-500">Step-by-step plan to bridge your skill gaps</p>
                        </div>
                    </div>

                    {safeResult.learningPath.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {safeResult.learningPath.map((step, index) => (
                                <div key={index} className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <GraduationCap size={20} />
                                            </div>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                                step.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {step.priority}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-bold text-gray-800 dark:text-white mb-1 text-lg">{step.skill}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                            <Clock size={12}/> 
                                            <span>Est. Time: {step.timeEstimate}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resources</p>
                                            <div className="flex flex-wrap gap-2">
                                                {step.resources.map((res, r) => (
                                                    <a href={`https://www.google.com/search?q=${encodeURIComponent(res + ' ' + step.skill)}`} 
                                                       target="_blank" rel="noreferrer"
                                                       key={r}
                                                       className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                                                    >
                                                        {res} <ExternalLink size={10} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6 bg-gradient-to-b from-indigo-50/50 to-white/50 dark:from-gray-800 dark:to-gray-900/50 rounded-2xl border border-dashed border-indigo-200 dark:border-gray-700">
                            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100 dark:border-indigo-900">
                                <Sparkles className="text-indigo-500" size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're Up to Speed!</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                                You have all the core skills for this role. To stay competitive, we recommend focusing on advanced concepts or leadership skills.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                {["System Design", "Cloud Architecture", "Team Leadership"].map((topic, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{topic}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <Sparkles className="absolute top-4 right-4 text-white/20 w-24 h-24 rotate-12" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Lightbulb size={18} className="text-yellow-300" />
                            </div>
                            <h3 className="font-bold text-lg">Pro Tip</h3>
                        </div>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            {safeResult.learningPath.length > 0 
                                ? "Don't just watch tutorials. Build a small project that combines multiple missing skills to learn 2x faster." 
                                : "Since you match the technical skills, focus your interview prep on behavioral questions and cultural fit."}
                        </p>
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-lg">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Brain size={18} className="text-indigo-500" />
                        Study Techniques
                    </h3>
                    <div className="space-y-3">
                        {[
                            { title: "Pomodoro", desc: "25m focus, 5m break", icon: Clock, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
                            { title: "Feynman", desc: "Teach it to learn it", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                            { title: "Active Recall", desc: "Test frequently", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" }
                        ].map((tech, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className={`p-2 rounded-lg ${tech.bg} ${tech.color}`}>
                                    <tech.icon size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{tech.title}</p>
                                    <p className="text-xs text-gray-500">{tech.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* GUIDANCE TAB */}
        {activeTab === 'guidance' && (
           <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 lg:p-10 shadow-xl">
             <div className="max-w-3xl mx-auto">
               <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-6 transition-transform">
                    <Bot size={40} className="text-white" />
                  </div>
               </div>
               
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">AI Career Coach</h2>
                 <p className="text-gray-500 mt-2 text-lg">Personalized feedback based on your resume and target role.</p>
               </div>

               <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>
                  <div className="prose prose-indigo dark:prose-invert max-w-none">
                      {renderMarkdown(safeResult.aiGuidance)}
                  </div>
               </div>

               <div className="mt-8 flex flex-col items-center">
                 <p className="text-sm text-gray-500 mb-4 font-medium">Have specific questions about this analysis?</p>
                 <button 
                  onClick={onOpenAIChat}
                  className="group flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                 >
                   <MessageSquare size={20} className="group-hover:animate-bounce" />
                   Start Detailed Conversation
                 </button>
               </div>
             </div>
           </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 backdrop-blur-xl border border-emerald-100 dark:border-emerald-800/30 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900">
                          <Award size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Key Strengths</h3>
                  </div>
                  {strengths.length > 0 ? (
                    <ul className="space-y-3 relative z-10">
                        {strengths.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-white/50 dark:border-gray-700/50 shadow-sm">
                                <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-gray-800 dark:text-gray-200 font-medium text-sm leading-snug">{item.message}</p>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No specific strengths highlighted.</p>
                  )}
              </div>

              <div className="bg-rose-50/50 dark:bg-rose-900/10 backdrop-blur-xl border border-rose-100 dark:border-rose-800/30 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl text-rose-500 shadow-sm border border-rose-100 dark:border-rose-900">
                          <TrendingUp size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100">Growth Areas</h3>
                  </div>
                  {improvements.length > 0 ? (
                    <ul className="space-y-3 relative z-10">
                        {improvements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-white/50 dark:border-gray-700/50 shadow-sm">
                                <ArrowUpRight size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                <p className="text-gray-800 dark:text-gray-200 font-medium text-sm leading-snug">{item.message}</p>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center relative z-10">
                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 shadow-sm">
                            <Trophy className="text-rose-400" size={32} />
                        </div>
                        <p className="text-gray-800 dark:text-white font-bold">Mastery Achieved</p>
                        <p className="text-xs text-gray-500 mt-1">No critical improvements needed.</p>
                    </div>
                  )}
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-xl border border-blue-100 dark:border-blue-800/30 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl text-blue-500 shadow-sm border border-blue-100 dark:border-blue-900">
                          <Lightbulb size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Strategic Advice</h3>
                  </div>
                  {advice.length > 0 ? (
                    <ul className="space-y-3 relative z-10">
                        {advice.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-white/50 dark:border-gray-700/50 shadow-sm">
                                <Sparkles size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-gray-800 dark:text-gray-200 font-medium text-sm leading-snug">{item.message}</p>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No strategic advice available.</p>
                  )}
              </div>
           </div>
        )}

      </div>

      <div className="mt-16 text-center border-t border-gray-200/50 dark:border-gray-800/50 pt-8 pb-4">
        <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
          Career Compass AI • Enhanced Analysis Engine v2.0
        </p>
      </div>
    </div>
  );
};

export default ResultsView;