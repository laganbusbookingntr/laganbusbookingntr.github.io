import React from 'react';
import { ArrowRight, Star, Phone, ChevronDown } from 'lucide-react';
import { ADMIN_WHATSAPP_NUMBER } from '../constants';

interface HeroProps {
  onBookNow: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBookNow }) => {
  const openAdminWhatsApp = () => {
    window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=Hi Lagan Bus Services, I need assistance`, '_blank');
  };

  return (
    <div className="relative min-h-[100svh] md:min-h-[110vh] flex items-center justify-center overflow-hidden pb-20">
      {/* Dynamic Background with Ken Burns Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-silver-50 dark:to-dark-bg z-10" />
        <img 
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80" 
            srcSet="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80 640w,
                    https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80 1280w,
                    https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80 1920w"
            alt="Luxury Bus" 
            className="w-full h-full object-cover animate-ken-burns scale-110 transform-gpu will-change-transform backface-hidden"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 w-full pt-16 md:pt-20">
        <div className="flex flex-col items-center text-center">
            
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 md:mb-8 opacity-0 animate-fade-in-up [animation-delay:400ms]" style={{ animationFillMode: 'forwards' }}>
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                    Trusted by 10,000+ Travelers
                </span>
            </div>

            {/* Main Heading */}
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-black text-white leading-[0.9] tracking-tight mb-6 md:mb-8 drop-shadow-2xl opacity-0 animate-fade-in-up [animation-delay:600ms]" style={{ animationFillMode: 'forwards' }}>
                Travel <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-light via-white to-primary-light bg-[length:200%_auto] animate-shimmer">
                    Beyond Class.
                </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg md:text-2xl text-slate-200 max-w-xl md:max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed opacity-0 animate-fade-in-up [animation-delay:800ms] px-4" style={{ animationFillMode: 'forwards' }}>
                Experience Sri Lanka's finest intercity coach service. 
                Seamless booking, reclining luxury, and punctuality you can trust.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto opacity-0 animate-fade-in-up [animation-delay:1000ms] px-2 sm:px-4" style={{ animationFillMode: 'forwards' }}>
                <button 
                    onClick={onBookNow}
                    className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-[0_20px_40px_-15px_rgba(0,102,255,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(0,102,255,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                    <span>Reserve Seat</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                    onClick={openAdminWhatsApp}
                    className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-3"
                >
                    <Phone className="w-5 h-5" />
                    <span>Support</span>
                </button>
            </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 text-white/50 animate-bounce hidden sm:block z-20">
        <ChevronDown size={32} />
      </div>
    </div>
  );
};

export default Hero;