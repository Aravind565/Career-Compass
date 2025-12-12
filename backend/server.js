const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Groq = require("groq-sdk");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
require("dotenv").config();

// Initialize App
const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: '*',
  credentials: true
}));



// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PORT = process.env.PORT || 5000;

const extractText = async (file) => {
  try {
    console.log(`Extracting text from: ${file.originalname}, Type: ${file.mimetype}`);
    
    if (file.mimetype === "application/pdf") {
      try {
        const data = await pdfParse(file.buffer);
        if (data.text && data.text.trim().length >= 10) {
          console.log(`Successfully extracted ${data.text.length} characters via pdf-parse`);
          return data.text;
        }
      } catch (pdfError) {
        console.log("Standard PDF parse failed:", pdfError.message);
      }
      
      try {
        const text = file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 50000));
        if (text && text.length > 10) {
          return text;
        }
      } catch (error) {
        console.log("Fallback extraction failed:", error.message);
      }
      
      throw new Error("Could not extract text from PDF");
      
    } else if (file.mimetype.includes("word") || 
               file.originalname.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
      
    } else if (file.mimetype === "text/plain" || 
               file.originalname.toLowerCase().endsWith('.txt')) {
      return file.buffer.toString('utf-8');
      
    } else {
      const text = file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 100000));
      if (text && text.length > 10) {
        return text;
      }
      throw new Error("Unsupported file format. Please use PDF, DOCX, or TXT.");
    }
  } catch (error) {
    console.error("Error in extractText:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

function extractAllSkills(text) {
  if (!text || text.trim().length === 0) return [];
  
  const skills = [];
  const textLower = text.toLowerCase();
  const categories = {
    'Programming Languages': [
      // Core programming
      'c++', 'c#', 'c language', 'java', 'python', 'javascript', 'typescript',
      'ruby', 'php', 'go', 'golang', 'rust', 'swift', 'kotlin', 'scala', 'perl',
      'r programming', 'r language', 'matlab', 'objective-c', 'dart', 'lua',
      'haskell', 'erlang', 'elixir', 'clojure', 'f#', 'visual basic', 'vba',
      'assembly', 'fortran', 'cobol', 'pascal', 'ada', 'bash', 'shell scripting',
      'powershell'
    ],
    
    'Web Development': [
      'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'stylus',
      'react', 'react.js', 'angular', 'angular.js', 'vue', 'vue.js', 'next.js',
      'nuxt.js', 'svelte', 'sveltekit', 'ember.js', 'backbone.js', 'jquery',
      'bootstrap', 'tailwind css', 'material-ui', 'ant design', 'chakra ui',
      'webpack', 'vite', 'parcel', 'rollup', 'gulp', 'grunt', 'babel',
      'webgl', 'three.js', 'd3.js', 'chart.js'
    ],
    
    'Backend Development': [
      'node.js', 'express.js', 'nest.js', 'django', 'flask', 'fastapi',
      'spring', 'spring boot', 'laravel', 'symfony', 'ruby on rails',
      'asp.net', '.net core', 'play framework', 'phoenix', 'gin', 'echo',
      'koa', 'hapi', 'sails.js'
    ],
    
    'Mobile Development': [
      'react native', 'flutter', 'ionic', 'xamarin', 'cordova', 'phonegap',
      'android studio', 'xcode', 'swiftui', 'jetpack compose', 'kotlin multiplatform'
    ],
    
    'Databases': [
      'sql', 'mysql', 'postgresql', 'mariadb', 'oracle database', 'sql server',
      'sqlite', 'db2', 'cassandra', 'cockroachdb',
      'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'firebase',
      'couchdb', 'neo4j', 'arangodb', 'rethinkdb', 'hbase', 'couchbase',
      'graphql', 'apollo', 'prisma', 'sequelize', 'typeorm', 'mongoose'
    ],
    
    'Cloud & DevOps': [
      'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud',
      'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab ci', 'github actions',
      'circleci', 'travis ci', 'ansible', 'terraform', 'puppet', 'chef',
      'prometheus', 'grafana', 'elk stack', 'splunk', 'new relic', 'datadog',
      'nginx', 'apache', 'iis', 'linux', 'unix', 'centos', 'ubuntu', 'debian',
      'red hat', 'fedora', 'windows server'
    ],
    
    'Software Tools': [
      'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
      'jira', 'confluence', 'trello', 'asana', 'notion', 'slack',
      'microsoft teams', 'zoom', 'postman', 'insomnia', 'swagger',
      'figma', 'adobe xd', 'sketch', 'invision', 'zeplin'
    ],
    
    'Data Science & AI': [
      'data analysis', 'data visualization', 'machine learning', 'deep learning',
      'artificial intelligence', 'computer vision', 'natural language processing',
      'numpy', 'pandas', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
      'opencv', 'nltk', 'spacy', 'hugging face', 'apache spark', 'hadoop',
      'tableau', 'power bi', 'looker', 'qlik', 'matplotlib', 'seaborn',
      'plotly', 'jupyter', 'colab', 'apache kafka', 'airflow', 'dbt'
    ],
    
    'Cybersecurity': [
      'network security', 'application security', 'cloud security', 'devsecops',
      'penetration testing', 'ethical hacking', 'vulnerability assessment',
      'siem', 'soc', 'firewall', 'vpn', 'ids', 'ips', 'owasp', 'cryptography',
      'ssl', 'tls', 'pki', 'iam', 'saml', 'oauth', 'openid connect'
    ],
    
    'QA & Testing': [
      'manual testing', 'automated testing', 'selenium', 'cypress', 'jest',
      'mocha', 'chai', 'jasmine', 'pytest', 'junit', 'testng', 'postman testing',
      'soapui', 'load testing', 'performance testing', 'jmeter', 'gatling',
      'security testing', 'owasp zap', 'burp suite'
    ],
    
    'Mechanical Engineering': [
      'cad', 'computer-aided design', 'solidworks', 'autocad', 'catia',
      'inventor', 'creo', 'nx', 'fusion 360', 'solid edge',
      'finite element analysis', 'fea', 'ansys', 'abaqus', 'comsol',
      'computational fluid dynamics', 'cfd', 'fluent', 'openfoam',
      'thermodynamics', 'heat transfer', 'fluid mechanics', 'hydraulics',
      'pneumatics', 'mechanical design', 'machine design', 'drafting',
      'gd&t', 'geometric dimensioning and tolerancing',
      'materials science', 'metallurgy', 'composite materials',
      'manufacturing', 'cnc', 'machining', 'turning', 'milling', '3d printing',
      'additive manufacturing', 'welding', 'sheet metal', 'injection molding',
      'robotics', 'automation', 'plc', 'programmable logic controller',
      'mechatronics', 'industrial engineering', 'quality control', 'six sigma'
    ],
    
    'Civil Engineering': [
      'structural analysis', 'structural design', 'staad pro', 'etabs',
      'sap2000', 'civil 3d', 'revit', 'bim', 'building information modeling',
      'surveying', 'geotechnical engineering', 'soil mechanics',
      'foundation design', 'concrete design', 'steel design', 'bridge design',
      'highway design', 'traffic engineering', 'water resources',
      'environmental engineering', 'construction management', 'project management',
      'autodesk civil 3d', 'microstation', 'arcgis', 'qgis'
    ],
    
    'Electrical Engineering': [
      'circuit design', 'pcb design', 'altium', 'kicad', 'eagle',
      'orcad', 'proteus', 'matlab simulink', 'labview',
      'embedded systems', 'microcontroller', 'arduino', 'raspberry pi',
      'esp32', 'stm32', 'pic', 'avr', 'fpga', 'verilog', 'vhdl',
      'power systems', 'electrical machines', 'control systems',
      'digital signal processing', 'dsp', 'vlsi', 'asic design',
      'iot', 'internet of things', 'sensors', 'actuators'
    ],
    
    'Business & Management': [
      'project management', 'agile', 'scrum', 'kanban', 'waterfall',
      'lean', 'six sigma', 'pmp', 'prince2', 'product management',
      'business analysis', 'stakeholder management', 'risk management',
      'financial analysis', 'budgeting', 'forecasting', 'strategic planning',
      'market research', 'digital marketing', 'seo', 'sem', 'social media marketing',
      'content marketing', 'email marketing', 'analytics', 'google analytics',
      'salesforce', 'crm', 'customer relationship management', 'erp', 'sap',
      'supply chain management', 'logistics', 'operations management'
    ],
    
    'Design & Creative': [
      'ui design', 'ux design', 'user experience', 'user interface',
      'graphic design', 'adobe photoshop', 'illustrator', 'indesign',
      'after effects', 'premiere pro', 'final cut pro', 'davinci resolve',
      'motion graphics', '3d modeling', 'blender', 'maya', '3ds max',
      'zbrush', 'substance painter', 'unity', 'unreal engine',
      'game development', 'animation', 'character design', 'illustration'
    ],
    
    'Healthcare & Medical': [
      'medical terminology', 'clinical research', 'health informatics',
      'electronic health records', 'ehr', 'hipaa', 'medical coding',
      'icd-10', 'cpt', 'pharmaceutical', 'biotechnology', 'laboratory techniques',
      'patient care', 'nursing', 'medical devices', 'fda regulations',
      'clinical trials', 'good clinical practice', 'gcp'
    ],
    
    'Education & Academia': [
      'teaching', 'curriculum development', 'lesson planning',
      'educational technology', 'edtech', 'lms', 'learning management system',
      'moodle', 'blackboard', 'canvas', 'instructional design',
      'academic research', 'publication', 'peer review', 'grant writing',
      'scientific writing', 'laboratory skills', 'experimental design'
    ],
    
    'General Skills': [
      'communication', 'teamwork', 'leadership', 'problem solving',
      'critical thinking', 'analytical skills', 'creativity', 'adaptability',
      'time management', 'organization', 'attention to detail',
      'presentation', 'public speaking', 'writing', 'technical writing',
      'customer service', 'negotiation', 'decision making'
    ]
  };
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  Object.entries(categories).forEach(([category, skillList]) => {
    skillList.forEach(skill => {
      const skillLower = skill.toLowerCase();

      if (skillLower.length <= 2) {
        const contextPatterns = {
          'c': ['c programming', 'c language', 'c++', 'c#'],
          'r': ['r programming', 'r language', 'r studio'],
          'ai': ['artificial intelligence', 'ai/ml', 'ai models'],
          'ui': ['user interface', 'ui design', 'ui/ux'],
          'ux': ['user experience', 'ui/ux', 'ux design'],
          'ci': ['continuous integration', 'ci/cd'],
          'cd': ['continuous deployment', 'ci/cd']
        };
        
        if (contextPatterns[skillLower]) {
          const hasContext = contextPatterns[skillLower].some(pattern => 
            textLower.includes(pattern)
          );
          if (!hasContext) return;
        }
      }

      if (textLower.includes(skillLower)) {

        if (skillLower.includes(' ')) {
          try {
            const phrasePattern = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, 'i');
            if (!phrasePattern.test(text)) {
              return; 
            }
          } catch (regexError) {
            console.log(`Regex error for "${skillLower}": ${regexError.message}`);

          }
        } else {
 
          try {
            const wordPattern = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, 'i');
            if (!wordPattern.test(text)) {
              return; 
            }
          } catch (regexError) {
            console.log(`Regex error for "${skillLower}": ${regexError.message}`);

          }
        }
        

        let formattedName = skill.split(' ').map(word => {
       
          if (word.toLowerCase() === 'c++') return 'C++';
          if (word.toLowerCase() === 'c#') return 'C#';
          if (word.toLowerCase() === '.net') return '.NET';
          if (word.toLowerCase() === 'node.js') return 'Node.js';
          if (word.toLowerCase() === 'react.js') return 'React.js';
          if (word.toLowerCase() === 'express.js') return 'Express.js';
          if (word.toLowerCase() === 'typescript') return 'TypeScript';
          if (word.toLowerCase() === 'javascript') return 'JavaScript';
          if (word.toLowerCase() === 'html') return 'HTML';
          if (word.toLowerCase() === 'css') return 'CSS';
          if (word.toLowerCase() === 'sql') return 'SQL';
          if (word.toLowerCase() === 'api') return 'API';
          if (word.toLowerCase() === 'ui') return 'UI';
          if (word.toLowerCase() === 'ux') return 'UX';
          if (word.toLowerCase() === 'ci/cd') return 'CI/CD';
          if (word.toLowerCase() === 'ai') return 'AI';
          if (word.toLowerCase() === 'ml') return 'ML';
          if (word.toLowerCase() === 'iot') return 'IoT';
          if (word.toLowerCase() === 'fea') return 'FEA';
          if (word.toLowerCase() === 'cfd') return 'CFD';
          if (word.toLowerCase() === 'bim') return 'BIM';
          if (word.toLowerCase() === 'plc') return 'PLC';
          if (word.toLowerCase() === 'ehr') return 'EHR';
          if (word.toLowerCase() === 'lms') return 'LMS';
          if (word.toLowerCase() === 'crm') return 'CRM';
          if (word.toLowerCase() === 'erp') return 'ERP';
          if (word.toLowerCase() === 'seo') return 'SEO';
          if (word.toLowerCase() === 'sem') return 'SEM';
          
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
        

        if (!skills.find(s => s.name.toLowerCase() === formattedName.toLowerCase())) {
          skills.push({ 
            name: formattedName, 
            category: category 
          });
        }
      }
    });
  });

  const uniqueSkills = [];
  const seen = new Set();
  
  skills.forEach(skill => {
    const key = `${skill.name.toLowerCase()}|${skill.category}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSkills.push(skill);
    }
  });
  
  return uniqueSkills;
}

const calculateScores = (presentSkills, missingSkills, requiredSkills) => {
  const totalRequired = requiredSkills.length || 1;
  const totalPresent = presentSkills.length;
  const matchRatio = totalPresent / totalRequired;
  
  const baseScore = Math.min(10, Math.max(1, matchRatio * 10));
  const atsScore = Math.min(100, (matchRatio * 100) + (totalPresent * 2));
  
  let experienceLevel = 'mid';
  const techSkillCount = presentSkills.filter(s => 
    ['Programming', 'Frameworks', 'Databases', 'Cloud', 'DevOps', 'Frontend', 'Backend'].includes(s.category)
  ).length;
  
  if (techSkillCount < 2) experienceLevel = 'junior';
  else if (techSkillCount >= 5) experienceLevel = 'senior';
  else if (techSkillCount >= 8) experienceLevel = 'expert';
  
  let matchLevel = 'Needs Improvement';
  if (baseScore >= 8.5) matchLevel = 'Excellent Match';
  else if (baseScore >= 7.0) matchLevel = 'Strong Match';
  else if (baseScore >= 6.0) matchLevel = 'Good Fit';
  else if (baseScore >= 5.0) matchLevel = 'Moderate Match';
  else if (baseScore >= 3.0) matchLevel = 'Needs Improvement';
  else matchLevel = 'Weak Match';
  
  return { 
    baseScore: parseFloat(baseScore.toFixed(1)), 
    atsScore: parseFloat(atsScore.toFixed(1)), 
    experienceLevel, 
    matchLevel 
  };
};

// Function to validate and fix skill extraction
function validateAndFixSkills(aiResponse, jobDesc, resumeText) {
  console.log("Validating and fixing skill extraction...");
  
  // Extract skills from both documents
  const jobSkills = extractAllSkills(jobDesc);
  const resumeSkills = extractAllSkills(resumeText);
  
  console.log(`Job skills (${jobSkills.length}):`, jobSkills.map(s => `${s.name} (${s.category})`));
  console.log(`Resume skills (${resumeSkills.length}):`, resumeSkills.map(s => `${s.name} (${s.category})`));
  

  const presentSkills = resumeSkills.filter(resumeSkill => {
    return jobSkills.some(jobSkill => 
      jobSkill.name.toLowerCase() === resumeSkill.name.toLowerCase() &&
      jobSkill.category === resumeSkill.category
    );
  });
  
  const missingSkills = jobSkills.filter(jobSkill => {
    return !resumeSkills.some(resumeSkill => 
      resumeSkill.name.toLowerCase() === jobSkill.name.toLowerCase() &&
      resumeSkill.category === jobSkill.category
    );
  });
  
  // Update AI response with validated skills
  aiResponse.skills = {
    required: jobSkills,
    present: presentSkills,
    missing: missingSkills
  };
  
  // Recalculate scores
  const matchRatio = jobSkills.length > 0 ? presentSkills.length / jobSkills.length : 0;
  aiResponse.score = Math.min(10, Math.max(0, matchRatio * 10)).toFixed(1);
  aiResponse.atsScore = Math.min(100, Math.max(0, (matchRatio * 100) + (presentSkills.length * 2))).toFixed(1);
  
  // Determine domain
  const jobDomains = new Set(jobSkills.map(s => s.category));
  const resumeDomains = new Set(resumeSkills.map(s => s.category));
  const isCrossDomain = !Array.from(jobDomains).some(domain => resumeDomains.has(domain));
  
  // Update experience level based on skills
  const techSkillCount = presentSkills.filter(s => 
    ['Programming Languages', 'Web Development', 'Backend Development', 
     'Mobile Development', 'Databases', 'Cloud & DevOps', 'Software Tools',
     'Data Science & AI', 'Cybersecurity', 'QA & Testing'].includes(s.category)
  ).length;
  
  if (isCrossDomain) {
    aiResponse.experienceLevel = 'entry';
    aiResponse.matchLevel = 'Weak Match';
    aiResponse.summary = `Cross-domain mismatch: Job requires ${Array.from(jobDomains).join(', ')} skills but resume shows ${Array.from(resumeDomains).join(', ')} skills.`;
  } else {
    if (techSkillCount < 3) aiResponse.experienceLevel = 'junior';
    else if (techSkillCount >= 6) aiResponse.experienceLevel = 'senior';
    else aiResponse.experienceLevel = 'mid';
    
    // Update match level
    const score = parseFloat(aiResponse.score);
    if (score >= 8.5) aiResponse.matchLevel = 'Excellent Match';
    else if (score >= 7.0) aiResponse.matchLevel = 'Strong Match';
    else if (score >= 6.0) aiResponse.matchLevel = 'Good Fit';
    else if (score >= 5.0) aiResponse.matchLevel = 'Moderate Match';
    else if (score >= 3.0) aiResponse.matchLevel = 'Needs Improvement';
    else aiResponse.matchLevel = 'Weak Match';
    
    aiResponse.summary = `Found ${presentSkills.length} skill matches out of ${jobSkills.length} required. `;
    if (presentSkills.length === 0) {
      aiResponse.summary += "No matching skills found.";
    } else if (presentSkills.length === jobSkills.length) {
      aiResponse.summary += "Perfect match!";
    } else if (presentSkills.length >= jobSkills.length * 0.7) {
      aiResponse.summary += "Strong match.";
    } else if (presentSkills.length >= jobSkills.length * 0.4) {
      aiResponse.summary += "Moderate match.";
    } else {
      aiResponse.summary += "Weak match.";
    }
  }
  
  // Update insights
  aiResponse.insights = [
    {
      type: "strength",
      message: presentSkills.length > 0 
        ? `Strong in: ${presentSkills.slice(0, 3).map(s => s.name).join(', ')}`
        : isCrossDomain ? "Consider roles in your domain expertise" : "Review and strengthen your skill set"
    },
    ...(missingSkills.length > 0 ? [{
      type: "improvement",
      message: `Consider learning: ${missingSkills.slice(0, 3).map(s => s.name).join(', ')}`
    }] : []),
    {
      type: "advice",
      message: isCrossDomain 
        ? "Apply for jobs that match your domain expertise, or consider retraining"
        : "Tailor your resume to include keywords from the job description"
    }
  ];
  
  // Update learning path
  aiResponse.learningPath = missingSkills.slice(0, 3).map((skill, idx) => ({
    skill: skill.name,
    timeEstimate: idx === 0 ? "1-2 months" : idx === 1 ? "2-3 months" : "3-4 months",
    resources: ["Online courses", "Documentation", "Practice projects"],
    priority: idx === 0 ? "High" : idx === 1 ? "Medium" : "Low"
  }));
  

  aiResponse.aiGuidance = `Career Match Analysis:\n\n`;
  
  if (isCrossDomain) {
    aiResponse.aiGuidance += `⚠️ Domain Mismatch Alert\n\n`;
    aiResponse.aiGuidance += `Job requires skills in: ${Array.from(jobDomains).join(', ')}\n`;
    aiResponse.aiGuidance += `Your resume shows skills in: ${Array.from(resumeDomains).join(', ')}\n\n`;
    aiResponse.aiGuidance += `Recommendation: Consider applying for roles in your domain or pursuing additional training.`;
  } else {
    if (presentSkills.length > 0) {
      aiResponse.aiGuidance += `✅ Skills you have: ${presentSkills.map(s => s.name).join(', ')}\n\n`;
    }
    if (missingSkills.length > 0) {
      aiResponse.aiGuidance += `📝 Skills to learn: ${missingSkills.map(s => s.name).join(', ')}\n\n`;
    }
    aiResponse.aiGuidance += `Recommendation: ${aiResponse.score >= 7 ? 'Good match - ready to apply' : aiResponse.score >= 4 ? 'Moderate match - consider upskilling' : 'Weak match - significant skill gaps'}`;
  }
  
  return aiResponse;
}

function cleanSimpleText(text) {
  if (!text) return "";
  
  return text

    .replace(/\$[0-9]+/g, '')      
    .replace(/\$\$/g, '')            
    .replace(/\\[a-zA-Z]+\{.*?\}/g, '')
    .replace(/\\[a-zA-Z]+/g, '') 

    .replace(/^([0-9]+)\.\s*$/gm, '')    
    .replace(/^([0-9]+)\.\s+/gm, '$1. ') 
    .replace(/\n{3,}/g, '\n\n')

    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function formatSimpleResponse(text) {
  if (!text) return "";
  
  // First clean aggressively
  let cleaned = text
    // Remove ALL LaTeX/markdown/dollar signs
    .replace(/\$[0-9]+/g, '')  
    .replace(/\$\$/g, '')       
    .replace(/\$\w+/g, '')     
    .replace(/\*\*/g, '')   
    .replace(/\*/g, '')         
    .replace(/#/g, '')         
    .replace(/`/g, '')        
    .replace(/\[.*?\]\(.*?\)/g, '') 
    
    // Fix numbered lists
    .replace(/^([0-9]+)\.\s*$/gm, '')  
    .replace(/^([0-9]+)\.\s+/gm, '$1. ') 
    
    // Fix LaTeX list patterns
    .replace(/^\\item\s*/gm, '- ')    
    .replace(/^\\begin\{.*?\}/gm, '') 
    .replace(/^\\end\{.*?\}/gm, '')  
    
    // Remove any remaining special characters
    .replace(/[{}]/g, '')
    
    // Fix spacing
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  // Process each line
  const lines = cleaned.split('\n');
  const formattedLines = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (formattedLines.length > 0) {
        formattedLines.push('');
      }
      continue;
    }
    
    line = line
      .replace(/^([0-9]+)\.\s*/g, '$1. ')  // Ensure proper numbered list format
      .replace(/^-\s*/g, '- ')             // Ensure proper bullet format
      .replace(/^•\s*/g, '- ')             // Convert • to -
      .replace(/^\*\s*/g, '- ')            // Convert * to -
      .replace(/^>\s*/g, '')               // Remove blockquote >
      
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      .replace(/([.!?])\s*$/g, '$1');
    
    formattedLines.push(line);
  }
  
  return formattedLines.join('\n');
}

function fixAIResponseFormatting(text) {
  if (!text) return "";
  
  console.log("BEFORE FORMATTING:", text.substring(0, 300));
  
  let fixed = text
    // Remove ALL special formatting
    .replace(/\$\d+/g, '')
    .replace(/\$\$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/##+/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    
    // Pattern 1: "1.\nText" or "1.\n  Text"
    .replace(/(\d+)\.\s*\n+\s*/g, '$1. ')
    
    // Pattern 2: "1. \nText"
    .replace(/(\d+)\.\s+\n+\s*/g, '$1. ')
    
    // Pattern 3: Just "1." on its own line followed by text on next line
    .replace(/^(\d+)\.\s*$/gm, '')
    
    // Pattern 4: Number with colon "1:\nText"
    .replace(/(\d+):\s*\n+\s*/g, '$1. ')
    
    // Fix bullet points on separate lines
    .replace(/[-•*]\s*\n+\s*/g, '- ')
    
    // Convert various bullets to dash
    .replace(/^[•*]\s+/gm, '- ')
    
    // Ensure single space after numbers (not multiple)
    .replace(/(\d+)\.\s{2,}/g, '$1. ')
    
    // Remove empty lines between number and text
    .replace(/(\d+)\.\s*\n\s*([A-Z])/g, '$1. $2')
    
    // Fix multiple spaces
    .replace(/[ \t]{2,}/g, ' ')
    
    // Fix multiple newlines (max 2)
    .replace(/\n{3,}/g, '\n\n')
    
    // Remove trailing spaces
    .replace(/[ \t]+$/gm, '')
    
    .trim();
  
  console.log("AFTER FORMATTING:", fixed.substring(0, 300));
  
  return fixed;
}
function generateSimpleFallback(userMessage, analysisSummary) {
  const lowerMsg = userMessage.toLowerCase();
  
  // Greeting responses
  const greetings = {
    'thank you': `You're welcome! What else would you like to know about your career match?`,
    'thanks': `You're welcome! What else would you like to know about your career match?`,
    'hello': `Hello! Your match score is ${analysisSummary?.score || 'N/A'}/10. What would you like to discuss?`,
    'hi': `Hi! Your match score is ${analysisSummary?.score || 'N/A'}/10. What would you like to discuss?`,
    'bye': `Goodbye! Keep working on those skills. Good luck!`,
    'goodbye': `Goodbye! Keep working on those skills. Good luck!`,
    'help': `I can help with skill gaps, resume tips, interview prep, and learning plans. What interests you?`,
    'what can you do': `I can help with skill gaps, resume tips, interview prep, and learning plans. What interests you?`
  };
  
  if (greetings[lowerMsg]) {
    return greetings[lowerMsg];
  }
  
  const skills = analysisSummary?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'CAD and Solidworks';
  const presentSkills = analysisSummary?.skills?.present?.slice(0, 3).map(s => s.name).join(', ') || 'your current skills';
  
  // Handle day plans with special logic
  const dayMatch = lowerMsg.match(/(\d+)\s*days?\s*plan/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    return generateLearningPlan(days, skills);
  }
  
  // Handle specific questions
  if (lowerMsg.includes('skill') && (lowerMsg.includes('priorit') || lowerMsg.includes('learn'))) {
    return `Focus on learning ${skills} first. These are the most critical skills for this role.\n\nStart with:\n1. Basic CAD tutorials on YouTube or Coursera\n2. Solidworks beginner courses on Udemy\n3. Practice projects to build your portfolio\n\nDedicate 1-2 hours daily for best results.`;
  }
  
  if (lowerMsg.includes('strength')) {
    if (analysisSummary?.skills?.present?.length > 0) {
      return `Your key strengths are: ${presentSkills}.\n\nHighlight these in your resume and interviews. Build projects that showcase these skills. Consider roles that heavily use these technologies.`;
    } else {
      return `Based on your resume, focus on building foundational skills first. Start with ${skills} to match this role better.`;
    }
  }
  
  if (lowerMsg.includes('experience level')) {
    const level = analysisSummary?.experienceLevel || 'entry';
    return `Your experience level is ${level} for this role.\n\nTo advance:\n1. Build more projects using required skills\n2. Get certifications in ${skills}\n3. Contribute to open-source or internships\n\nFocus on gaining practical experience.`;
  }
  
  if (lowerMsg.includes('resume') || lowerMsg.includes('update')) {
    return `Update your resume by:\n1. Adding keywords like ${skills} in your skills section\n2. Describing projects where you used relevant tools\n3. Quantifying achievements with numbers\n4. Keeping format clean and ATS-friendly\n\nTailor it for each job application.`;
  }
  
  if (lowerMsg.includes('interview')) {
    return `For interview prep:\n1. Research the company and role thoroughly\n2. Practice explaining your projects in detail\n3. Prepare STAR method examples\n4. Study common technical questions\n5. Prepare questions to ask them\n\nPractice with mock interviews.`;
  }
  
  if (lowerMsg.includes('gap') || lowerMsg.includes('address')) {
    return `To address skill gaps in ${skills}:\n1. Take structured online courses (Udemy, Coursera)\n2. Practice daily with tutorials and projects\n3. Join communities to learn from others\n4. Build a portfolio of work\n\nConsistency is key - aim for 1-2 hours daily.`;
  }
  
  if (lowerMsg.includes('match') || lowerMsg.includes('better')) {
    return `To improve your match:\n1. Learn the missing skills: ${skills}\n2. Build projects using these technologies\n3. Update resume with relevant keywords\n4. Get certifications if available\n\nFocus on practical experience over theory.`;
  }
  
  // Default response
  return `I can help with:\n- Skill gap analysis and learning plans\n- Resume optimization tips\n- Interview preparation\n- Career strategy advice\n\nWhat would you like to focus on?`;
}

function generateLearningPlan(days, skills) {
  if (days <= 3) {
    return `Here's a ${days}-day quick start plan:\n\n1. Day 1 - Research ${skills} basics and install free CAD software (Tinkercad/Fusion 360)\n2. Day 2 - Complete first tutorial course module\n3. Day 3 - Create a simple practice project\n\nFocus on fundamentals first.`;
  } 
  else if (days <= 7) {
    return `Here's your ${days}-day learning plan:\n\n1. Days 1-2 - Learn CAD basics through YouTube tutorials and online courses\n2. Days 3-4 - Start Solidworks beginner course on Udemy/Coursera\n3. Days 5-6 - Practice with small design projects daily\n4. Day 7 - Create your own simple project and review progress\n\nPractice 1-2 hours daily for best results.`;
  }
  else if (days <= 14) {
    return `Here's your ${days}-day intensive plan:\n\nWeek 1:\n1. Days 1-3 - Complete CAD fundamentals course\n2. Days 4-5 - Practice 2D drafting and basic shapes\n3. Days 6-7 - Create simple 2D design projects\n\nWeek 2:\n1. Days 8-10 - Start Solidworks basics, learn interface and tools\n2. Days 11-12 - Practice creating 3D parts and assemblies\n3. Days 13-14 - Build a simple portfolio project\n\nDedicate 2 hours daily. Join CAD communities for support.`;
  }
  else if (days <= 30) {
    return `Here's your ${days}-day comprehensive plan:\n\nWeek 1 (Days 1-7): CAD Fundamentals\n- Learn 2D drafting, basic shapes, layers, and dimensions\n- Complete beginner CAD course online\n- Create 3 simple 2D projects\n\nWeek 2 (Days 8-14): Solidworks Basics\n- Enroll in Solidworks course (Udemy/Coursera)\n- Master interface, sketches, and basic features\n- Create 3 simple 3D parts\n\nWeek 3 (Days 15-21): Intermediate Skills\n- Learn assemblies and motion simulation\n- Practice complex 3D designs\n- Start building portfolio project\n\nWeek 4 (Days 22-${days}): Advanced & Portfolio\n- Explore rendering and visualization\n- Complete 1-2 engineering projects\n- Document work for portfolio\n- Review and practice daily\n\nGoal: 2-3 hours daily practice. Join online communities for feedback.`;
  }
  else if (days <= 60) {
    return `Here's your ${days}-day mastery plan:\n\nMonth 1 - Foundations:\nWeeks 1-2: Master CAD fundamentals and 2D design\nWeeks 3-4: Learn Solidworks basics and 3D modeling\n\nMonth 2 - Advanced Skills:\nWeeks 5-6: Advanced features, assemblies, and simulations\nWeeks 7-8: Real-world projects and portfolio building\n\nDaily Activities:\n- 2-3 hours of focused practice\n- Join CAD forums and communities\n- Complete 1 project per week\n- Get feedback from experienced users\n\nBy day ${days}, you should have:\n- Solid CAD and Solidworks foundation\n- 6-8 portfolio projects\n- Understanding of engineering design process\n\nConsistency is key to success!`;
  }
  else {
    return `Here's your ${days}-day extended learning plan:\n\nPhase 1 (First 30 days): Build strong foundations in CAD and Solidworks\nPhase 2 (Days 31-60): Develop intermediate skills with complex projects\nPhase 3 (Days 61-90): Master advanced features and build comprehensive portfolio\nPhase 4 (Remaining days): Specialize and prepare for job applications\n\nWeekly Goals:\n- Complete 1 structured course module\n- Build 1-2 practice projects\n- Spend 10-15 hours on hands-on practice\n- Participate in online communities\n\nBy the end, you'll have:\n- Strong command of ${skills}\n- Professional portfolio with 15+ projects\n- Industry-relevant certifications\n- Job-ready skills and confidence\n\nBreak it into smaller milestones and stay consistent!`;
  }
}

function generateFallbackAnalysis(jobDesc, resumeText) {
  console.log("Generating enhanced fallback analysis...");
  
  const jobSkills = extractAllSkills(jobDesc);
  const resumeSkills = extractAllSkills(resumeText);
  
  // Find matches - case insensitive
  const presentSkills = resumeSkills.filter(resumeSkill => 
    jobSkills.some(jobSkill => 
      jobSkill.name.toLowerCase() === resumeSkill.name.toLowerCase()
    )
  );
  
  const missingSkills = jobSkills.filter(jobSkill => 
    !resumeSkills.some(resumeSkill => 
      resumeSkill.name.toLowerCase() === jobSkill.name.toLowerCase()
    )
  );
  
  // Calculate scores
  const baseScore = jobSkills.length > 0 
    ? Math.min(10, (presentSkills.length / jobSkills.length) * 10)
    : 5.0;
  
  const atsScore = Math.min(100, (baseScore * 10) + (presentSkills.length * 2));
  
  // Determine experience level
  let experienceLevel = "mid";
  const techSkillCount = presentSkills.filter(s => 
    ['Programming Languages', 'Web Development', 'Backend Development', 
     'Mobile Development', 'Databases', 'Cloud & DevOps', 'Software Tools',
     'Data Science & AI', 'Cybersecurity', 'QA & Testing'].includes(s.category)
  ).length;
  
  if (techSkillCount < 3) experienceLevel = "junior";
  else if (techSkillCount >= 6) experienceLevel = "senior";
  
  // Determine match level
  let matchLevel = "Needs Improvement";
  if (baseScore >= 8.5) matchLevel = "Excellent Match";
  else if (baseScore >= 7.0) matchLevel = "Strong Match";
  else if (baseScore >= 6.0) matchLevel = "Good Fit";
  else if (baseScore >= 5.0) matchLevel = "Moderate Match";
  else if (baseScore >= 3.0) matchLevel = "Needs Improvement";
  else matchLevel = "Weak Match";
  
  // Generate summary
  let summary = `Basic analysis completed. Found ${presentSkills.length} matching skills out of ${jobSkills.length} required. `;
  
  if (presentSkills.length === 0) {
    summary += "No matching skills found.";
  } else if (presentSkills.length === jobSkills.length) {
    summary += "Perfect skill match!";
  } else if (presentSkills.length >= jobSkills.length * 0.7) {
    summary += "Strong skill alignment.";
  } else if (presentSkills.length >= jobSkills.length * 0.4) {
    summary += "Moderate skill alignment.";
  } else {
    summary += "Weak skill alignment.";
  }
  
  // Generate insights
  const insights = [];
  
  if (presentSkills.length > 0) {
    insights.push({
      type: "strength",
      message: `Strong in: ${presentSkills.slice(0, 3).map(s => s.name).join(', ')}`
    });
  }
  
  if (missingSkills.length > 0) {
    insights.push({
      type: "improvement",
      message: `Consider learning: ${missingSkills.slice(0, 3).map(s => s.name).join(', ')}`
    });
  }
  
  insights.push({
    type: "advice",
    message: "Tailor your resume with job description keywords and highlight relevant projects."
  });
  
  // Generate learning path
  const learningPath = missingSkills.slice(0, 3).map((skill, idx) => ({
    skill: skill.name,
    timeEstimate: idx === 0 ? "1-2 months" : idx === 1 ? "2-3 months" : "3-4 months",
    resources: ["Online courses", "Documentation", "Practice projects"],
    priority: idx === 0 ? "High" : idx === 1 ? "Medium" : "Low"
  }));
  
  // Generate AI guidance
  let aiGuidance = `Career Match Analysis:\n\n`;
  
  if (presentSkills.length > 0) {
    aiGuidance += `✅ Skills you have: ${presentSkills.slice(0, 5).map(s => s.name).join(', ')}\n\n`;
  }
  
  if (missingSkills.length > 0) {
    aiGuidance += `📝 Skills to develop: ${missingSkills.slice(0, 5).map(s => s.name).join(', ')}\n\n`;
  }
  
  if (baseScore >= 7) {
    aiGuidance += `Great match! You're well-positioned for this role. Highlight your experience with ${presentSkills.slice(0, 3).map(s => s.name).join(', ')} in your application.`;
  } else if (baseScore >= 5) {
    aiGuidance += `Moderate match. Focus on building skills in ${missingSkills.slice(0, 3).map(s => s.name).join(', ')} to improve your chances.`;
  } else {
    aiGuidance += `Significant skill gaps. Consider roles more closely aligned with your current skills, or invest in training for ${missingSkills.slice(0, 3).map(s => s.name).join(', ')}.`;
  }
  
  return {
    score: parseFloat(baseScore.toFixed(1)),
    atsScore: parseFloat(atsScore.toFixed(1)),
    experienceLevel,
    matchLevel,
    summary,
    skills: {
      required: jobSkills,
      present: presentSkills,
      missing: missingSkills
    },
    insights,
    learningPath,
    aiGuidance,
    conversationalAI: `I've analyzed your resume. Your match score is ${baseScore.toFixed(1)}/10. ${summary}`,
    metadata: {
      analyzedAt: new Date().toISOString(),
      jobDescLength: jobDesc.length,
      resumeLength: resumeText.length,
      modelUsed: "fallback_keyword_analysis",
      note: "Using fallback analysis due to API limitations"
    }
  };
}

const createAnalysisPrompt = (jobDesc, resumeText) => {
  return `You are an expert career analyst. Analyze this resume against the job description.

JOB DESCRIPTION:
${jobDesc.substring(0, 2000)}

RESUME:
${resumeText.substring(0, 2000)}

Return ONLY a valid JSON object with this exact structure:
{
  "score": 6.5,
  "atsScore": 72,
  "experienceLevel": "mid",
  "matchLevel": "Good Fit",
  "summary": "Brief analysis summary here.",
  "skills": {
    "required": [{"name": "Python", "category": "Programming Languages"}],
    "present": [{"name": "Python", "category": "Programming Languages"}],
    "missing": [{"name": "Docker", "category": "Cloud & DevOps"}]
  },
  "insights": [
    {"type": "strength", "message": "You have strong Python skills."}
  ],
  "learningPath": [
    {"skill": "Docker", "timeEstimate": "1-2 months", "resources": ["Docker docs"], "priority": "High"}
  ],
  "aiGuidance": "Detailed guidance here."
}

IMPORTANT:
- Only return the JSON object, no other text.
- Use realistic scores between 1-10 for score.
- Use realistic scores between 0-100 for atsScore.
- experienceLevel must be "junior", "mid", or "senior".
- matchLevel must be one of: "Excellent Match", "Strong Match", "Good Fit", "Moderate Match", "Needs Improvement", "Weak Match".
- insight types must be "strength", "improvement", or "advice".
- Base your analysis only on the provided resume and job description.`;
};


app.post("/analyze", upload.single("resume"), async (req, res) => {
  console.log("=== ANALYSIS REQUEST ===");
  
  try {
    // Get data from request
    const jobDescription = req.body.jobDescription || req.body.jobDesc || "";
    const resumeTextFromBody = req.body.resumeText || "";
    const file = req.file;

    console.log("Job description length:", jobDescription.length);
    console.log("Resume text from body:", resumeTextFromBody.length);

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ 
        error: "Please provide a detailed job description (at least 20 characters).",
        type: "validation_error"
      });
    }

    let resumeText = resumeTextFromBody;
    
    // If file uploaded, extract text from it
    if (file) {
      console.log("Extracting text from file...");
      try {
        resumeText = await extractText(file);
        console.log(`Extracted ${resumeText.length} characters from file`);
        
        if (!resumeText || resumeText.trim().length < 50) {
          throw new Error("File extraction yielded insufficient text");
        }
      } catch (err) {
        console.error("File extraction error:", err.message);
        return res.status(400).json({ 
          error: `Failed to process file: ${err.message}. Try pasting text instead.`,
          type: "extraction_error"
        });
      }
    } else if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ 
        error: "Please provide resume content (at least 50 characters).",
        type: "validation_error"
      });
    }

    console.log("Proceeding with AI analysis...");
    
    // Try Groq API
    try {
      const systemPrompt = createAnalysisPrompt(jobDescription, resumeText);
      
      console.log("Sending request to Groq API...");
      
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are an AI that outputs ONLY valid JSON. Your entire response must be a JSON object." 
          },
          { 
            role: "user", 
            content: systemPrompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("Empty response from AI");
      }

      console.log("Received response from Groq API:", content.substring(0, 200));
      
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(content);
        console.log("Successfully parsed JSON response");
      } catch (parseError) {
        console.error("JSON parse error:", parseError.message);
        console.log("Raw content:", content);

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonResponse = JSON.parse(jsonMatch[0]);
            console.log("Extracted JSON from response");
          } catch (e) {
            throw new Error("Could not parse JSON from AI response");
          }
        } else {
          throw new Error("No JSON found in AI response");
        }
      }
      if (!jsonResponse.score || !jsonResponse.skills) {
        throw new Error("Incomplete JSON response from AI");
      }
      jsonResponse = validateAndFixSkills(jsonResponse, jobDescription, resumeText);
      const finalResponse = {
        score: parseFloat(jsonResponse.score) || 0,
        atsScore: parseFloat(jsonResponse.atsScore) || 0,
        experienceLevel: jsonResponse.experienceLevel || "mid",
        matchLevel: jsonResponse.matchLevel || "Needs Improvement",
        summary: jsonResponse.summary || "Analysis completed.",
        skills: jsonResponse.skills || {
          required: [],
          present: [],
          missing: []
        },
        insights: jsonResponse.insights || [],
        learningPath: jsonResponse.learningPath || [],
        aiGuidance: jsonResponse.aiGuidance || "Based on your resume and the job description, review the skill matches above.",
        conversationalAI: `I've analyzed your resume against the job description. Your match score is ${jsonResponse.score || 0}/10. ${jsonResponse.summary || "Review the analysis for detailed insights."}`,
        metadata: {
          analyzedAt: new Date().toISOString(),
          jobDescLength: jobDescription.length,
          resumeLength: resumeText.length,
          modelUsed: "llama-3.1-8b-instant",
          skillsDetected: (jsonResponse.skills?.present?.length || 0) + (jsonResponse.skills?.missing?.length || 0)
        }
      };

      console.log("AI analysis completed successfully");
      return res.json(finalResponse);

    } catch (apiError) {
      console.error("Groq API Error:", apiError.message);

      if (apiError.message.includes('rate_limit') || apiError.message.includes('429')) {
        console.log("Rate limit exceeded, using fallback analysis...");
      } else if (apiError.message.includes('json_validate_failed') || apiError.message.includes('JSON')) {
        console.log("JSON validation failed, using fallback analysis...");
      }

      const fallbackAnalysis = generateFallbackAnalysis(jobDescription, resumeText);
      fallbackAnalysis.summary = "⚠️ Basic analysis completed. For detailed AI insights, please try again. " + fallbackAnalysis.summary;
      fallbackAnalysis.metadata.note = "Used fallback due to API error: " + apiError.message;
      
      return res.json(fallbackAnalysis);
    }

  } catch (error) {
    console.error("Analysis Error:", error.message);
    return res.status(500).json({ 
      error: `Analysis failed: ${error.message}. Please try again.`,
      type: "general_error"
    });
  }
});

