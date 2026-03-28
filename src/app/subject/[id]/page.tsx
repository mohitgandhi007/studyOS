"use client";
import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Folder, File, PenTool, Plus, Trash2, BrainCircuit, XCircle, Trash } from "lucide-react";
import Link from "next/link";
import { useData, Module } from "@/store/DataContext";

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { subjects, addModule, deleteModule, clearMistakes } = useData();
  const [expandedSection, setExpandedSection] = useState<string | null>("theory");
  const [mistakeModule, setMistakeModule] = useState<{mod: Module, type: 'theory'|'lab'} | null>(null);

  const subject = subjects.find(s => s.id === resolvedParams.id);

  if (!subject) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-white pl-20">
        <div className="text-center glass-panel p-12">
          <h1 className="text-3xl font-bold mb-4">Subject Not Found</h1>
          <button onClick={() => router.back()} className="text-primary-400 hover:text-primary-300 flex items-center gap-2 mx-auto justify-center">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "theory", title: "Theory Modules", modules: subject.theoryModules },
    ...(subject.hasLab ? [{ id: "lab", title: "Lab Modules", modules: subject.labModules }] : [])
  ];

  return (
    <div className="w-full min-h-screen px-4 md:px-20 py-24 text-white relative">
      <div className="max-w-5xl mx-auto relative z-10 w-full">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-12 text-gray-400 hover:text-white transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Universe</span>
        </button>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 pb-2">
          {subject.code}
        </h1>
        <h2 className="text-3xl font-bold text-white mb-4 mt-2">{subject.title}</h2>
        <p className="text-xl text-gray-400 mb-16 max-w-2xl">
          Dive into your theory and laboratory modules. Create new modules or explore existing ones.
        </p>

        <div className="flex flex-col gap-6">
          {sections.map((section, index) => {
            const isExpanded = expandedSection === section.id;
            return (
              <motion.div 
                key={section.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", bounce: 0.2 }}
                className="glass-panel overflow-hidden border border-white/10"
              >
                <div 
                  className="p-6 md:p-8 cursor-pointer flex justify-between items-center group bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-100 group-hover:text-white transition-colors">
                      {section.title}
                    </h2>
                    <span className="text-sm tracking-wider font-semibold text-gray-400 border border-gray-600 px-4 py-1.5 rounded-full whitespace-nowrap self-start sm:self-auto">
                      {section.modules.length} Modules
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = window.prompt(`Enter name for new ${section.title} module:`, `New ${section.id === 'theory' ? 'Theory' : 'Lab'} Module`);
                      if (name) {
                        addModule(subject.id, section.id as 'theory'|'lab', name);
                        setExpandedSection(section.id);
                      }
                    }}
                    className="flex items-center gap-1 text-sm bg-primary-500/20 hover:bg-primary-500/40 border border-primary-500/50 px-4 py-2 rounded-xl backdrop-blur-md transition-all text-white font-semibold shadow-lg hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Module</span>
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 bg-black/20"
                    >
                      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.modules.length === 0 && (
                          <div className="col-span-full p-8 text-center text-gray-500 border border-dashed border-gray-700 rounded-2xl">
                            No modules yet. Click "Add Module" to create one.
                          </div>
                        )}
                        {section.modules.map((mod) => (
                          <motion.div 
                            key={mod.id}
                            whileHover={{ scale: 1.02 }}
                            className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary-500/50 hover:bg-white/10 transition-all flex flex-col gap-4 group shadow-lg relative"
                          >
                            <button 
                              onClick={() => deleteModule(subject.id, section.id as 'theory'|'lab', mod.id)}
                              className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/50 text-red-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                              title="Delete Module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex items-start justify-between pointer-events-none pr-10">
                              <Folder className="w-8 h-8 text-primary-400 group-hover:text-primary-300 transition-colors" />
                              <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-gray-300">
                                {mod.notesCount} Resources
                              </span>
                            </div>
                            <h4 className="font-semibold text-lg text-gray-200 mt-2 pointer-events-none">{mod.title}</h4>
                            
                            <hr className="border-white/10 my-1 pointer-events-none" />
                            
                            <div className="flex flex-wrap gap-2 mt-auto">
                              <Link 
                                href={`/workspace/pdf/${mod.id}`}
                                className="flex-1 flex justify-center items-center gap-2 text-xs font-semibold bg-white/5 hover:bg-white/20 text-white transition-colors cursor-pointer px-3 py-2 rounded-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <File className="w-4 h-4" /> PDFs
                              </Link>
                              
                              <Link 
                                href={`/workspace/notebook/${mod.id}`}
                                className="flex-1 flex justify-center items-center gap-2 text-xs font-semibold bg-primary-500/10 hover:bg-primary-500/30 text-primary-300 transition-colors cursor-pointer px-3 py-2 rounded-xl border border-primary-500/20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PenTool className="w-4 h-4" /> Notebook
                              </Link>

                              {(mod.quizMistakes?.length || 0) > 0 && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setMistakeModule({ mod, type: section.id as 'theory'|'lab' }); }}
                                  className="w-full flex justify-center items-center gap-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer px-3 py-2 rounded-xl border border-rose-500/20 mt-1"
                                >
                                  <BrainCircuit className="w-4 h-4" /> Review Mistakes ({mod.quizMistakes.length})
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quiz Mistakes Modal */}
      <AnimatePresence>
        {mistakeModule && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#11111b] border border-rose-500/20 p-6 md:p-8 rounded-3xl shadow-2xl max-w-3xl w-full relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setMistakeModule(null)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl"><BrainCircuit className="w-8 h-8" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Mistakes Dashboard</h2>
                  <p className="text-sm text-gray-400">Reviewing incorrect questions for: <strong className="text-rose-400">{mistakeModule.mod.title}</strong></p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Clear all mistakes for this module?")) {
                      clearMistakes(subject.id, mistakeModule.type, mistakeModule.mod.id);
                      setMistakeModule(null);
                    }
                  }}
                  className="ml-auto mr-12 px-4 py-2 bg-transparent hover:bg-rose-500/10 text-rose-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-rose-500/20 hover:border-rose-500/50"
                >
                  <Trash className="w-4 h-4" /> Clear All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {mistakeModule.mod.quizMistakes?.map((m: any) => (
                  <div key={m.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-colors">
                    <p className="font-semibold text-lg text-gray-200 mb-4">{m.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <span className="text-xs text-rose-300/70 font-bold uppercase tracking-wider block mb-1">Your Answer</span>
                        <span className="text-rose-200">{m.yourAnswer}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-xs text-emerald-300/70 font-bold uppercase tracking-wider block mb-1">Correct Answer</span>
                        <span className="text-emerald-200">{m.correctAnswer}</span>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <span className="text-xs text-blue-300/70 font-bold uppercase tracking-wider block mb-1">Explanation</span>
                      <p className="text-sm text-blue-100/90 leading-relaxed">{m.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
