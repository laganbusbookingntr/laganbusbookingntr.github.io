import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Calendar, MapPin, User, Phone, Bus, CreditCard, ChevronDown, Plus, Minus, MessageCircle } from 'lucide-react';
import { BUS_SERVICES, CITIES, BANK_DETAILS } from '../constants';
import { BookingFormData } from '../types';

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phone: '',
    from: '',
    to: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '',
    bus: '',
    maleSeats: 0,
    femaleSeats: 0
  });

  const handleBusChange = (busName: string) => {
    const service = BUS_SERVICES[busName];
    setFormData(prev => ({
      ...prev,
      bus: busName,
      time: service ? service.time : ''
    }));
  };

  const calculateTotal = () => {
    const service = BUS_SERVICES[formData.bus];
    if (!service) return 0;
    return service.price * (formData.maleSeats + formData.femaleSeats);
  };

  const updateSeats = (type: 'male' | 'female', delta: number) => {
    setFormData(prev => {
      const current = type === 'male' ? prev.maleSeats : prev.femaleSeats;
      const newVal = Math.max(0, Math.min(10, current + delta)); // Limit 0-10
      return {
        ...prev,
        [type === 'male' ? 'maleSeats' : 'femaleSeats']: newVal
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (formData.maleSeats === 0 && formData.femaleSeats === 0) {
      Swal.fire({ 
          title: 'Seat Selection Required', 
          text: 'Please select at least one male or female seat.', 
          icon: 'warning', 
          confirmButtonColor: '#0066FF',
          customClass: { popup: 'rounded-3xl' }
      });
      return;
    }

    if (formData.phone.length < 9) {
      Swal.fire({ 
          title: 'Invalid Phone Number', 
          text: 'Please enter a valid phone number (e.g., 0771234567).', 
          icon: 'warning', 
          confirmButtonColor: '#0066FF',
          customClass: { popup: 'rounded-3xl' }
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] shadow-glass overflow-hidden animate-fade-in-up relative z-10">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50"></div>
      
      <div className="p-5 md:p-12">
        <div className="flex items-center justify-between mb-6 md:mb-12">
          <div className="flex items-center gap-4 md:gap-5">
             <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/25 transform -rotate-3">
                <Calendar className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2} />
             </div>
             <div>
                <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">New Booking</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base">Secure your seat in seconds</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          
          {/* Section 1: Journey */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Journey Details</h3>
             <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <MapPin size={20} />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                  <select
                    value={formData.from}
                    onChange={e => setFormData({...formData, from: e.target.value})}
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all appearance-none font-medium text-base text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="" disabled>Pickup Location</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <MapPin size={20} />
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                  <select
                    value={formData.to}
                    onChange={e => setFormData({...formData, to: e.target.value})}
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all appearance-none font-medium text-base text-slate-700 dark:text-slate-200"
                    required
                  >
                    <option value="" disabled>Destination</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                 <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Calendar size={20} />
                     </div>
                     <input
                        type="date"
                        value={formData.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-base text-slate-700 dark:text-slate-200"
                        required
                      />
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Bus size={20} />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={16} />
                    </div>
                    <select
                        value={formData.bus}
                        onChange={e => handleBusChange(e.target.value)}
                        className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all appearance-none font-medium text-base text-slate-700 dark:text-slate-200"
                        required
                    >
                        <option value="" disabled>Select Bus Service</option>
                        {Object.keys(BUS_SERVICES).map(bus => (
                        <option key={bus} value={bus}>
                            {bus} ({BUS_SERVICES[bus].time}) - LKR {BUS_SERVICES[bus].price}
                        </option>
                        ))}
                    </select>
                 </div>
             </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

          {/* Section 2: Passengers & Contact */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Personal Info</h3>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <User size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-base text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        required
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Phone size={20} />
                    </div>
                    <input
                        type="tel"
                        placeholder="Mobile Number (07...)"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-base text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        required
                    />
                  </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Seat Selection</h3>
                 
                 {/* Male Seats Stepper */}
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                     <span className="text-sm font-bold text-blue-900 dark:text-blue-200">Male Seats</span>
                     <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm">
                         <button 
                           type="button" 
                           onClick={() => updateSeats('male', -1)}
                           className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                         >
                            <Minus size={16} />
                         </button>
                         <span className="w-4 text-center font-bold text-lg text-slate-900 dark:text-white">{formData.maleSeats}</span>
                         <button 
                           type="button" 
                           onClick={() => updateSeats('male', 1)}
                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white hover:bg-blue-200 dark:hover:bg-blue-500 transition-colors"
                         >
                            <Plus size={16} />
                         </button>
                     </div>
                 </div>

                 {/* Female Seats Stepper */}
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30">
                     <span className="text-sm font-bold text-pink-900 dark:text-pink-200">Female Seats</span>
                     <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm">
                         <button 
                           type="button" 
                           onClick={() => updateSeats('female', -1)}
                           className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                         >
                            <Minus size={16} />
                         </button>
                         <span className="w-4 text-center font-bold text-lg text-slate-900 dark:text-white">{formData.femaleSeats}</span>
                         <button 
                           type="button" 
                           onClick={() => updateSeats('female', 1)}
                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-600 text-pink-700 dark:text-white hover:bg-pink-200 dark:hover:bg-pink-500 transition-colors"
                         >
                            <Plus size={16} />
                         </button>
                     </div>
                 </div>
              </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

          {/* Section 3: Payment & Instructions */}
          <div className="space-y-6">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">How to Book</h3>
             
             <div className="grid md:grid-cols-3 gap-4">
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                     <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">1</div>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Fill Details</p>
                     <p className="text-xs text-slate-500 mt-1">Enter your journey and contact information above.</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                     <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mb-3">2</div>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Book via WhatsApp</p>
                     <p className="text-xs text-slate-500 mt-1">Click the button below to send your booking request.</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">3</div>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Make Payment</p>
                     <p className="text-xs text-slate-500 mt-1">Transfer to the account below and send slip on WhatsApp.</p>
                 </div>
             </div>

             {/* Bank Details Card */}
             <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-slate-700 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 text-primary font-bold mb-4">
                        <CreditCard size={18} />
                        <span>Bank Transfer Details</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                         <div className="space-y-2">
                             <p className="flex justify-between md:justify-start gap-4"><span className="text-slate-400 w-20">Bank:</span> <span className="font-bold">{BANK_DETAILS.bankName}</span></p>
                             <p className="flex justify-between md:justify-start gap-4"><span className="text-slate-400 w-20">Account:</span> <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 select-all font-bold">{BANK_DETAILS.accountNumber}</span></p>
                         </div>
                         <div className="space-y-2">
                             <p className="flex justify-between md:justify-start gap-4"><span className="text-slate-400 w-20">Name:</span> <span>{BANK_DETAILS.accountName}</span></p>
                             <p className="flex justify-between md:justify-start gap-4"><span className="text-slate-400 w-20">Branch:</span> <span>{BANK_DETAILS.branch}</span></p>
                         </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic text-center md:text-left">
                        * Please attach your payment slip when sending details on WhatsApp.
                    </div>
                 </div>
             </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

          {/* Section 4: Summary & Submit */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Estimated Cost</p>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      LKR {calculateTotal().toLocaleString()}
                  </p>
              </div>
              <div className="w-full md:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-10 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 transition-all active:scale-[0.98] w-full md:w-auto flex items-center justify-center gap-2"
                  >
                     <MessageCircle size={20} />
                     <span>Book via WhatsApp</span>
                  </button>
                  <p className="text-xs text-center text-slate-400 mt-2">
                     Redirects to WhatsApp to finalize
                  </p>
              </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BookingForm;