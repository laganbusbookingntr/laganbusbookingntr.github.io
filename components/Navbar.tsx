import React, { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun, ChevronRight } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
        rafId = null;
      });
    };
    
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // If in Admin mode, standard navbar logic might vary, 
  // but since AdminPanel is a full page replacement in App.tsx, 
  // this Navbar is mainly for the consumer side.
  if (currentPage === 'admin') return null;

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Routes', id: 'routes' },
    { name: 'Fleet', id: 'fleet' },
    { name: 'Safety', id: 'safety' },
  ];

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-in-out border-b ${
        isScrolled || isMobileMenuOpen
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-white/10 dark:border-white/5 py-3 shadow-sm' 
          : 'bg-transparent border-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group relative z-50"
              onClick={() => {
                onNavigate('home');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <img 
                      src="https://i.postimg.cc/HrNWCGHr/a179cd34-794f-4108-9b99-70e752b3da3b-removebg-preview.png" 
                      alt="Logo" 
                      className="relative w-10 h-10 md:w-12 md:h-12 object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                  />
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-black tracking-tighter">
                  <span className={isScrolled || isMobileMenuOpen ? 'text-slate-900 dark:text-white' : 'text-white'}>LAGAN</span>
                  <span className="text-primary">BUS</span>
                </h1>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-sm p-1 rounded-full border border-white/10">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    currentPage === link.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : isScrolled 
                        ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 relative z-50">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2.5 rounded-full transition-all duration-300 ${
                    isScrolled || isMobileMenuOpen
                    ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button 
                onClick={() => onNavigate('booking')}
                className="hidden md:flex px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm tracking-wide rounded-full shadow-[0_4px_14px_0_rgba(0,102,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,102,255,0.23)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Book Seat
              </button>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg transition-transform duration-300 ${
                  isScrolled || isMobileMenuOpen ? 'text-slate-900 dark:text-white' : 'text-white'
                } ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-2xl transition-all duration-500 md:hidden flex flex-col justify-center px-6 ${
        isMobileMenuOpen 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
        <div className="absolute top-0 right-0 p-40 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col space-y-4 max-w-sm mx-auto w-full relative z-10">
          {navLinks.map((link, idx) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setIsMobileMenuOpen(false);
              }}
              className={`group flex items-center justify-between p-4 rounded-2xl text-xl font-bold transition-all duration-500 border border-transparent ${
                isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
              } ${
                currentPage === link.id
                ? 'bg-white dark:bg-white/10 shadow-lg text-primary'
                : 'hover:bg-white/50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <span>{link.name}</span>
              <ChevronRight size={20} className={`transform transition-transform duration-300 ${currentPage === link.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
            </button>
          ))}

          <div 
            className={`pt-6 transition-all duration-700 ${
              isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} 
            style={{ transitionDelay: '400ms' }}
          >
            <button
              onClick={() => {
                  onNavigate('booking');
                  setIsMobileMenuOpen(false);
              }} 
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Book Seat Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;