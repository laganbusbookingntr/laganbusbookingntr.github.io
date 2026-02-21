import React from 'react';
import { Bus } from 'lucide-react';

interface BusLoaderProps {
  className?: string;
  text?: string;
  variant?: 'default' | 'overlay';
}

const BusLoader: React.FC<BusLoaderProps> = ({ className = '', text, variant = 'default' }) => {
  const content = (
    <div className={`flex flex-col items-center ${className}`}>
        <div className="relative p-4">
            {/* Fumes */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-2">
                <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full absolute animate-fume"></div>
                <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full absolute animate-fume [animation-delay:0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full absolute animate-fume [animation-delay:0.6s]"></div>
            </div>
            
            {/* Bus */}
            <div className="relative z-10 text-primary animate-drive">
                <Bus size={48} fill="currentColor" className="text-primary dark:text-primary-light fill-primary/20 dark:fill-primary/20" strokeWidth={1.5} />
            </div>

            {/* Moving Road Effect */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                 <div 
                   className="w-full h-full bg-[linear-gradient(90deg,transparent_50%,#cbd5e1_50%)] dark:bg-[linear-gradient(90deg,transparent_50%,#475569_50%)] bg-[length:20px_100%] animate-road-move"
                 ></div>
            </div>
        </div>
        {text && <p className="mt-2 font-bold text-slate-500 dark:text-slate-400 text-sm animate-pulse tracking-wide">{text}</p>}
    </div>
  );

  if (variant === 'overlay') {
      return (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm transition-all duration-300">
              {content}
          </div>
      );
  }

  return content;
};

export default BusLoader;