"use client";
import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = mouseX;
    let targetY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;
    const render = () => {
      time += 0.005;
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep space look
      ctx.fillStyle = "#030308";
      ctx.fillRect(0, 0, width, height);

      // Interactive cursor glow
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, Math.max(width, height) * 0.4);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.12)"); // primary-500
      gradient.addColorStop(1, "rgba(3, 3, 8, 0)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Slow moving ambient orb
      const orbX = width/2 + Math.cos(time) * width/3;
      const orbY = height/2 + Math.sin(time) * height/4;
      const gradient2 = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, Math.max(width, height) * 0.5);
      gradient2.addColorStop(0, "rgba(168, 85, 247, 0.08)"); // secondary-500
      gradient2.addColorStop(1, "rgba(3, 3, 8, 0)");

      ctx.fillStyle = gradient2;
      ctx.globalCompositeOperation = "screen";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      requestAnimationFrame(render);
    };
    
    const token = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(token);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -10 }}
    />
  );
}
