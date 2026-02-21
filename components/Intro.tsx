import React, { useEffect, useState } from 'react';
import { Bus } from 'lucide-react';

interface IntroProps {
  onFinish: () => void;
}

const Intro: React.FC<IntroProps> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit sequence after loading finishes
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete before unmounting
      setTimeout(onFinish, 800);
    }, 2800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-primary-dark/20 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container */}
        <div className="relative mb-8 animate-logo-reveal">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150 animate-pulse" />
          <img 
            src="https://i.postimg.cc/HrNWCGHr/a179cd34-794f-4108-9b99-70e752b3da3b-removebg-preview.png" 
            alt="Lagan Bus Logo" 
            className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_15px_rgba(0,102,255,0.5)]"
          />
        </div>

        {/* Text */}
        <div className="text-center opacity-0 animate-text-slide">
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight mb-2">
            LAGAN<span className="text-primary">BUS</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base uppercase tracking-[0.3em] font-medium">
            Travel Beyond Class
          </p>
        </div>
      </div>

      {/* Loading Bar with Bus */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 border-t border-slate-800">
        <div className="relative w-full h-full overflow-hidden">
             {/* Simple blue bar filler */}
             <div className="h-full bg-primary/20 w-full animate-loader"></div>
             
             {/* Driving Bus Animation */}
             <div className="absolute bottom-1.5 -left-10 animate-bus-cross z-20 text-primary">
                 <Bus size={24} fill="currentColor" className="text-primary fill-primary/30" />
                 {/* Fumes */}
                 <div className="absolute top-1/2 -left-3 w-1 h-1 bg-slate-500 rounded-full animate-fume"></div>
                 <div className="absolute top-1/2 -left-5 w-1.5 h-1.5 bg-slate-500 rounded-full animate-fume [animation-delay:0.2s]"></div>
             </div>
        </div>
      </div>
      
      {/* Preload Hero Image secretly */}
      <img 
        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80"
        className="hidden" 
        alt="preload"
      />
    </div>
  );
};

export default Intro;