# 🧠 StudyOS – AI-Powered Interactive Study Workspace  

An intelligent full-stack study platform designed to transform how students interact with learning materials using **AI, visualization, and local-first design**.

---

## 🚀 Why StudyOS?

Traditional studying is:
- Static (PDFs, notes)  
- Disorganized  
- Passive  

👉 StudyOS turns it into:
- Interactive  
- Visual  
- AI-assisted  

---

## ✨ Core Features  

### 🧠 AI Quiz Generation (Gemini Integration)
- Automatically generates quizzes from your study material  
- Uses **Google Gemini 2.5 Flash** for fast, contextual MCQs  
- Provides detailed explanations for better understanding  

---

### 📄 Local-First PDF Workspace  
- Load PDFs directly in the browser (no upload required)  
- Persistent annotations (draw, highlight, erase)  
- Offline caching using IndexedDB for instant access  

---

### 🌌 Interactive Knowledge Map  
- Visualize subjects and topics in a dynamic graph  
- Built using animated UI (Framer Motion)  
- Helps connect concepts intuitively  

---

### ⚡ Smooth User Experience  
- Glassmorphism UI with responsive design  
- Real-time interactions with optimized performance  

---

## 🛠 Tech Stack  

- **Frontend:** Next.js 14, Tailwind CSS  
- **AI:** Google Gemini API  
- **State Management:** Zustand  
- **PDF Handling:** react-pdf, pdfjs-dist, pdf-parse  
- **Storage:** IndexedDB (idb-keyval)  

---

## 🧩 How It Works  

1. Load or select a PDF  
2. Extract text using backend  
3. Send content to Gemini AI  
4. Generate quiz instantly  
5. Interact, annotate, and revise  

---

## 📸 Demo  
(click the image below to view the demo)
<p align="center">
  <a href="https://youtu.be/3E3Jx3Z_Y5A">
    <img src="https://img.youtube.com/vi/3E3Jx3Z_Y5A/0.jpg" alt="Watch Demo" />
  </a>
</p>

---

## ⚙️ Setup  

bash
git clone https://github.com/mohitgandhi007/studyOS.git
cd studyOS
npm install

Create .env.local file:

GEMINI_API_KEY=your_api_key_here

Run the development server:

npm run dev

Open: http://localhost:3000

⸻

## 🔒 Security
	•	API keys are stored using environment variables
	•	.env.local is excluded via .gitignore

⸻

## 💡 Future Improvements
	•	User authentication & cloud sync
	•	Spaced repetition integration
	•	Collaborative study environments

⸻

## 🧠 What This Project Demonstrates
	•	Full-stack development with Next.js
	•	AI integration using real-world APIs
	•	System design and modular architecture
	•	Focus on user experience and performance

⸻

## 👨‍💻 Author

Mohit Gandhi
	•	GitHub: https://github.com/mohitgandhi007
	•	LinkedIn: https://www.linkedin.com/in/mohit-gandhi-aa8958392/