app.post("/ai-chat", async (req, res) => {
  console.log("=== AI CHAT REQUEST ===");
  
  const { 
    jobDesc = '', 
    resumeText = '', 
    userMessage, 
    analysisSummary = null,
    conversation = [] 
  } = req.body;

  if (!userMessage || userMessage.trim().length === 0) {
    return res.status(400).json({ 
      response: "Please provide a message.",
      success: false
    });
  }

  const lowerMsg = userMessage.toLowerCase().trim();

  const simpleGreetings = ['thank you', 'thanks', 'hello', 'hi', 'hey', 'bye', 'goodbye', 'help', 'ok', 'okay'];
  
  if (simpleGreetings.includes(lowerMsg)) {
    const greetingResponse = generateSimpleFallback(userMessage, analysisSummary);
    return res.json({
      response: greetingResponse,
      success: true,
      source: "greeting-response"
    });
  }

  const dayPlanMatch = lowerMsg.match(/(\d+)\s*days?\s*plan/);
  if (dayPlanMatch) {
    const days = parseInt(dayPlanMatch[1]);
    const skills = analysisSummary?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'CAD and Solidworks';
    const planResponse = generateLearningPlan(days, skills);
    
    return res.json({
      response: planResponse,
      success: true,
      source: "structured-plan"
    });
  }
  let maxTokens = 500; 
  
  if (lowerMsg.includes('plan') && lowerMsg.match(/\d+/)) {
    maxTokens = 800;
  } else if (lowerMsg.includes('resume') || lowerMsg.includes('interview')) {
    maxTokens = 600; 
  }

  const systemPrompt = `You are Career Compass AI. Give concise career advice.

USER INFO:
- Match Score: ${analysisSummary?.score || 'N/A'}/10
- Skills Present: ${analysisSummary?.skills?.present?.slice(0,3).map(s => s.name).join(', ') || 'None'}
- Skills Needed: ${analysisSummary?.skills?.missing?.slice(0,3).map(s => s.name).join(', ') || 'None'}

FORMATTING RULES:
Write numbered lists like this (number and text on SAME line):
1. First step here on same line
2. Second step here on same line

For most questions, use 2-3 short paragraphs. Only use numbered lists for steps or ordered actions.

Keep responses under 400 words. Be practical and direct.

Now answer: "${userMessage}"`;

  const messages = [{ role: "system", content: systemPrompt }];

  conversation.slice(-2).forEach(msg => {
    if (msg.text && msg.text.trim().length > 0) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text.substring(0, 150)
      });
    }
  });

  messages.push({ role: "user", content: userMessage.substring(0, 300) });

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: maxTokens,
      stream: false
    });
    
    let aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse || aiResponse.trim().length < 10) {
      aiResponse = generateSimpleFallback(userMessage, analysisSummary);
    } else {
      aiResponse = fixAIResponseFormatting(aiResponse);

      if (aiResponse.match(/^\d+\.\s*$/m)) {
        console.log("Formatting still broken, using fallback");
        aiResponse = generateSimpleFallback(userMessage, analysisSummary);
      }
    }

    res.json({
      response: aiResponse,
      success: true,
      source: "groq-ai"
    });

  } catch (error) {
    console.error("API Error:", error.message);
    
    const simpleFallback = generateSimpleFallback(userMessage, analysisSummary);
    
    res.json({
      response: simpleFallback,
      success: false,
      source: "fallback"
    });
  }
});

