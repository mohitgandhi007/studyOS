"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type PdfMeta = {
  id: string;
  name: string;
};

export type QuizMistake = {
  id: string;
  topic: string;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  explanation: string;
  date: number;
};

export type Module = {
  id: string;
  title: string;
  notesCount: number;
  pdfs: PdfMeta[];
  quizMistakes: QuizMistake[];
};

export type Subject = {
  id: string;
  code: string;
  title: string;
  color: string;
  theoryModules: Module[];
  labModules: Module[];
  hasLab: boolean;
};

const defaultSubjects: Subject[] = [
  { id: "bacse104", code: "BACSE104", title: "Struct. & Object-Oriented Prog.", color: "from-blue-500/80 to-indigo-600/80", theoryModules: [], labModules: [], hasLab: true },
  { id: "bacse105", code: "BACSE105", title: "Data Structures and Algorithms", color: "from-purple-500/80 to-fuchsia-600/80", theoryModules: [], labModules: [], hasLab: true },
  { id: "bacse106", code: "BACSE106", title: "Operating Systems", color: "from-emerald-400/80 to-teal-500/80", theoryModules: [], labModules: [], hasLab: true },
  { id: "baeng101", code: "BAENG101", title: "Technical English Comm.", color: "from-rose-400/80 to-red-500/80", theoryModules: [], labModules: [], hasLab: true },
  { id: "bamat205", code: "BAMAT205", title: "Discrete Math & Linear Algebra", color: "from-amber-400/80 to-orange-500/80", theoryModules: [], labModules: [], hasLab: false },
  { id: "baphy105", code: "BAPHY105", title: "Engineering Physics", color: "from-cyan-400/80 to-blue-500/80", theoryModules: [], labModules: [], hasLab: true },
];

type DataContextType = {
  subjects: Subject[];
  addSubject: (subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addModule: (subjectId: string, type: 'theory'|'lab', title: string) => void;
  deleteModule: (subjectId: string, type: 'theory'|'lab', moduleId: string) => void;
  addPdfToModule: (subjectId: string, type: 'theory'|'lab', moduleId: string, pdf: PdfMeta) => void;
  removePdfFromModule: (subjectId: string, type: 'theory'|'lab', moduleId: string, pdfId: string) => void;
  addMistakeToModule: (subjectId: string, type: 'theory'|'lab', moduleId: string, mistake: Omit<QuizMistake, 'id'|'date'>) => void;
  clearMistakes: (subjectId: string, type: 'theory'|'lab', moduleId: string) => void;
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("study_os_data");
    if (saved) {
      try {
        setSubjects(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const save = (newSubs: Subject[]) => {
    setSubjects(newSubs);
    localStorage.setItem("study_os_data", JSON.stringify(newSubs));
  };

  const addSubject = (sub: Partial<Subject>) => {
    const newSub: Subject = {
      id: sub.code?.toLowerCase() || Math.random().toString(36).substr(2, 9),
      code: sub.code || "NEW101",
      title: sub.title || "New Subject",
      color: sub.color || "from-gray-500/80 to-gray-600/80",
      theoryModules: [],
      labModules: [],
      hasLab: sub.hasLab ?? true,
    };
    save([...subjects, newSub]);
  };

  const deleteSubject = (id: string) => {
    save(subjects.filter(s => s.id !== id));
  };

  const addModule = (subjectId: string, type: 'theory'|'lab', title: string) => {
    save(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const newMod: Module = { id: Math.random().toString(36).substr(2, 9), title, notesCount: 0, pdfs: [], quizMistakes: [] };
      if (type === 'theory') return { ...s, theoryModules: [...s.theoryModules, newMod] };
      return { ...s, labModules: [...s.labModules, newMod] };
    }));
  };

  const deleteModule = (subjectId: string, type: 'theory'|'lab', moduleId: string) => {
    save(subjects.map(s => {
      if (s.id !== subjectId) return s;
      if (type === 'theory') return { ...s, theoryModules: s.theoryModules.filter(m => m.id !== moduleId) };
      return { ...s, labModules: s.labModules.filter(m => m.id !== moduleId) };
    }));
  };

  const addPdfToModule = (subjectId: string, type: 'theory'|'lab', moduleId: string, pdf: PdfMeta) => {
    save(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const updateMods = (mods: Module[]) => mods.map(m => m.id === moduleId ? { ...m, pdfs: [...(m.pdfs || []), pdf] } : m);
      if (type === 'theory') return { ...s, theoryModules: updateMods(s.theoryModules) };
      return { ...s, labModules: updateMods(s.labModules) };
    }));
  };

  const removePdfFromModule = (subjectId: string, type: 'theory'|'lab', moduleId: string, pdfId: string) => {
    save(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const updateMods = (mods: Module[]) => mods.map(m => m.id === moduleId ? { ...m, pdfs: (m.pdfs || []).filter(p => p.id !== pdfId) } : m);
      if (type === 'theory') return { ...s, theoryModules: updateMods(s.theoryModules) };
      return { ...s, labModules: updateMods(s.labModules) };
    }));
  };

  const addMistakeToModule = (subjectId: string, type: 'theory'|'lab', moduleId: string, mistake: Omit<QuizMistake, 'id'|'date'>) => {
    const fullMistake: QuizMistake = { ...mistake, id: Math.random().toString(36).substring(7), date: Date.now() };
    save(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const updateMods = (mods: Module[]) => mods.map(m => m.id === moduleId ? { ...m, quizMistakes: [...(m.quizMistakes || []), fullMistake] } : m);
      if (type === 'theory') return { ...s, theoryModules: updateMods(s.theoryModules) };
      return { ...s, labModules: updateMods(s.labModules) };
    }));
  };

  const clearMistakes = (subjectId: string, type: 'theory'|'lab', moduleId: string) => {
    save(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const updateMods = (mods: Module[]) => mods.map(m => m.id === moduleId ? { ...m, quizMistakes: [] } : m);
      if (type === 'theory') return { ...s, theoryModules: updateMods(s.theoryModules) };
      return { ...s, labModules: updateMods(s.labModules) };
    }));
  };

  return (
    <DataContext.Provider value={{ 
      subjects, addSubject, deleteSubject, addModule, deleteModule,
      addPdfToModule, removePdfFromModule, addMistakeToModule, clearMistakes
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
