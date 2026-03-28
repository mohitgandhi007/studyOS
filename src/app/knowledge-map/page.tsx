"use client";
import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, BrainCircuit, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from '@/store/DataContext';

export default function KnowledgeMap() {
  const router = useRouter();
  const { subjects } = useData();

  const edgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.4)' },
  }), []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Root Node
    nodes.push({ 
      id: 'root', 
      data: { label: <div className="flex flex-col items-center gap-2"><BrainCircuit className="w-8 h-8 text-primary-400" /><span>Universe</span></div> }, 
      position: { x: 500, y: 50 }, 
      className: 'glass-node-root' 
    });

    const subjectSpacing = 350;
    const startX = 500 - ((subjects.length - 1) * subjectSpacing) / 2;

    subjects.forEach((subject, sIdx) => {
      const subX = startX + sIdx * subjectSpacing;
      const subY = 250;
      
      // Subject Node
      const subNodeId = `sub-${subject.id}`;
      nodes.push({
        id: subNodeId,
        data: { label: subject.code },
        position: { x: subX, y: subY },
        className: 'glass-node',
        style: { borderBottomColor: subject.color.includes('blue') ? '#3b82f6' : '#a855f7' }
      });
      edges.push({
        id: `e-root-${subNodeId}`, source: 'root', target: subNodeId, ...edgeOptions,
        style: { stroke: '#6366f1', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
      });

      // Sections (Theory / Lab)
      const sections = [];
      if (subject.theoryModules.length > 0 || !subject.hasLab) sections.push({ id: 'theory', title: 'Theory', modules: subject.theoryModules });
      if (subject.hasLab) sections.push({ id: 'lab', title: 'Lab', modules: subject.labModules });

      const sectionSpacing = 160;
      const secStartX = subX - ((sections.length - 1) * sectionSpacing) / 2;

      sections.forEach((section, secIdx) => {
        const secX = secStartX + secIdx * sectionSpacing;
        const secY = 450;
        const secNodeId = `sec-${subject.id}-${section.id}`;

        nodes.push({
          id: secNodeId,
          data: { label: section.title },
          position: { x: secX, y: secY },
          className: 'glass-node-sub'
        });
        edges.push({
          id: `e-${subNodeId}-${secNodeId}`, source: subNodeId, target: secNodeId, ...edgeOptions
        });

        // Modules under section
        const modSpacing = 120;
        const modStartX = secX - ((section.modules.length - 1) * modSpacing) / 2;

        section.modules.forEach((mod, mIdx) => {
          const modX = modStartX + mIdx * modSpacing;
          const modY = 600 + (mIdx % 2 === 0 ? 0 : 40); // Stagger vertically to prevent overlap
          const modNodeId = `mod-${mod.id}`;

          nodes.push({
            id: modNodeId,
            data: { label: mod.title, moduleId: mod.id },
            position: { x: modX, y: modY },
            className: 'glass-node-small'
          });
          edges.push({
            id: `e-${secNodeId}-${modNodeId}`, source: secNodeId, target: modNodeId, ...edgeOptions
          });

          // PDF Nodes under module
          const pdfSpacing = 120;
          const pdfStartX = modX - (((mod.pdfs?.length || 0) - 1) * pdfSpacing) / 2;

          (mod.pdfs || []).forEach((pdf: any, pIdx: number) => {
            const pdfX = pdfStartX + pIdx * pdfSpacing;
            const pdfY = modY + 120 + (pIdx % 2 === 0 ? 0 : 30);
            const pdfNodeId = `pdf-${pdf.id}`;

            nodes.push({
              id: pdfNodeId,
              data: { 
                label: (
                  <div className="flex items-center gap-1.5 justify-center max-w-[120px]">
                    <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{pdf.name}</span>
                  </div>
                ),
                moduleId: mod.id,
                pdfId: pdf.id 
              },
              position: { x: pdfX, y: pdfY },
              className: 'glass-node-pdf'
            });

            edges.push({
              id: `e-${modNodeId}-${pdfNodeId}`, source: modNodeId, target: pdfNodeId, ...edgeOptions,
              style: { stroke: '#fb7185', strokeWidth: 1.5, strokeDasharray: '4,4' }, 
              markerEnd: { type: MarkerType.ArrowClosed, color: '#fb7185' }
            });
          });
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [subjects, edgeOptions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when data changes (handled mostly by component remount/useMemo, but good practice)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-screen bg-transparent text-white relative pl-20 overflow-hidden">
      <div className="absolute top-6 left-28 z-50 pointer-events-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl text-white rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Universe</span>
        </button>
      </div>
      
      <div className="absolute top-6 right-8 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 p-5 z-50 max-w-sm pointer-events-none">
        <h3 className="font-bold text-xl mb-2 text-primary-400 tracking-tight">Dynamic Knowledge Map</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Mapped directly from your active Subjects configured on the Home page.
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(e, node) => {
          if (node.id.startsWith('pdf-')) {
            router.push(`/workspace/pdf/${node.data.moduleId}?pdfId=${node.data.pdfId}`);
          } else if (node.id.startsWith('mod-')) {
            router.push(`/workspace/pdf/${node.data.moduleId}`);
          }
        }}
        fitView
        className="dark-theme-flow"
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={true}
      >
        <Background color="#ffffff" gap={24} size={2} style={{ opacity: 0.03 }} />
        <Controls className="!bg-black/50 !border-white/10 !fill-white absolute bottom-8 left-8" />
        <MiniMap 
          nodeColor={(n: any) => {
            if (n.id === 'root') return '#6366f1';
            if (n.id.startsWith('sub')) return '#a855f7';
            if (n.id.startsWith('sec')) return '#38bdf8';
            return '#ffffff40';
          }}
          maskColor="rgba(0,0,0,0.8)"
          className="!bg-[#0a0a14]/80 !backdrop-blur-xl !border-white/10 absolute bottom-8 right-8 rounded-xl overflow-hidden"
        />
      </ReactFlow>
      
      <style>{`
        .glass-node-root {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 2px solid rgba(99, 102, 241, 0.8) !important;
          backdrop-filter: blur(12px);
          color: white !important;
          border-radius: 50% !important;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
          box-shadow: 0 0 40px rgba(99, 102, 241, 0.4);
        }
        .glass-node {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(10px);
          color: white !important;
          border-radius: 16px !important;
          padding: 20px 30px !important;
          font-weight: 800;
          font-size: 22px;
          min-width: 180px;
          text-align: center;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          border-bottom: 4px solid #a855f7 !important;
        }
        .glass-node-sub {
          background: rgba(0, 0, 0, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(10px);
          color: #f1f5f9 !important;
          border-radius: 12px !important;
          padding: 15px 20px !important;
          font-size: 16px;
          font-weight: 600;
          min-width: 140px;
          text-align: center;
        }
        .glass-node-small {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px dashed rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(5px);
          color: #94a3b8 !important;
          border-radius: 8px !important;
          padding: 10px 15px !important;
          font-size: 14px;
          min-width: 100px;
          max-width: 140px;
          text-align: center;
          word-wrap: break-word;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .glass-node-small:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5) !important;
        }
        .glass-node-pdf {
          background: rgba(225, 29, 72, 0.05) !important;
          border: 1px solid rgba(225, 29, 72, 0.3) !important;
          backdrop-filter: blur(8px);
          color: #fca5a5 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-size: 11px;
          min-width: 90px;
          max-width: 130px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .glass-node-pdf:hover {
          background: rgba(225, 29, 72, 0.15) !important;
          border-color: rgba(225, 29, 72, 0.6) !important;
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 5px 20px rgba(225, 29, 72, 0.2);
        }
        .react-flow__edge-path {
          stroke-linecap: round;
        }
      `}</style>
    </div>
  );
}
