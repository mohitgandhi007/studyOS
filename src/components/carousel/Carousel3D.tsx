"use client";
import React, { useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { useRouter } from "next/navigation";
import { Copy, Layout, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useData } from "@/store/DataContext";

export function Carousel3D() {
  const { subjects, addSubject, deleteSubject } = useData();
  const router = useRouter();
  
  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, { damping: 20, stiffness: 100, mass: 1 });
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const angleStep = 360 / Math.max(subjects.length, 1);
  const radius = Math.max(500, subjects.length * 60);

  const bind = useGesture(
    {
      onDrag: ({ offset: [x] }) => {
        rotation.set(x * 0.4);
      },
      onWheel: ({ offset: [, y] }) => {
        rotation.set(rotation.get() - y * 0.2);
      }
    },
    {
      drag: { from: () => [rotation.get() * 2.5, 0] },
      wheel: { from: () => [0, -rotation.get() * 5] }
    }
  );

  const handleNext = () => rotation.set(rotation.get() - angleStep);
  const handlePrev = () => rotation.set(rotation.get() + angleStep);

  const handleCardClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent drag
    if (animatingId) return;
    setAnimatingId(id);
    
    // Play mindblowing transition before routing
    setTimeout(() => {
      router.push(`/subject/${id}`);
    }, 800);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSubject(id);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubTitle, setNewSubTitle] = useState("");
  const [newSubHasLab, setNewSubHasLab] = useState(true);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode || !newSubTitle) return;
    addSubject({ 
      code: newSubCode, 
      title: newSubTitle, 
      color: "from-pink-500/80 to-rose-600/80", 
      hasLab: newSubHasLab 
    });
    setNewSubCode("");
    setNewSubTitle("");
    setNewSubHasLab(true);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center overflow-hidden relative" style={{ perspective: "1500px" }}>
      
      <div className="absolute top-10 text-center z-20 pointer-events-auto flex flex-col items-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
          Knowledge Universe
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-400">Scroll, drag, or use arrows</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 text-sm bg-primary-500/20 hover:bg-primary-500/40 border border-primary-500/50 px-4 py-2 rounded-xl backdrop-blur-md transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Subject
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900/80 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl w-full max-w-md relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Create New Subject</h2>
              
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BACSE101" 
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Intro to Computer Science" 
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <input 
                    type="checkbox" 
                    id="hasLab"
                    checked={newSubHasLab}
                    onChange={(e) => setNewSubHasLab(e.target.checked)}
                    className="w-5 h-5 rounded bg-black/50 border-white/20 text-primary-500 focus:ring-primary-500 focus:ring-offset-gray-900"
                  />
                  <label htmlFor="hasLab" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Include Laboratory Modules
                  </label>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  >
                    Create Subject
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-1/2 -translate-y-1/2 left-8 z-20 pointer-events-auto">
        <button onClick={handlePrev} className="p-4 rounded-full bg-black/60 border border-white/20 backdrop-blur-xl text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] group">
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-8 z-20 pointer-events-auto">
        <button onClick={handleNext} className="p-4 rounded-full bg-black/60 border border-white/20 backdrop-blur-xl text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] group">
          <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Removed white flash to prevent jarring transitions */}

      <motion.div 
        {...(bind() as any)}
        className="relative w-[340px] h-[480px] cursor-grab active:cursor-grabbing flex items-center justify-center touch-none mt-10 z-10"
        style={{ rotateY: smoothRotation, transformStyle: "preserve-3d" }}
      >
        {subjects.map((subject, i) => {
          const angle = i * angleStep;
          const isAnimating = animatingId === subject.id;
          
          return (
            <motion.div
              key={subject.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                transformStyle: "preserve-3d"
              }}
            >
              <motion.div 
                onClick={(e) => handleCardClick(subject.id, e)}
                className="w-full h-full glass-panel transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center p-8 relative overflow-hidden cursor-pointer pointer-events-auto group pt-12"
                style={{ backfaceVisibility: "hidden" }}
                animate={isAnimating ? { 
                  scale: 12,
                  z: 1800,
                  opacity: 0,
                  rotateX: 15,
                  rotateY: -10
                } : { 
                  scale: 1, z: 0, opacity: 1, rotateX: 0, rotateY: 0 
                }}
                transition={isAnimating 
                  ? { type: "spring", stiffness: 40, damping: 15, mass: 1 } // Spring physics for wow factor
                  : { duration: 0.3 }
                }
              >
                {/* Delete config */}
                <button 
                  onClick={(e) => handleDelete(subject.id, e)}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/50 text-red-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md z-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} opacity-10 group-hover:opacity-40 transition-opacity duration-500`} />
                {isAnimating && <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} opacity-80 blur-2xl z-20`} />}
                
                <h3 className="text-4xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl z-10 text-center">
                  {subject.code}
                </h3>
                <p className="text-sm text-gray-300 mb-6 text-center font-medium px-2 z-10">{subject.title}</p>
                
                <div className="mt-auto flex gap-4 text-gray-200 z-10 w-full justify-center">
                  <div className="flex flex-col items-center p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md flex-1">
                    <Layout className="w-5 h-5 mb-1 text-white/80" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{subject.theoryModules.length} Theory</span>
                  </div>
                  {subject.hasLab && (
                    <div className="flex flex-col items-center p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md flex-1">
                      <Layout className="w-5 h-5 mb-1 text-white/80" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{subject.labModules.length} Lab</span>
                    </div>
                  )}
                </div>
                
                <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity delay-75" />
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity delay-75" />
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
