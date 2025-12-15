const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Groq = require("groq-sdk");
const mammoth = require("mammoth");
const { PDFDocument } = require('pdf-lib');
const pdf = require('pdf-parse');
require("dotenv").config();

// Initialize App
const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PORT = process.env.PORT || 5000;

async function extractTextFromPDF(buffer) {
  console.log("🔍 Starting PDF extraction...");

  try {
    // 1. Basic Parse
    const data = await pdf(buffer);
    
    // 2. Check if we actually got text
    if (!data || !data.text) {
      console.warn("⚠️ pdf-parse returned empty object");
      throw new Error("PDF parsing returned no data");
    }

    const rawText = data.text;
    console.log(`📄 Raw text length: ${rawText.length}`);

    // 3. Clean the text (remove excessive whitespace)
    const cleanedText = rawText
      .replace(/\n/g, " ")       // Replace newlines with spaces
      .replace(/\s\s+/g, " ")    // Replace multiple spaces with single space
      .trim();

    // 4. Validate content length (lowered threshold)
    if (cleanedText.length < 10) {
      console.warn("⚠️ PDF text too short");
      throw new Error("Extracted text is too short. File might be image-based.");
    }

    console.log(`✅ Extraction successful. Length: ${cleanedText.length}`);
    return cleanedText;

  } catch (err) {
    console.error("❌ PDF Extraction Failed:", err.message);
    // Provide a clear error to the user
    throw new Error("Could not read PDF text. Please ensure it is a text-based PDF, not a scan.");
  }
}

async function extractTextFromPDFLibPage(page) {
  try {

    return '';
  } catch (e) {
    return '';
  }
}

async function extractTextFromDOCX(buffer) {
  console.log("🔍 Starting DOCX extraction...");
  
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && result.value.trim().length >= 30) {
      console.log(`✅ mammoth extracted ${result.value.length} characters`);
      return cleanExtractedText(result.value, 'docx');
    }
  } catch (mammothError) {
    console.log("mammoth failed:", mammothError.message);
  }

  try {
    const JSZip = require('jszip');
    const zip = new JSZip();
    await zip.loadAsync(buffer);
    
    const documentXml = await zip.file('word/document.xml').async('string');
    
 
    const textMatches = documentXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    let extractedText = '';
    
    textMatches.forEach(match => {
      const textContent = match.replace(/<[^>]+>/g, '').trim();
      if (textContent) extractedText += textContent + ' ';
    });
    

    try {
      const headerFiles = Object.keys(zip.files).filter(f => f.includes('header'));
      for (const headerFile of headerFiles.slice(0, 3)) {
        const headerXml = await zip.file(headerFile).async('string');
        const headerMatches = headerXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        headerMatches.forEach(match => {
          const text = match.replace(/<[^>]+>/g, '').trim();
          if (text) extractedText += text + ' ';
        });
      }
    } catch (e) {
    }
    
    if (extractedText.trim().length >= 30) {
      console.log(`✅ DOCX fallback extracted ${extractedText.length} characters`);
      return cleanExtractedText(extractedText, 'docx');
    }
  } catch (zipError) {
    console.log("DOCX fallback failed:", zipError.message);
  }
  
  throw new Error("Unable to extract text from DOCX file. The file might be corrupted.");
}