app.post("/export-analysis", async (req, res) => {
  try {
    const { analysis, format } = req.body;
    
    if (!analysis) {
      return res.status(400).json({ error: "No analysis data provided" });
    }

    let content, filename, contentType;

    switch (format) {
      case 'txt':
        content = generateTxtAnalysis(analysis);
        filename = `Career-Analysis-${Date.now()}.txt`;
        contentType = 'text/plain';
        break;
        
      case 'json':
        content = JSON.stringify(analysis, null, 2);
        filename = `Career-Analysis-${Date.now()}.json`;
        contentType = 'application/json';
        break;
        
      case 'pdf':
        content = await generatePdfAnalysis(analysis);
        filename = `Career-Analysis-${Date.now()}.pdf`;
        contentType = 'application/pdf';
        break;
        
      default:
        return res.status(400).json({ error: "Unsupported export format" });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);

  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ error: "Export failed", details: error.message });
  }
});

function generateTxtAnalysis(analysis) {
  let txt = `CAREER COMPASS - ANALYSIS REPORT\n`;
  txt += `================================================\n\n`;
  txt += `Generated: ${new Date().toLocaleString()}\n`;
  txt += `Match Score: ${analysis.score}/10\n`;
  txt += `ATS Compatibility: ${analysis.atsScore}%\n`;
  txt += `Experience Level: ${analysis.experienceLevel}\n`;
  txt += `Match Level: ${analysis.matchLevel}\n\n`;
  
  txt += `SUMMARY:\n${analysis.summary}\n\n`;
  
  txt += `SKILLS ANALYSIS:\n`;
  txt += `Required Skills:\n`;
  (analysis.skills?.required || []).forEach((skill, i) => {
    txt += `  ${i+1}. ${skill.name} (${skill.category})\n`;
  });
  
  txt += `\nPresent Skills:\n`;
  (analysis.skills?.present || []).forEach((skill, i) => {
    txt += `  ${i+1}. ${skill.name} (${skill.category})\n`;
  });
  
  txt += `\nMissing Skills:\n`;
  (analysis.skills?.missing || []).forEach((skill, i) => {
    txt += `  ${i+1}. ${skill.name} (${skill.category})\n`;
  });
  
  txt += `\nKEY INSIGHTS:\n`;
  (analysis.insights || []).forEach((insight, i) => {
    txt += `${i+1}. [${insight.type?.toUpperCase()}] ${insight.message}\n`;
  });
  
  txt += `\nLEARNING PATH:\n`;
  (analysis.learningPath || []).forEach((item, i) => {
    txt += `${i+1}. ${item.skill}\n`;
    txt += `   Time: ${item.timeEstimate}\n`;
    txt += `   Priority: ${item.priority}\n`;
    txt += `   Resources: ${(item.resources || []).join(', ')}\n\n`;
  });
  
  txt += `\nDETAILED GUIDANCE:\n${analysis.aiGuidance}\n`;
  
  return txt;
}

