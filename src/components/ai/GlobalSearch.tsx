"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, BookOpen, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNav = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0a0a0f]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl text-white pointer-events-auto"
          >
            <div className="flex items-center px-4 py-4 border-b border-white/10">
              <Search className="w-6 h-6 text-gray-400 mr-3" />
              <input 
                autoFocus
                type="text"
                placeholder="Search notes, subjects, modules or ask AI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-xl placeholder-gray-500"
              />
              <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto w-full no-scrollbar">
              {query.length > 0 ? (
                <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">AI Summary</div>
                  <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                      <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">Results for "{query}"</h4>
                      <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                        Based on your notes in Physics, this concept refers to the superposition principle where multiple states can exist simultaneously until observed. Look at Chapter 1 for detailed mathematical proofs.
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-2">Matches in Knowledge Base</div>
                  <div 
                    onClick={() => handleNav('/subject/physics')}
                    className="p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors rounded-xl flex items-center gap-4 border border-transparent hover:border-white/10"
                  >
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Physics &gt; Chapter 1</h4>
                      <p className="text-xs text-gray-400 mt-1">Matched in 4 notes and 2 modules</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => handleNav('/workspace/notebook/m2')}
                    className="p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors rounded-xl flex items-center gap-4 border border-transparent hover:border-white/10"
                  >
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Module: Projectile Motion</h4>
                      <p className="text-xs text-gray-400 mt-1">Matched in Rough Notes</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-gray-500">
                  <Search className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg">Type anything to search across all your subjects or ask for AI summaries.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