function cleanExtractedText(text, fileType) {
  if (!text || text.trim().length === 0) return "";
  
  console.log(`🧹 Cleaning ${fileType.toUpperCase()} text (${text.length} chars)`);
  
  let cleaned = text;
  cleaned = cleaned
    .replace(/<[^>]+>/g, ' ')                    // Remove HTML/XML tags
    .replace(/&[a-z]+;/gi, ' ')                  // Remove HTML entities
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, ' ')       // Remove LaTeX commands
    .replace(/\(cid:\d+\)/g, ' ')                // Remove PDF CID markers
    .replace(/\\[a-zA-Z]+/g, ' ')                // Remove other escape sequences
    .replace(/[{}[\]()]/g, ' ')                  // Remove brackets
    .replace(/\$\$/g, ' ')                       // Remove LaTeX math markers
    .replace(/\$\w+/g, ' ')                      // Remove dollar signs
    .replace(/\/[A-Z][a-zA-Z]+\b/g, ' ')         // Remove PDF font names
    .replace(/\/(Font|Type|Subtype|BaseFont)\s+\/[A-Za-z0-9]+\b/g, ' ') // PDF artifacts
    .replace(/\b(endobj|endstream|stream|obj)\b/gi, ' ') // PDF structure
    .replace(/\/[A-Za-z0-9]+\s+do\b/g, ' ')      // PDF operators
    .replace(/BT\s+ET/g, ' ')                    // PDF text blocks
    .replace(/\d+\s+\d+\s+[A-Za-z]+\b/g, ' ');   // PDF numbers
  
  const metadataPatterns = [
   
    'canva', 'resume\\.io', 'novoresume', 'zety', 'livecareer',
    'enhancv', 'resumegenius', 'resumebuild', 'resume-now',
    'template', 'generated by', 'created with', 'made with',
  
    'version', 'producer', 'creator', 'creationdate', 'moddate',
    'keywords', 'subject', 'title:', 'author:', 'date:',
    
    'div', 'span', 'p class', 'style=', 'font-family', 'font-size',
    'margin', 'padding', 'border', 'color:', 'background',
    'width:', 'height:', 'position:', 'display:', 'float:',
    

    'function()', 'var ', 'let ', 'const ', '=>', 'document\\.',
    'window\\.', 'console\\.', 'alert(', 'getElementById',
    'addEventListener', 'querySelector', 'innerHTML',
    
  
    'http://', 'https://', 'www\\.', '\\.com', '\\.org', '\\.net',
    'copyright', 'all rights reserved', 'confidential',
    'page \\d+ of \\d+', 'page \\d+', '\\x0c',
  ];
  
  metadataPatterns.forEach(pattern => {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    cleaned = cleaned.replace(regex, ' ');
  });
  

  cleaned = cleaned
    .replace(/\s+/g, ' ')                     // Multiple spaces to single
    .replace(/\n\s*\n/g, '\n')                // Multiple newlines to single
    .replace(/^\s+|\s+$/g, '')                // Trim
    .replace(/\n{3,}/g, '\n\n');              // Limit consecutive newlines

  const lines = cleaned.split('\n');
  const validLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 3) return false;
    

    const letterRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
    if (letterRatio < 0.3) return false;
    
    const lowerLine = trimmed.toLowerCase();
    const badPatterns = [
      /^\d+\s*$/,                             // Just numbers
      /^[•\-*]\s*$/,                          // Just bullet points
      /^page\s*\d+/i,                         // Page numbers
      /^created\s+by/i,                       // Creation metadata
      /^downloaded\s+from/i,                  // Download metadata
      /^do\s+not\s+edit/i,                    // Edit warnings
    ];
    
    return !badPatterns.some(pattern => pattern.test(lowerLine));
  });
  
  cleaned = validLines.join('\n').trim();
  
  console.log(`✅ Cleaned text: ${cleaned.length} characters remaining`);
  return cleaned;
}

async function extractText(file) {
  try {
    console.log(`📄 Processing: ${file.originalname} (${file.size} bytes)`);
    
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error("Empty file");
    }
    
    // PDF files
    if (file.mimetype === "application/pdf" || 
        file.originalname.toLowerCase().endsWith('.pdf')) {
      return await extractTextFromPDF(file.buffer);
    }
    
    // DOCX files
    else if (file.mimetype.includes("word") || 
             file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
             file.originalname.toLowerCase().endsWith('.docx')) {
      return await extractTextFromDOCX(file.buffer);
    }
    
    // TXT files
    else if (file.mimetype === "text/plain" || 
             file.originalname.toLowerCase().endsWith('.txt')) {
      const text = file.buffer.toString('utf-8');
      console.log(`📝 Plain text: ${text.length} characters`);
      return cleanExtractedText(text, 'txt');
    }
    
    // Unsupported formats
    else if (file.mimetype.includes("msword") ||
             file.originalname.toLowerCase().endsWith('.doc')) {
      throw new Error("DOC format not supported. Please convert to PDF or DOCX.");
    }
    else if (file.originalname.toLowerCase().endsWith('.rtf')) {
      throw new Error("RTF format not supported. Please convert to PDF or DOCX.");
    }
    else {
      throw new Error(`Unsupported file type: ${file.mimetype}. Use PDF, DOCX, or TXT.`);
    }
    
  } catch (error) {
    console.error("❌ Extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}


function extractAllSkills(text) {
  if (!text || text.trim().length === 0) {
    console.log("⚠️ No text provided for skill extraction");
    return [];
  }
  
  console.log("🔍 Starting skill extraction...");
  
  const skills = [];
  const seen = new Set();

  const skillCategories = {
    'Programming Languages': [
      { 
        name: 'C++',
        patterns: [/\bc\s*\+\+\b/i, /\bcpp\b/i],
        context: ['programming', 'language', 'code', 'developer', 'software']
      },
      { 
        name: 'Java',
        patterns: [/\bjava\b(?!\s*script)/i],
        context: ['programming', 'development', 'spring', 'android', 'enterprise']
      },
      { 
        name: 'Python',
        patterns: [/\bpython\b/i],
        context: ['programming', 'scripting', 'data', 'django', 'flask', 'machine learning']
      },
      { 
        name: 'JavaScript',
        patterns: [/\bjavascript\b/i, /\bjs\b(?!\s*\d)/i],
        context: ['web', 'development', 'frontend', 'node', 'react', 'browser']
      },
      { 
        name: 'C#',
        patterns: [/\bc\s*#\b/i, /\bcsharp\b/i],
        context: ['.net', 'unity', 'microsoft', 'visual studio']
      },
      { 
        name: 'TypeScript',
        patterns: [/\btypescript\b/i, /\bts\b(?!\s*\d)/i],
        context: ['javascript', 'typed', 'angular', 'node']
      },
    ],
    
    'Web Development': [
      { 
        name: 'HTML',
        patterns: [/\bhtml\s*5?\b/i],
        context: ['web', 'frontend', 'markup', 'css', 'browser']
      },
      { 
        name: 'CSS',
        patterns: [/\bcss\s*3?\b/i],
        context: ['styling', 'web', 'design', 'layout', 'responsive']
      },
      { 
        name: 'React',
        patterns: [/\breact(?:\s*\.?js)?\b/i],
        context: ['javascript', 'frontend', 'ui', 'library', 'components']
      },
      { 
        name: 'Angular',
        patterns: [/\bangular\b/i],
        context: ['framework', 'typescript', 'google', 'single page']
      },
      { 
        name: 'Vue.js',
        patterns: [/\bvue\s*\.?js\b/i, /\bvue\b/i],
        context: ['javascript', 'framework', 'frontend', 'progressive']
      },
    ],
    
    'Backend Development': [
      { 
        name: 'Node.js',
        patterns: [/\bnode\s*\.?js\b/i],
        context: ['javascript', 'runtime', 'backend', 'server']
      },
      { 
        name: 'Express.js',
        patterns: [/\bexpress\s*\.?js\b/i, /\bexpress\b/i],
        context: ['node', 'framework', 'web', 'api']
      },
      { 
        name: 'Django',
        patterns: [/\bdjango\b/i],
        context: ['python', 'framework', 'web', 'mvc']
      },
      { 
        name: 'Spring Boot',
        patterns: [/\bspring\s*boot\b/i],
        context: ['java', 'framework', 'backend', 'enterprise']
      },
    ],
    
    'Databases': [
      { 
        name: 'MySQL',
        patterns: [/\bmysql\b/i],
        context: ['database', 'sql', 'relational', 'query']
      },
      { 
        name: 'PostgreSQL',
        patterns: [/\bpostgresql\b/i, /\bpostgres\b/i],
        context: ['database', 'sql', 'relational', 'open source']
      },
      { 
        name: 'MongoDB',
        patterns: [/\bmongodb\b/i],
        context: ['nosql', 'document', 'database', 'json']
      },
      { 
        name: 'SQL Server',
        patterns: [/\bsql\s*server\b/i],
        context: ['microsoft', 'database', 'sql', 'enterprise']
      },
    ],
    
    'Cloud & DevOps': [
      { 
        name: 'AWS',
        patterns: [/\baws\b/i],
        context: ['amazon', 'cloud', 'services', 'ec2', 's3']
      },
      { 
        name: 'Azure',
        patterns: [/\bazure\b/i],
        context: ['microsoft', 'cloud', 'services', 'enterprise']
      },
      { 
        name: 'Docker',
        patterns: [/\bdocker\b/i],
        context: ['container', 'devops', 'deployment', 'orchestration']
      },
      { 
        name: 'Kubernetes',
        patterns: [/\bkubernetes\b/i, /\bk8s\b/i],
        context: ['container', 'orchestration', 'devops', 'cluster']
      },
    ],
    
    'Mechanical Engineering': [
      { 
        name: 'CAD',
        patterns: [/\bcad\b/i, /\bcomputer\s*aided\s+design\b/i],
        context: ['design', 'drafting', 'engineering', 'modeling']
      },
      { 
        name: 'SolidWorks',
        patterns: [/\bsolidworks\b/i],
        context: ['3d', 'cad', 'design', 'modeling', 'assembly']
      },
      { 
        name: 'AutoCAD',
        patterns: [/\bautocad\b/i],
        context: ['2d', '3d', 'cad', 'drafting', 'autodesk']
      },
      { 
        name: 'ANSYS',
        patterns: [/\bansys\b/i],
        context: ['simulation', 'fea', 'analysis', 'finite element']
      },
      { 
        name: 'FEA',
        patterns: [/\bfea\b/i, /\bfinite\s+element\s+analysis\b/i],
        context: ['analysis', 'simulation', 'structural', 'stress']
      },
      { 
        name: 'CFD',
        patterns: [/\bcfd\b/i, /\bcomputational\s+fluid\s+dynamics\b/i],
        context: ['fluid', 'simulation', 'analysis', 'flow']
      },
      { 
        name: '3D Printing',
        patterns: [/\b3d\s*printing\b/i, /\badditive\s+manufacturing\b/i],
        context: ['prototyping', 'manufacturing', 'design', 'model']
      },
      { 
        name: 'CNC',
        patterns: [/\bcnc\b/i],
        context: ['machining', 'manufacturing', 'milling', 'turning']
      },
    ]
  };

  Object.entries(skillCategories).forEach(([category, skillList]) => {
    skillList.forEach(skillDef => {
      const { name, patterns, context } = skillDef;
      
      
      const hasPattern = patterns.some(pattern => pattern.test(text));
      
      if (hasPattern) {
        
        let foundWithContext = false;
        
        patterns.forEach(pattern => {
          const matches = text.match(new RegExp(pattern.source, 'gi'));
          if (matches) {
            matches.forEach(match => {
              const index = text.toLowerCase().indexOf(match.toLowerCase());
              if (index !== -1) {
                const contextStart = Math.max(0, index - 100);
                const contextEnd = Math.min(text.length, index + match.length + 100);
                const surroundingText = text.substring(contextStart, contextEnd).toLowerCase();
         
                const hasValidContext = context.some(ctx => 
                  surroundingText.includes(ctx.toLowerCase())
                );
                
                if (hasValidContext) {
                  foundWithContext = true;
                }
              }
            });
          }
        });
        
        if (foundWithContext) {
          const skillKey = `${name}|${category}`;
          if (!seen.has(skillKey)) {
            seen.add(skillKey);
            skills.push({ name, category });
            console.log(`✅ Validated skill: ${name} (${category})`);
          }
        } else {
          console.log(`⚠️ Skipping ${name} - found but no valid context`);
        }
      }
    });
  });

  extractSkillsFromSections(text, skills, seen);
  
  console.log(`✅ Total skills extracted: ${skills.length}`);
  return skills;
}

function extractSkillsFromSections(text, skills, seen) {

  const sectionPatterns = [
    /skills?:?\s*\n([^•\n]{50,1000})/i,
    /technical\s+skills?:?\s*\n([^•\n]{50,1000})/i,
    /expertise:?\s*\n([^•\n]{50,1000})/i,
    /qualifications?:?\s*\n([^•\n]{50,1000})/i,
    /competencies?:?\s*\n([^•\n]{50,1000})/i,
  ];
  
  let sectionText = '';
  
  sectionPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match[1]) {
      sectionText += ' ' + match[1];
    }
  });
  
  if (sectionText) {
    console.log(`Found skills section (${sectionText.length} chars)`);
    
    const items = sectionText.split(/[,•·\|\n\t;/]+/);
    
    items.forEach(item => {
      const trimmed = item.trim();
      if (trimmed.length >= 2 && trimmed.length <= 40) {
     
        if (/^[A-Za-z0-9+#.&\/\s-]+$/.test(trimmed)) {
          const genericTerms = ['and', 'with', 'using', 'via', 'including', 'etc'];
          if (!genericTerms.includes(trimmed.toLowerCase())) {
            const skillKey = `${trimmed}|Skills Section`;
            if (!seen.has(skillKey)) {
              seen.add(skillKey);
              skills.push({ 
                name: trimmed, 
                category: 'Skills Section' 
              });
            }
          }
        }
      }
    });
  }
}


app.post("/analyze", upload.single("resume"), async (req, res) => {
  console.log("=== ANALYSIS REQUEST ===");
  
  try {
    const jobDescription = req.body.jobDescription || "";
    const resumeTextFromBody = req.body.resumeText || "";
    const file = req.file;

    console.log("Job description length:", jobDescription.length);

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ 
        error: "Please provide a detailed job description (at least 20 characters).",
        type: "validation_error"
      });
    }

    let resumeText = resumeTextFromBody;
    

    if (file) {
      console.log(`Processing uploaded file: ${file.originalname}`);
      try {
       resumeText = await extractText(file);
console.log(`✅ Extracted ${resumeText.length} characters from file`);

if (!resumeText || resumeText.trim().length < 50) {
          return res.status(400).json({
            error: "The PDF content is too short or unreadable. It might be an image-based scan.",
            type: "extraction_error",
          });
        }

      } catch (err) {
        console.error("File extraction error:", err.message);
        return res.status(400).json({ 
          error: `Failed to process file: ${err.message}`,
          type: "extraction_error"
        });
      }
    } else if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ 
        error: "Please provide resume content (at least 50 characters).",
        type: "validation_error"
      });
    }
    const jobSkills = extractAllSkills(jobDescription);
    const resumeSkills = extractAllSkills(resumeText);
    
    console.log("Job skills:", jobSkills.map(s => s.name));
    console.log("Resume skills:", resumeSkills.map(s => s.name));
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
    
  
    const baseScore = jobSkills.length > 0 
      ? Math.min(10, (presentSkills.length / jobSkills.length) * 10)
      : 5.0;
    
    const atsScore = Math.min(100, (baseScore * 10) + (presentSkills.length * 2));
    let experienceLevel = "mid";
    const techSkillCount = presentSkills.filter(s => 
      ['Programming Languages', 'Web Development', 'Backend Development', 
       'Databases', 'Cloud & DevOps'].includes(s.category)
    ).length;
    
    if (techSkillCount < 3) experienceLevel = "junior";
    else if (techSkillCount >= 6) experienceLevel = "senior";
    

    let matchLevel = "Needs Improvement";
    if (baseScore >= 8.5) matchLevel = "Excellent Match";
    else if (baseScore >= 7.0) matchLevel = "Strong Match";
    else if (baseScore >= 6.0) matchLevel = "Good Fit";
    else if (baseScore >= 5.0) matchLevel = "Moderate Match";
    else if (baseScore >= 3.0) matchLevel = "Needs Improvement";
    else matchLevel = "Weak Match";

    let summary = `Found ${presentSkills.length} matching skills out of ${jobSkills.length} required. `;
    
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
    

    const learningPath = missingSkills.slice(0, 3).map((skill, idx) => ({
      skill: skill.name,
      timeEstimate: idx === 0 ? "1-2 months" : idx === 1 ? "2-3 months" : "3-4 months",
      resources: ["Online courses", "Documentation", "Practice projects"],
      priority: idx === 0 ? "High" : idx === 1 ? "Medium" : "Low"
    }));
    

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
    
    const finalResponse = {
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
        jobDescLength: jobDescription.length,
        resumeLength: resumeText.length,
        modelUsed: "safe_extraction_v2",
        fileType: file ? file.mimetype : "text",
        skillsDetected: presentSkills.length + missingSkills.length
      }
    };

    console.log("✅ Analysis completed successfully");
    return res.json(finalResponse);

  } catch (error) {
    console.error("❌ Analysis Error:", error);
    return res.status(500).json({ 
      error: `Analysis failed: ${error.message}. Please try again.`,
      type: "general_error"
    });
  }
});


app.post("/ai-chat", async (req, res) => {
  console.log("=== AI CHAT REQUEST ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { 
      userMessage, 
      conversation = [], 
      analysisSummary = null,
      jobDesc = "",
      resumeText = ""
    } = req.body;

    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      return res.status(400).json({ 
        response: "Please provide a message.",
        success: false,
        source: "validation"
      });
    }

    const lowerMsg = userMessage.toLowerCase().trim();
    
    // Handle greetings locally
    const greetings = {
      'hello': "Hello! I'm Career Compass AI. How can I help you today?",
      'hi': "Hi there! Ready to boost your career prospects?",
      'hey': "Hey! Let's work on improving your job match.",
      'thank you': "You're welcome! Feel free to ask more questions.",
      'thanks': "You're welcome! Happy to help.",
      'bye': "Goodbye! Best of luck with your job search!",
      'goodbye': "Goodbye! Come back anytime.",
      'help': "I'm here to help! Try asking: 'What skills should I learn?' or 'How can I improve my resume?'"
    };

    for (const [greeting, response] of Object.entries(greetings)) {
      if (lowerMsg.includes(greeting)) {
        return res.json({
          response: response,
          success: true,
          source: "local"
        });
      }
    }

    // Handle learning plan requests with fallback
    const dayPlanMatch = lowerMsg.match(/(\d+)\s*days?\s*plan/);
    if (dayPlanMatch) {
      const days = parseInt(dayPlanMatch[1]);
      const missingSkills = analysisSummary?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'key skills';
      
      // LOCAL FALLBACK PLAN - NO API CALL
      const fallbackPlan = `Here's a ${days}-day learning plan for ${missingSkills}:

Phase 1 (Days 1-${Math.floor(days/3)}): Foundations
• Watch beginner tutorials on YouTube or Coursera
• Complete interactive coding exercises
• Learn basic syntax and concepts

Phase 2 (Days ${Math.floor(days/3)+1}-${Math.floor(days*2/3)}): Application
• Build a small project using the skills
• Practice daily with coding challenges
• Join online study groups or forums

Phase 3 (Days ${Math.floor(days*2/3)+1}-${days}): Mastery
• Refine your project with best practices
• Learn advanced features and optimization
• Add the project to your portfolio

Tip: Consistency is key! Dedicate at least 1 hour daily.`;

      return res.json({
        response: fallbackPlan,
        success: true,
        source: "local-plan"
      });
    }

    // SIMPLE CONTEXT RESPONSES
    if (lowerMsg.includes('skill') || lowerMsg.includes('learn') || lowerMsg.includes('prioritize')) {
      const missingSkills = analysisSummary?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'Python, cloud computing';
      const score = analysisSummary?.score || 'N/A';
      
      const response = `Based on your analysis score of ${score}/10, prioritize learning: ${missingSkills}.

1. Start with online courses (Coursera, Udemy, freeCodeCamp)
2. Build practical projects to reinforce learning
3. Add these skills to your resume as you learn them

Which skill would you like to focus on first?`;
      
      return res.json({
        response: response,
        success: true,
        source: "local-skills"
      });
    }

    if (lowerMsg.includes('resume') || lowerMsg.includes('update') || lowerMsg.includes('improve')) {
      const presentSkills = analysisSummary?.skills?.present?.slice(0, 3).map(s => s.name).join(', ') || 'your technical skills';
      
      const response = `To improve your resume:
      
1. Add a "Skills" section at the top highlighting ${presentSkills}
2. Use bullet points starting with action verbs (Developed, Built, Optimized)
3. Quantify achievements with numbers (e.g., "Improved performance by 30%")
4. Tailor your resume to each job application
5. Include relevant projects with GitHub links

Would you like specific resume examples?`;
      
      return res.json({
        response: response,
        success: true,
        source: "local-resume"
      });
    }

    // DEFAULT RESPONSE
    const score = analysisSummary?.score || 'N/A';
    const present = analysisSummary?.skills?.present?.slice(0, 3).map(s => s.name).join(', ') || 'some skills';
    const missing = analysisSummary?.skills?.missing?.slice(0, 3).map(s => s.name).join(', ') || 'a few areas';
    
    const defaultResponse = `I can see your analysis score is ${score}/10.

Your strengths: ${present}
Areas to improve: ${missing}

Try asking me:
• "How can I learn [specific skill]?"
• "Give me resume tips"
• "What projects should I build?"
• "Create a learning schedule"`;

    return res.json({
      response: defaultResponse,
      success: true,
      source: "local-default"
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.json({
      response: "I'm currently updating my systems. In the meantime, focus on the skill gaps identified in your analysis and check out online learning platforms.",
      success: false,
      source: "error"
    });
  }
});

app.get("/test-ai", (req, res) => {
  res.json({
    status: "AI Service Active",
    message: "Career Compass AI is running",
    endpoints: {
      "POST /ai-chat": "AI chat interface",
      "POST /analyze": "Resume analysis",
      "GET /test-ai": "This test endpoint"
    },
    timestamp: new Date().toISOString(),
    version: "2.1.0"
  });
});


app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "Career Compass Backend", 
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    safeExtraction: true
  });
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Career Compass API v2.0.0 - Safe Extraction",
    endpoints: {
      analyze: "POST /analyze",
      aiChat: "POST /ai-chat",
      health: "GET /health"
    },
    features: [
      "Safe PDF/DOCX text extraction",
      "Context-aware skill detection",
      "No binary decoding fallbacks",
      "Metadata filtering"
    ]
  });
});



app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔒 Safe text extraction: ENABLED`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /analyze - Resume analysis`);
  console.log(`   POST /ai-chat - AI career coach`);
  console.log(`   GET /health - Health check`);
});