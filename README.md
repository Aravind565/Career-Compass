# Career Compass: AI-Powered Resume & Job Analysis

## 🎯 Overview

Career Compass is a full-stack AI application designed to solve the core challenges college students and early-career professionals face when job hunting.

It matches a resume against a target job description to deliver:

- A clear **Match Score**
- **Skill gap analysis**
- A **personalized learning path**

It answers one critical question:

> **"Do I actually qualify for this job?"**

🔗 **Live Demo:** https://ai-job-compass.netlify.app/

💾 **GitHub Repository:** https://github.com/Aravind565/Career-Compass

---

## ✨ Core Features

| Challenge | Career Compass Solution |
|-----------|-------------------------|
| ❓ Do I actually qualify? | 📊 Match Score (0–10) with weighted breakdown |
| ❓ Which skills am I missing? | 🧩 Skill Gap Analysis (Present vs Required) |
| ❓ Why did my resume get rejected? | 🤖 ATS Compatibility Score with improvement tips |
| ❓ What should I learn next? | 📚 Personalized Learning Path |
| ❓ How do I improve quickly? | 💡 Actionable Resume Improvement Tips |
| ❓ Who can answer my questions? | 💬 AI Career Coach (24/7 Q&A) |

---

## 🏗️ System Architecture

The application follows a modern, decoupled architecture for scalability and clarity.

<img width="1788" height="1593" alt="Career Compass Architecture" src="https://github.com/user-attachments/assets/e19ebf01-eea2-4a29-90fa-68151b41e9c9" />

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Vite | Modern UI & fast build |
| Styling | Tailwind CSS | Responsive UI |
| Backend | Node.js, Express.js | API & business logic |
| Parsing | pdf-parse, Multer | Resume parsing |
| AI/LLM | Groq API | High-speed inference |
| Deployment | Netlify, Render | Hosting |

---

## 🚀 Setup & Local Development

### Prerequisites

- Node.js v14+
- npm
- Git
- Groq API Key

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Aravind565/Career-Compass.git
cd Career-Compass
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

Start the backend server:

```bash
npm start
```

📍 Backend runs at: `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

📍 Frontend runs at: `http://localhost:5173`

---

## 📋 Usage Workflow

1. Paste a job description
2. Upload or paste your resume
3. Review the analysis results
4. Export and improve your resume

---

## 🔧 Key Design Decisions

- **No Database** – Ensures privacy and keeps the project focused as a PoC
- **Groq API** – Faster and more cost-effective LLM inference
- **Frontend–Backend Separation** – Production-grade, scalable architecture
- **Graceful Error Handling** – Detects scanned PDFs and guides users properly

---

## 🔐 Privacy & Data Security

✅ In-memory processing only

✅ No data storage

✅ HTTPS secured

❌ No tracking or analytics

---

## 📈 Future Enhancements

- User accounts & history
- Advanced ML scoring
- Job board integrations
- Browser extension

---

## 🤝 Contributing

Contributions are welcome!

```bash
git checkout -b feature/AmazingFeature
git commit -m "Add AmazingFeature"
git push origin feature/AmazingFeature
```

---

## 👨‍💻 Developer

**Aravind A**

Final-year Engineering Student | Aspiring Full-Stack Developer

- 🐙 GitHub: https://github.com/Aravind565
- 💼 LinkedIn: https://www.linkedin.com/in/aravind565/

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**
