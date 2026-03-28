"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Map, Settings, Search, PenTool } from "lucide-react";
import { useState } from "react";
import { GlobalSearch } from "@/components/ai/GlobalSearch";

export function Sidebar() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const links = [
    { href: "/", label: "Subjects", icon: BookOpen },
    { href: "/knowledge-map", label: "Knowledge Map", icon: Map },
    { href: "/workspace/notebook/rough", label: "Rough Notes", icon: PenTool },
  ];

  return (
    <>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 glass-panel border-r border-t-0 border-b-0 border-l-0 rounded-none z-50">
        <div className="w-10 h-10 bg-primary-500 rounded-full mb-12 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform cursor-pointer">
          <span className="font-bold text-white text-xl">S</span>
        </div>
        
        <div className="flex flex-col gap-8 flex-1 w-full items-center">
          {links.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/");
            return (
              <Link key={link.href} href={link.href} className="group relative w-full flex justify-center">
                <div className={`p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/20 text-primary-400 shadow-[0_0_10px_rgba(129,140,248,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <link.icon className="w-6 h-6" />
                </div>
                <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-md border border-glass-border px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 text-sm font-medium">
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-6 w-full items-center">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="group relative w-full flex justify-center"
          >
            <div className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
              <Search className="w-6 h-6" />
            </div>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-md border border-glass-border px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 text-sm font-medium">
              Search Notes
            </div>
          </button>
          
          <button className="group relative w-full flex justify-center">
            <div className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
              <Settings className="w-6 h-6" />
            </div>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-md border border-glass-border px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 text-sm font-medium">
              Settings
            </div>
          </button>
        </div>
      </nav>
    </>
  );
}
