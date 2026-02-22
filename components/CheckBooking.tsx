import React, { useState } from 'react';
import { Search, Download, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { BookingResponse } from '../types';
import { generateTicketPDF } from '../services/pdfGenerator';

interface CheckBookingProps {
  onCheck: (phone: string) => Promise<BookingResponse | null>;
  isLoading: boolean;
}

const CheckBooking: React.FC<CheckBookingProps> = ({ onCheck, isLoading }) => {
  const [phone, setPhone] = useState('');
  const [ticket, setTicket] = useState<BookingResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) return;
    const result = await onCheck(phone);
    setTicket(result);
  };

  // Helper: Clean Date Display (Standardize to YYYY/MM/DD)
  const formatDateDisplay = (dateStr: any) => {
    if (!dateStr) return "-";
    const s = String(dateStr);
    
    // Attempt to parse any date format (ISO, MM/DD/YYYY, etc.)
    try {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
            // Use en-CA (YYYY-MM-DD) and replace dashes with slashes for YYYY/MM/DD
            return d.toLocaleDateString('en-CA').replace(/-/g, '/');
        }
    } catch (e) { /* ignore */ }
    
    // Fallback: just replace dashes with slashes if any
    return s.replace(/-/g, '/');
  };

  return (
    <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] shadow-soft overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col">
      <div className="p-6 md:p-12 flex-grow">
        <div className="text-center mb-8 md:mb-10">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
            <Search size={28} className="md:w-8 md:h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Track Your Ticket</h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Enter your registered mobile number</p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10 md:mb-12">
          <div className="relative group">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="e.g. 0771234567"
              className="w-full pl-6 pr-28 md:pr-32 py-4 md:py-5 rounded-2xl md:rounded-full bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/50 transition-all outline-none font-medium text-base md:text-lg text-slate-900 dark:text-white"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 md:px-6 rounded-xl md:rounded-full bg-primary hover:bg-primary-dark text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base shadow-lg shadow-primary/20"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Check'}
            </button>
          </div>
        </form>

        <div className="max-w-2xl mx-auto">
          {!ticket ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
              <Search size={40} className="mb-4 opacity-20" />
              <p className="text-sm">Ticket details will appear here</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {/* Boarding Pass Design */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-black/50 overflow-hidden border border-slate-100 dark:border-slate-700 relative">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>

                {/* Header */}
                <div className="bg-primary px-6 py-5 md:px-8 md:py-6 flex justify-between items-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-primary-light text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Boarding Pass</p>
                        <h3 className="text-xl md:text-2xl font-black">{ticket.Bus || ticket.bus}</h3>
                      <div className="text-sm md:text-sm mt-1">
                        {(ticket['Bus Number'] || ticket.busNumber) && <span className="mr-3">Bus No: <strong>{ticket['Bus Number'] || ticket.busNumber}</strong></span>}
                        {(ticket.Conductor || ticket.conductor) && <span>Conductor: <strong>{ticket.Conductor || ticket.conductor}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-2xl md:text-3xl font-black">{ticket.Time || ticket.time}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <div>
                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Passenger</p>
                            <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">{ticket.Name || ticket.name}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Date</p>
                             <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{formatDateDisplay(ticket.Date || ticket.dateFormatted)}</p>
                        </div>
                    </div>

                    <div className="mb-6 md:mb-8">
                        {/* Labels Row */}
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">From</p>
                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider text-right">To</p>
                        </div>
                        
                        {/* Cities & Connector Row */}
                        <div className="flex items-center justify-between gap-2 md:gap-3">
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-base md:text-2xl font-black text-primary leading-tight break-words">{ticket.Pickup || ticket.pickup}</p>
                            </div>
                            
                            <div className="flex-shrink-0 px-1 md:px-2">
                                <div className="w-8 md:w-16 h-[2px] bg-slate-200 dark:bg-slate-700 relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                </div>
                            </div>

                            <div className="flex-1 text-right min-w-0">
                                <p className="text-base md:text-2xl font-black text-primary leading-tight break-words">{ticket.Destination || ticket.destination}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] md:text-xs text-slate-400 uppercase mb-2">Assigned Seats</p>
                        <div className="flex flex-col gap-1.5">
                            {(ticket["Male Seat"] || ticket.maleSeats) && (
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">Male</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">{ticket["Male Seat"] || ticket.maleSeats}</span>
                                </div>
                            )}
                            {(ticket["Female Seat"] || ticket.femaleSeats) && (
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded uppercase tracking-wider">Female</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">{ticket["Female Seat"] || ticket.femaleSeats}</span>
                                </div>
                            )}
                            {!(ticket["Male Seat"] || ticket.maleSeats) && !(ticket["Female Seat"] || ticket.femaleSeats) && (
                                <span className="text-sm text-slate-400 italic">No seats assigned yet</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Perforated Line */}
                <div className="relative flex items-center justify-between px-4">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-silver-100 dark:bg-dark-bg -ml-6 md:-ml-7 z-10"></div>
                    <div className="flex-1 border-b-2 border-dashed border-slate-200 dark:border-slate-700"></div>
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-silver-100 dark:bg-dark-bg -mr-6 md:-mr-7 z-10"></div>
                </div>

                {/* Footer: 3-column layout - Booking Status / Payment / Total (inline on mobile) */}
                <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between flex-wrap gap-4">
                   <div className="flex-1 text-left min-w-[90px]">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-block px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                      String(ticket.Status || ticket.status || '').toLowerCase().includes('confirmed') 
                      ? 'bg-green-100 text-green-700' 
                      : String(ticket.Status || ticket.status || '').toLowerCase().includes('cancel') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ticket.Status || ticket.status || 'Pending'}
                    </span>
                   </div>
                   <div className="flex-1 text-center min-w-[90px]">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Payment</p>
                    <span className={`inline-block px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                      String(ticket.Payment || ticket.payment).toLowerCase().includes('paid') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ticket.Payment || ticket.payment || 'Pending'}
                    </span>
                   </div>
                   <div className="flex-1 text-right min-w-[90px]">
                     <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Total</p>
                     <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                       LKR {(ticket.Total || ticket.totalAmount || ticket.estimatedTotal || 0).toLocaleString()}
                     </p>
                   </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3">
                <button 
                  onClick={() => generateTicketPDF(ticket)}
                  className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Download size={20} /> 
                  <span>Download Ticket PDF</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-500 bg-white dark:bg-slate-800/50 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                    <Clock size={14} /> Please arrive 15 minutes early
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckBooking;