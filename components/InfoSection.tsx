import React from 'react';
import { MapPin, Bus, Shield, Wifi, Coffee, Zap, ArrowRight, Clock } from 'lucide-react';

interface InfoSectionProps {
  id: string;
}

const InfoSection: React.FC<InfoSectionProps> = ({ id }) => {
  if (id === 'routes') {
    return (
      <div className="py-20 md:py-32 bg-transparent relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div>
                <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-4">Popular Routes</h2>
                <p className="text-slate-500 max-w-xl text-base md:text-lg">Connecting major cities across Sri Lanka with comfort and reliability. Daily night services available.</p>
            </div>
            <button className="group flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors text-sm md:text-base">
                View All Routes <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { from: 'Colombo', to: 'Batticaloa', price: '1,600', time: '8h 30m' },
              { from: 'Colombo', to: 'Kalmunai', price: '2,500', time: '7h 45m' },
              { from: 'Colombo', to: 'Nintavur', price: '2,400', time: '7h 30m' }
            ].map((route, i) => (
              <div key={i} className="group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl md:rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="flex justify-between items-start mb-6 md:mb-8 relative">
                  <div className="p-3 md:p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className="bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    LKR {route.price}
                  </span>
                </div>
                
                <div className="space-y-4 mb-6 md:mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{route.from}</h3>
                    </div>
                    <div className="ml-1 md:ml-1.5 pl-4 border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-6"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{route.to}</h3>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{route.time}</span>
                    </div>
                    <span className="text-primary font-bold group-hover:translate-x-1 transition-transform cursor-pointer">Book Seat &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (id === 'fleet') {
     return (
      <div className="py-20 md:py-32 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-4 md:mb-6">Premium Fleet</h2>
            <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">Travel in buses equipped with modern amenities designed for long-distance comfort.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {['Sakeer Express', 'RS Express', 'Myown Express', 'Al Ahla', 'Al Rashith', 'Super Line'].map((bus, i) => (
               <div key={i} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 p-6 md:p-8 border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:to-primary/5 transition-all duration-500"></div>
                  
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                     <div className="p-3 md:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 group-hover:bg-primary/10 transition-colors">
                        <Bus className="w-6 h-6 md:w-8 md:h-8 text-slate-400 group-hover:text-primary transition-colors duration-300" />
                     </div>
                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <span className="text-primary font-bold text-sm md:text-base">4.8</span>
                     </div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{bus}</h3>
                  <p className="text-slate-500 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">Luxury semi-sleeper 2+2 layout with adjustable headrests and leg support.</p>
                  
                  <div className="flex gap-3">
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:border-primary/20 transition-colors">
                        <Wifi size={14} /> WiFi
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:border-primary/20 transition-colors">
                        <Zap size={14} /> USB
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:border-primary/20 transition-colors">
                        <Coffee size={14} /> Snacks
                     </div>
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>
     )
  }

  return (
    <div className="py-20 md:py-32 bg-slate-900 dark:bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 md:mb-10 rotate-3 hover:rotate-12 transition-transform duration-500 hover:bg-primary hover:text-white text-primary">
                <Shield className="w-8 h-8 md:w-10 md:h-10 transition-colors" />
            </div>
            <h2 className="text-3xl md:text-6xl font-display font-black mb-6 md:mb-8">Uncompromised Safety</h2>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 md:mb-12 max-w-2xl mx-auto">
                Every journey is monitored 24/7 via GPS. Our drivers are seasoned professionals with rigorous training.
                Your safety is not just a policy, it's our promise.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center border-t border-white/10 pt-10 md:pt-12">
                {[
                    { label: 'GPS Tracking', val: '24/7' },
                    { label: 'CCTV Monitored', val: '100%' },
                    { label: 'Emergency Support', val: 'Instant' },
                    { label: 'Insurance Cover', val: 'Full' }
                ].map((stat, i) => (
                    <div key={i} className="hover:transform hover:scale-105 transition-transform duration-300">
                        <div className="text-2xl md:text-3xl font-black text-white mb-1">{stat.val}</div>
                        <div className="text-xs md:text-sm text-primary font-bold uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default InfoSection;