"use client";
import React, { useState, useRef, useEffect, useCallback, use } from "react";
import { getStroke } from "perfect-freehand";
import { ArrowLeft, Eraser, Highlighter, MousePointer2, PenTool, MessageSquarePlus, Upload, FileText, Trash2, Plus, Undo2, Redo2, Scissors, PanelRightClose, PanelRightOpen, Sparkles, BrainCircuit, XCircle, CheckCircle, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/store/DataContext";
import { get, set, del } from "idb-keyval";

function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

type Line = { id: string, points: number[][], tool: string };

export default function PdfWorkspace({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ pdfId?: string }> }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  
  const { subjects, addPdfToModule, removePdfFromModule, addMistakeToModule } = useData();
  
  let targetSubject = null;
  let targetModule = null;
  let targetType: 'theory' | 'lab' = 'theory';

  for (const s of subjects) {
    const tm = s.theoryModules.find(m => m.id === resolvedParams.id);
    if (tm) { targetSubject = s; targetModule = tm; targetType = 'theory'; break; }
    const lm = s.labModules.find(m => m.id === resolvedParams.id);
    if (lm) { targetSubject = s; targetModule = lm; targetType = 'lab'; break; }
  }

  const [tool, setTool] = useState<"pan" | "pen" | "highlighter" | "eraser">("pan");
  const [askGptPosition, setAskGptPosition] = useState<{x: number, y: number, text: string} | null>(null);
  
  // PDF Document ID -> strict object URL map
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [activePdfId, setActivePdfId] = useState<string | null>(null);

  useEffect(() => {
    if (resolvedSearchParams.pdfId && !activePdfId) {
      setActivePdfId(resolvedSearchParams.pdfId);
    }
  }, [resolvedSearchParams.pdfId, activePdfId]);
  
  const [isShootingIn, setIsShootingIn] = useState(false);
  const [animatingName, setAnimatingName] = useState("");

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  
  // Quiz State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizMaxQs, setQuizMaxQs] = useState(10);
  const [quizDiff, setQuizDiff] = useState("Medium");
  const [quizState, setQuizState] = useState<'idle'|'generating'|'active'|'finished'>('idle');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Annotation state per PDF
  const [linesData, setLinesData] = useState<Record<string, Line[]>>({});
  const [historyIndex, setHistoryIndex] = useState<Record<string, number>>({});
  
  // Personal Notes state per PDF
  const [notesData, setNotesData] = useState<Record<string, string>>({});

  const [currentLine, setCurrentLine] = useState<number[][]>([]);

  const activeLines = activePdfId ? (linesData[activePdfId] || []).slice(0, historyIndex[activePdfId] || 0) : [];

  const pdfList = targetModule?.pdfs || [];
  const activePdfMeta = pdfList.find(p => p.id === activePdfId);
  const activePdfUrl = activePdfId ? pdfUrls[activePdfId] : null;

  // Lazy load PDF chunks from IndexedDB when selected
  useEffect(() => {
    if (activePdfId && !pdfUrls[activePdfId]) {
      get(`pdf_${activePdfId}`).then((fileBlob) => {
        if (fileBlob) {
          const url = URL.createObjectURL(fileBlob);
          setPdfUrls(prev => ({ ...prev, [activePdfId]: url }));
        }
      });
    }
  }, [activePdfId, pdfUrls]);

  // Load from local storage on mount
  useEffect(() => {
    const savedLines = localStorage.getItem('study_os_pdf_annotations');
    if (savedLines) {
      try {
        const parsed = JSON.parse(savedLines);
        setLinesData(parsed);
        const initialHistory: Record<string, number> = {};
        Object.keys(parsed).forEach(k => initialHistory[k] = parsed[k].length);
        setHistoryIndex(initialHistory);
      } catch (e) {}
    }

    const savedNotes = localStorage.getItem('study_os_pdf_notes');
    if (savedNotes) {
      try {
        setNotesData(JSON.parse(savedNotes));
      } catch (e) {}
    }
  }, []);

  // Save Lines
  useEffect(() => {
    if (Object.keys(linesData).length > 0) {
      localStorage.setItem('study_os_pdf_annotations', JSON.stringify(linesData));
    }
  }, [linesData]);

  // Save Notes
  useEffect(() => {
    if (Object.keys(notesData).length > 0) {
      localStorage.setItem('study_os_pdf_notes', JSON.stringify(notesData));
    }
  }, [notesData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !targetSubject || !targetModule) return;
    
    const files = Array.from(e.target.files);
    
    // Process first file with animation
    const mainFile = files[0];
    const mainId = Math.random().toString(36).substring(7);
    
    setAnimatingName(mainFile.name);
    setIsShootingIn(true);
    
    // Save all to IDB
    for (const f of files) {
      const id = f === mainFile ? mainId : Math.random().toString(36).substring(7);
      await set(`pdf_${id}`, f);
      // Pre-cache URL natively
      setPdfUrls(prev => ({ ...prev, [id]: URL.createObjectURL(f) }));
      addPdfToModule(targetSubject.id, targetType, targetModule.id, { id, name: f.name });
    }

    setTimeout(() => {
      setActivePdfId(mainId);
      setIsShootingIn(false);
      setIsNotesOpen(true); // Open notes automatically when a PDF is inserted
      setHistoryIndex(prev => ({ ...prev, [mainId]: linesData[mainId]?.length || 0 }));
    }, 1200);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (tool === "pan" || !activePdfId) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    
    const rect = (e.target as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "eraser") {
      eraseStroke(x, y);
    } else {
      setCurrentLine([[x, y, e.nativeEvent.pressure || 0.5]]);
    }
  };

  const eraseStroke = (x: number, y: number) => {
    if (!activePdfId) return;
    const threshold = 25;
    const currentLines = linesData[activePdfId] || [];
    const maxIdx = historyIndex[activePdfId] || 0;
    const visibleLines = currentLines.slice(0, maxIdx);
    
    let hitLineId: string | null = null;
    for (let i = visibleLines.length - 1; i >= 0; i--) {
      const line = visibleLines[i];
      for (const pt of line.points) {
        if (Math.abs(pt[0] - x) < threshold && Math.abs(pt[1] - y) < threshold) {
          hitLineId = line.id;
          break;
        }
      }
      if (hitLineId) break;
    }

    if (hitLineId) {
      const newLines = visibleLines.filter(l => l.id !== hitLineId);
      setLinesData(prev => ({ ...prev, [activePdfId]: newLines }));
      setHistoryIndex(prev => ({ ...prev, [activePdfId]: newLines.length }));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1 || tool === "pan" || !activePdfId) return;
    const rect = (e.target as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "eraser") {
      eraseStroke(x, y);
    } else {
      setCurrentLine((prev) => [...prev, [x, y, e.nativeEvent.pressure || 0.5]]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (tool === "pan" || tool === "eraser" || !activePdfId || currentLine.length === 0) return;
    
    const newLine: Line = { id: Math.random().toString(36).substring(7), points: currentLine, tool };
    const maxIdx = historyIndex[activePdfId] || 0;
    const newLines = [...(linesData[activePdfId] || []).slice(0, maxIdx), newLine];
    
    setLinesData(prev => ({ ...prev, [activePdfId]: newLines }));
    setHistoryIndex(prev => ({ ...prev, [activePdfId]: newLines.length }));
    setCurrentLine([]);
  };

  const undo = () => {
    if (!activePdfId) return;
    setHistoryIndex(prev => ({ ...prev, [activePdfId]: Math.max(0, (prev[activePdfId] || 0) - 1) }));
  };

  const redo = () => {
    if (!activePdfId) return;
    const maxHistory = linesData[activePdfId]?.length || 0;
    setHistoryIndex(prev => ({ ...prev, [activePdfId]: Math.min(maxHistory, (prev[activePdfId] || 0) + 1) }));
  };

  const generateQuiz = async () => {
    if (!activePdfId || !targetModule || !targetSubject) return;
    setQuizState('generating');
    setQuizError(null);
    
    try {
      // 1. Fetch file from IndexedDB
      const fileBlob = await get(`pdf_${activePdfId}`);
      if (!fileBlob) throw new Error("Could not read PDF from storage.");

      // 2. Prepare Form Data to send Blob to Next.js API where pdf-parse runs natively
      const formData = new FormData();
      formData.append('file', fileBlob);
      formData.append('numQuestions', quizMaxQs.toString());
      formData.append('difficulty', quizDiff);

      // 3. Call AI API
      const response = await fetch('/api/quiz', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz from AI.");
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Unexpected API response format.");
      }

      // 4. Load Quiz
      setQuizQuestions(data.questions);
      setQuizIndex(0);
      setQuizScore(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setQuizState('active');

    } catch (e: any) {
      console.error("Quiz Gen Error:", e);
      setQuizError(e.message || "An unexpected error occurred.");
      setQuizState('idle');
    }
  };

  const handleQuizAnswer = (idx: number) => {
    if (selectedOption !== null || !targetModule || !targetSubject) return; // Prevent double answer
    setSelectedOption(idx);
    setShowExplanation(true);
    
    const currQ = quizQuestions[quizIndex];
    if (idx === currQ.correctIdx) {
      setQuizScore(s => s + 1);
    } else {
      // Add mistake to global DB
      addMistakeToModule(targetSubject.id, targetType, targetModule.id, {
        question: currQ.question,
        topic: currQ.topic || 'General',
        yourAnswer: currQ.options[idx],
        correctAnswer: currQ.options[currQ.correctIdx],
        explanation: currQ.explanation
      });
    }

    setTimeout(() => {
      if (quizIndex < quizQuestions.length - 1) {
        setQuizIndex(i => i + 1);
        setSelectedOption(null);
        setShowExplanation(false);
      } else {
        setQuizState('finished');
      }
    }, 4000);
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0f] text-white relative overflow-hidden flex pl-20 scene-3d">
      
      {/* CRAZY BULLET ANIMATION OVERLAY */}
      <AnimatePresence>
        {isShootingIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
            style={{ perspective: "1500px" }}
          >
            {/* Screen Flash */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.1, delay: 0.9 }}
              className="absolute inset-0 bg-white mix-blend-overlay"
            />
            {/* Flying Bullet Object */}
            <motion.div
              initial={{ scale: 0, z: -2000, rotateZ: -180, opacity: 0 }}
              animate={{ scale: [0, 0.5, 15], z: [-2000, 0, 1000], rotateZ: [180, 0, -25], opacity: [0, 1, 0] }}
              transition={{ duration: 1.1, ease: [0.11, 0, 0.5, 0], times: [0, 0.8, 1] }} 
              className="glass-panel p-8 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(99,102,241,1)] bg-gradient-to-br from-blue-600/90 to-purple-600/90 rounded-2xl border-2 border-white"
            >
              <FileText className="w-32 h-32 text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
              <h1 className="text-4xl font-black text-white text-center drop-shadow-lg whitespace-nowrap">{animatingName}</h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={isShootingIn ? {
          x: [0, 0, -30, 40, -20, 25, -10, 10, 0],
          y: [0, 0, 20, -30, 15, -20, 10, -5, 0],
          scale: [1, 1, 1.05, 1.02, 1, 1]
        } : { x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }} 
        className="w-full h-full flex"
      >

        {/* Sidebar for PDFs */}
        <div className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl shrink-0 flex flex-col z-50">
          <div className="p-4 border-b border-white/10">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Exit Workspace
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight mb-4">Documents</h2>
            
            <input 
              type="file" 
              multiple 
              accept="application/pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-500/20 hover:bg-primary-500/40 border border-primary-500/50 text-white font-semibold flex flex-col items-center justify-center gap-1 transition-all group"
            >
              <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
              <span className="text-xs uppercase tracking-wider">Upload PDFs</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {pdfList.length === 0 && (
              <div className="text-center p-6 text-gray-500 text-sm italic">
                No PDFs uploaded yet. Try adding some!
              </div>
            )}
            {pdfList.map((pdf: any) => (
              <div key={pdf.id} className="relative group">
                <button 
                  onClick={() => setActivePdfId(pdf.id)}
                  className={`w-full text-left p-3 pr-10 rounded-xl flex items-center justify-between transition-all border ${activePdfId === pdf.id ? 'bg-primary-500/20 border-primary-500/50 text-white' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate text-sm font-medium">{pdf.name}</span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this PDF from the module?")) {
                      if (targetSubject && targetModule) {
                        removePdfFromModule(targetSubject.id, targetType, targetModule.id, pdf.id);
                        del(`pdf_${pdf.id}`);
                        if (activePdfId === pdf.id) setActivePdfId(null);
                      }
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 h-screen flex flex-col relative bg-[#11111b]">
          
          {/* Top Toolbar */}
          <div className="h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-40">
            <div className="flex items-center gap-3">
              <ToolBtn active={tool === "pan"} onClick={() => setTool("pan")} icon={MousePointer2} label="Pan (Select Text)" />
              <div className="w-px h-6 bg-white/20 mx-2" />
              
              <div className="flex gap-1">
                <button onClick={undo} disabled={!activePdfId || (historyIndex[activePdfId] || 0) === 0} className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" title="Undo (Cmd+Z)">
                  <Undo2 className="w-5 h-5" />
                </button>
                <button onClick={redo} disabled={!activePdfId || (historyIndex[activePdfId] || 0) === (linesData[activePdfId]?.length || 0)} className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" title="Redo (Cmd+Shift+Z)">
                  <Redo2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="w-px h-6 bg-white/20 mx-2" />
              <ToolBtn active={tool === "pen"} onClick={() => setTool("pen")} icon={PenTool} label="Pen" />
              <ToolBtn active={tool === "highlighter"} onClick={() => setTool("highlighter")} icon={Highlighter} label="Highlight" />
              <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} icon={Scissors} label="Stroke Eraser (Click line to remove)" />
              
              <button 
                onClick={() => {
                  if (activePdfId && confirm("Are you sure you want to clear ALL annotations?")) {
                    setLinesData(prev => ({ ...prev, [activePdfId]: [] }));
                    setHistoryIndex(prev => ({ ...prev, [activePdfId]: 0 }));
                  }
                }}
                title="Clear All Annotations"
                className="p-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors ml-4 border border-rose-500/20 bg-rose-500/5 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-semibold pr-2">Clear All</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setIsQuizModalOpen(true); setQuizState('idle'); }}
                disabled={!activePdfId}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                <BrainCircuit className="w-5 h-5" />
                AI Quiz Generator
              </button>
              
              <button
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className={`p-2.5 rounded-xl border transition-all ${isNotesOpen ? 'bg-primary-500/20 border-primary-500/50 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Toggle Personal Notes"
              >
                {isNotesOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Workspace Body */}
          <div className="flex-1 w-full flex relative overflow-hidden">
            {/* Document / Canvas Container */}
            <div className="flex-1 relative overflow-hidden bg-[#1a1a24]">
              {activePdfUrl ? (
                <>
                  <iframe 
                    src={activePdfUrl} 
                    className="w-full h-full border-none pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white"
                    title="PDF Viewer"
                  />
                  <svg 
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                      zIndex: tool === "pan" ? -1 : 10,
                      pointerEvents: tool === "pan" ? "none" : "auto",
                      mixBlendMode: tool === 'highlighter' ? 'multiply' : 'normal',
                      cursor: tool === 'eraser' ? 'crosshair' : 'default'
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {activeLines.map((line, i) => {
                      const strokeConfig = line.tool === 'highlighter' 
                        ? { size: 28, thinning: 0.1, smoothing: 0.5, streamline: 0.5 }
                        : { size: 5, thinning: 0.6, smoothing: 0.5, streamline: 0.5 };
                      const pathData = getSvgPathFromStroke(getStroke(line.points, strokeConfig));
                      return (
                        <path 
                          key={line.id} 
                          d={pathData} 
                          fill={line.tool === 'highlighter' ? 'rgba(250, 204, 21, 0.4)' : '#3b82f6'} 
                          style={{ mixBlendMode: line.tool === 'highlighter' ? 'multiply' : 'normal' }}
                        />
                      );
                    })}
                    
                    {currentLine.length > 0 && (
                      <path 
                        d={getSvgPathFromStroke(getStroke(currentLine, tool === 'highlighter' 
                          ? { size: 28, thinning: 0.1 } 
                          : { size: 5, thinning: 0.6 }
                        ))} 
                        fill={tool === 'highlighter' ? 'rgba(250, 204, 21, 0.4)' : '#3b82f6'}
                        style={{ mixBlendMode: tool === 'highlighter' ? 'multiply' : 'normal' }}
                      />
                    )}
                  </svg>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50">
                  <FileText className="w-24 h-24 mb-6 text-gray-500" />
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Empty Workspace</h2>
                  <p className="text-gray-400 max-w-sm">Upload local PDFs using the sidebar. They will be loaded natively and you can draw directly over them.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar for Personal Notes */}
            <AnimatePresence>
              {isNotesOpen && activePdfId && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-left border-white/10 bg-black/40 backdrop-blur-xl shrink-0 flex flex-col z-50 overflow-hidden"
                >
                  <div className="w-[320px] flex flex-col h-full bg-[#11111b]/80 border-l border-white/10">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                      <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <PanelRightOpen className="w-5 h-5 text-primary-400" />
                        My Notes
                      </h2>
                      <button onClick={() => setIsNotesOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <PanelRightClose className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 p-4 flex flex-col">
                      <textarea
                        value={notesData[activePdfId] || ""}
                        onChange={(e) => setNotesData(prev => ({...prev, [activePdfId]: e.target.value}))}
                        placeholder="Jot down your personal thoughts, summaries, and key bullet points here. They will automatically save!"
                        className="flex-1 w-full bg-black/40 text-gray-100 rounded-xl border border-white/10 p-4 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 resize-none placeholder:text-gray-600 font-medium tracking-wide shadow-inner leading-relaxed"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* AI Quiz Generator Modal */}
      <AnimatePresence>
        {isQuizModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#11111b] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-2xl w-full relative"
            >
              <button 
                onClick={() => { setIsQuizModalOpen(false); setQuizState('idle'); }} 
                className="absolute top-6 right-6 text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Brain className="w-8 h-8" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">AI Quiz Engine</h2>
                  <p className="text-sm text-gray-400">Generate a custom quiz based on this document.</p>
                </div>
              </div>

              {quizState === 'idle' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Questions</label>
                    <input 
                      type="range" min="5" max="60" step="5"
                      value={quizMaxQs} onChange={e => setQuizMaxQs(parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="text-right text-xs text-blue-400 font-bold mt-1">{quizMaxQs} Questions</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                    <div className="flex gap-2">
                      {["Easy", "Medium", "Hard"].map(level => (
                        <button 
                          key={level} onClick={() => setQuizDiff(level)}
                          className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${quizDiff === level ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={generateQuiz}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all flex justify-center items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> Generate from PDF Content
                  </button>
                  {quizError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-3">
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block mb-1">Failed to Generate Quiz</strong>
                        {quizError}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {quizState === 'generating' && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <BrainCircuit className="w-16 h-16 text-blue-500 animate-pulse mb-4" />
                  <h3 className="text-xl font-bold tracking-tight">Extracting Text & Analyzing...</h3>
                  <p className="text-gray-400 text-sm">Our AI is reading your PDF to generate highly contextual questions.</p>
                </div>
              )}

              {quizState === 'active' && quizQuestions.length > 0 && (
                <motion.div key={quizIndex} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  <div className="flex justify-between items-center mb-6 text-sm font-semibold text-gray-400">
                    <span>Question {quizIndex + 1} / {quizQuestions.length}</span>
                    <span>Score: {quizScore}</span>
                  </div>
                  <h3 className="text-xl font-medium leading-relaxed mb-6">{quizQuestions[quizIndex].question}</h3>
                  <div className="space-y-3">
                    {quizQuestions[quizIndex].options.map((opt: string, i: number) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = i === quizQuestions[quizIndex].correctIdx;
                      
                      let btnStateClass = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10';
                      if (showExplanation) {
                        if (isCorrect) btnStateClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                        else if (isSelected) btnStateClass = 'bg-rose-500/20 border-rose-500 text-rose-400';
                        else btnStateClass = 'bg-white/5 border-white/5 text-gray-500 opacity-50';
                      }

                      return (
                        <button 
                          key={i} onClick={() => handleQuizAnswer(i)} disabled={showExplanation}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${btnStateClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {showExplanation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">Topic: {quizQuestions[quizIndex].topic}</div>
                      <p className="text-sm text-blue-200">{quizQuestions[quizIndex].explanation}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {quizState === 'finished' && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
                  <h3 className="text-3xl font-black mb-2">Quiz Complete!</h3>
                  <p className="text-gray-400 mb-8">You scored {quizScore} out of {quizQuestions.length}.</p>
                  <p className="text-sm text-yellow-400/80 max-w-sm mb-8">Incorrect answers have been saved to the Module Dashboard for later revision.</p>
                  <button 
                    onClick={() => { setIsQuizModalOpen(false); setQuizState('idle'); }}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
                  >
                    Return to Workspace
                  </button>
                </div>
              )}
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ToolBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className={`p-2.5 rounded-lg transition-all ${active ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
