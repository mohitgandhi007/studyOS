# 🧠 AI-Powered Interactive Study Workspace

An advanced, full-stack Next.js application designed to revolutionize digital studying. This platform features an interactive knowledge map, a robust local-first PDF viewer with dynamic annotations, and a native integration with the cutting-edge **Google Gemini 2.5 Flash** AI model for automated semantic quiz generation.

![Study Workspace Demo](./public/icon.svg) <!-- Replace with a real screenshot once deployed! -->

## ✨ Key Features

*   **Interactive Knowledge Map**: A beautifully animated, force-directed graph (built with Framer Motion) that visually maps your subjects, modules, and study materials into an intuitive orbital UI layout.
*   **Local-First PDF Workspace**: An integrated PDF viewer (`pdfjs-dist`) that loads your textbooks and notes natively inside the browser. It features:
    *   **Persistent Annotations**: Draw, highlight, erase, and save strokes permanently.
    *   **IndexedDB Caching**: Files are stored securely offline inside your browser for instant loading—no slow cloud uploads required!
*   **Genuine AI Quiz Generation (Gemini 2.5 Flash)**: Completely bypasses manual question writing. 
    *   The Next.js backend securely extracts the text from your loaded PDF using `pdf-parse`.
    *   It streams the massive text payload to the experimental, ultra-fast **Gemini 2.5 Flash** engine.
    *   Returns a fully structured, heavily-educational multiple-choice quiz scaled to your requested difficulty level in seconds, complete with detailed explanations for the correct answers.
*   **Advanced Glassmorphism UI**: Dynamic background animations and a highly polished, responsive component library.

## 🛠️ Technology Stack

*   **Framework**: Next.js 14 (App Router)
*   **AI Engine**: `@google/generative-ai` (Gemini 2.5 Flash API)
*   **Styling**: Pure CSS / Tailwind Architecture
*   **Animations**: Framer Motion
*   **PDF Rendering & Parsing**: `react-pdf`, `pdfjs-dist`, `pdf-parse`
*   **State & Storage**: Zustand (Global UI State), `idb-keyval` (Client-side Document Storage)

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/study_site_proj.git
   cd study_site_proj
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API Key:**
   To use the AI Quiz Generator, you need a free API key from Google AI Studio.
   * Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and generate an API key.
   * Create a new file in the root directory named `.env.local`.
   * Add the following line to the file:
     ```env
     GEMINI_API_KEY="your_api_key_here"
     ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the result!


## 🔒 Security Note
The `.env.local` file is explicitly ignored in the `.gitignore` configuration to ensure your Gemini API keys are never accidentally uploaded to GitHub.

---
*Built with Next.js, Framer Motion, and Google Gemini.*
