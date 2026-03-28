"use client";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import "@tldraw/tldraw/tldraw.css";

const Tldraw = dynamic(async () => (await import("@tldraw/tldraw")).Tldraw, {
  ssr: false,
});

export default function NotebookPage() {
  const router = useRouter();

  return (
    <div className="w-full h-screen relative bg-[#121212] flex flex-col no-scrollbar">
      <div className="absolute top-4 left-24 z-50">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
      
      <div className="w-full h-full flex-1" style={{ filter: "invert(0.9) hue-rotate(180deg)" }}>
        <Tldraw persistenceKey="study-os-rough">
        </Tldraw>
      </div>
    </div>
  );
}