async function generatePdfAnalysis(analysis) {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;
    page.drawText('CAREER COMPASS - ANALYSIS REPORT', {
      x: 50,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0, 0.4, 0.8),
    });
    
    y -= 30;
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    y -= 40;

    const txtContent = generateTxtAnalysis(analysis);
    const lines = txtContent.split('\n');
    
    let currentPage = page;
    
    for (const line of lines) {
      if (y < 50) {
        currentPage.drawText('-- Continued on next page --', {
          x: 50,
          y: 30,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        const newPage = pdfDoc.addPage([600, 800]);
        y = newPage.getSize().height - 50;
        currentPage = newPage;
      }
      
      const isTitle = line.toUpperCase() === line && line.length > 3 && line.length < 50;
      const size = isTitle ? 12 : 10;
      const textFont = isTitle ? fontBold : font;
      
      currentPage.drawText(line.substring(0, 80), {
        x: 50,
        y,
        size,
        font: textFont,
        color: rgb(0, 0, 0),
      });
      
      y -= (size + 2);
    }
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return Buffer.from(generateTxtAnalysis(analysis));
  }
}

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "Career Compass Backend", 
    timestamp: new Date().toISOString(),
    version: "1.3.0"
  });
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Career Compass API v1.3.0",
    endpoints: {
      analyze: "POST /analyze",
      aiChat: "POST /ai-chat",
      export: "POST /export-analysis",
      health: "GET /health"
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /analyze - Resume analysis`);
  console.log(`   POST /ai-chat - AI career coach`);
  console.log(`   GET /health - Health check`);
  console.log(`🔑 API Status: ${process.env.GROQ_API_KEY ? 'Key Loaded ✓' : '❌ Check .env!'}`);
});