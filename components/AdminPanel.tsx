import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Search, 
  LogOut, 
  RefreshCw,
  Trash2,
  Edit,
  X,
  Save,
  Archive,
  CheckCircle,
  ShieldCheck,
  KeyRound,
  MessageCircle,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  Bus,
  Filter,
  Calculator,
  ArrowRight,
  LockKeyhole,
  ChevronLeft,
  Plus
} from 'lucide-react';
import Swal from 'sweetalert2';
import { BookingResponse } from '../types';
import { GOOGLE_SCRIPT_URL, ADMIN_PASSWORD, ADMIN_SECURITY_PIN, BUS_SERVICES, CITIES } from '../constants';
import BusLoader from './BusLoader';
import { generateTicketPDF } from '../services/pdfGenerator';
import { sendBusAssignmentNotification } from '../services/notificationService';

interface AdminPanelProps {
  onExit: () => void;
}

// Extend BookingResponse locally to track origin sheet
interface AdminBooking extends BookingResponse {
  origin: 'pending' | 'active' | 'archive';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState<'password' | 'pin'>('password');
  const [password, setPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Categorized Bookings
  const [pendingBookings, setPendingBookings] = useState<AdminBooking[]>([]);
  const [activeBookings, setActiveBookings] = useState<AdminBooking[]>([]);
  const [archivedBookings, setArchivedBookings] = useState<AdminBooking[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterBus, setFilterBus] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  
  // View Mode: Pending, Active, Archive, Blocked
  const [viewMode, setViewMode] = useState<'pending' | 'active' | 'archive' | 'blocked'>('active');

  // Edit State
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Booking State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    name: '',
    phone: '',
    bus: '',
    date: '',
    time: '',
    pickup: '',
    destination: '',
    maleSeats: '',
    femaleSeats: '',
    feedback: '',
    totalAmount: '',
    busNumber: '',
    conductorNumber: ''
  });
  const [newBookingPayment, setNewBookingPayment] = useState('Paid');

  // Block Bus State
  const [showBlockBusModal, setShowBlockBusModal] = useState(false);
  const [blockBusData, setBlockBusData] = useState({
    bus: '',
    date: ''
  });

  // Helper: Format Time Strict (9:00 PM -> 09.00 PM)
  const formatTimeStrict = (timeStr: any) => {
    if (!timeStr) return "";
    let s = String(timeStr);
    
    // Check if it's already in 24h format "HH:MM" without AM/PM
    if (s.includes(':') && !s.toLowerCase().includes('m')) {
        const [h, m] = s.split(':');
        let hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        const hourStr = hour.toString().padStart(2, '0');
        return `${hourStr}.${m} ${period}`;
    }

    // Handle "9:00 PM" -> "09.00 PM"
    return s
        .replace(/:/g, '.')              // Replace colon with dot
        .replace(/\b(\d)\./, '0$1.')     // Add leading zero if single digit hour
        .replace(/([AP]M)/i, ' $1')      // Ensure space before AM/PM
        .replace(/\s+/, ' ')             // Normalize spaces
        .trim();
  };

  // Helper: Clean Date Display (Standardize to YYYY/MM/DD)
  const formatDateDisplay = (dateStr: any) => {
    if (!dateStr) return "-";
    const s = String(dateStr);
    
    // Check for weird format: MM/DDT.../YYYY (e.g. 02/21T18:30:00.000Z/2026)
    const weirdFormatMatch = s.match(/^(\d{2})\/(\d{2})T.*\/(\d{4})$/);
    if (weirdFormatMatch) {
        const [_, month, day, year] = weirdFormatMatch;
        return `${year}/${month}/${day}`;
    }

    // Attempt to parse any date format (ISO, MM/DD/YYYY, etc.)
    try {
        // Replace hyphens with slashes to force local timezone parsing for YYYY-MM-DD strings
        const localDateStr = s.includes('-') && !s.includes('T') ? s.replace(/-/g, '/') : s;
        const d = new Date(localDateStr);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}/${m}/${day}`;
        }
    } catch (e) { /* ignore */ }
    
    // Fallback: just replace dashes with slashes if any
    return s.replace(/-/g, '/');
  };

  // Removed insecure biometric auth that allowed anyone to register their device

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginStep === 'password') {
        if (password === ADMIN_PASSWORD) {
            setLoginStep('pin');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Incorrect password provided.',
                confirmButtonColor: '#0066FF',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    } else if (loginStep === 'pin') {
        if (securityPin === ADMIN_SECURITY_PIN) {
            setIsAuthenticated(true);
        } else {
             Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: 'Invalid Security PIN.',
                confirmButtonColor: '#0066FF',
                customClass: { popup: 'rounded-3xl' }
            });
            setSecurityPin('');
        }
    }
  };

  const [archiveLoaded, setArchiveLoaded] = useState(false);
  const [blockedBookings, setBlockedBookings] = useState<any[]>([]);

  const fetchBookings = async (types: ('pending' | 'active' | 'archive' | 'blocked')[] = ['pending', 'active', 'blocked']) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    
    try {
      // Trigger Auto Archive in background (don't await)
      fetch(`${GOOGLE_SCRIPT_URL}?method=autoArchive`).catch(e => console.error("Auto-archive trigger failed", e));

      const fetchWithCatch = (url: string) => fetch(url).catch(e => {
        console.warn(`Fetch failed for ${url}`, e);
        return null;
      });

      const promises = [];
      const fetchAllBookings = types.includes('pending') || types.includes('active') || types.includes('archive');
      
      if (fetchAllBookings) {
          promises.push(fetchWithCatch(`${GOOGLE_SCRIPT_URL}?method=getAll`));
      }
      if (types.includes('blocked')) {
          promises.push(fetchWithCatch(`${GOOGLE_SCRIPT_URL}?method=getBlockedBuses`));
      }

      const responses = await Promise.all(promises);
      const results: any[] = await Promise.all(responses.map(r => r ? r.json().catch(() => ({})) : {}));

      // Sort Function
      const dateSorter = (a: any, b: any) => {
          const idA = a["Booking ID"] || a["Booking Id"];
          const idB = b["Booking ID"] || b["Booking Id"];
          if (idA && idB) return idB.localeCompare(idA);
          return 0;
      };

      let resultIndex = 0;

      if (fetchAllBookings) {
          const allData = results[resultIndex++];
          const allRaw = allData.allBookings || [];
          
          if (types.includes('pending')) {
              const pendingRaw = allRaw.filter((b: any) => b.origin === 'pending');
              const pendingList = pendingRaw.map((b: any, index: number) => ({
                 ...b,
                 rowIndex: b.rowIndex || (index + 2)
              })).sort(dateSorter);
              setPendingBookings(pendingList);
          }

          if (types.includes('active')) {
              const activeRaw = allRaw.filter((b: any) => b.origin === 'active');
              const activeList = activeRaw.map((b: any, index: number) => ({
                  ...b,
                  rowIndex: b.rowIndex || (index + 2)
              })).sort(dateSorter);
              setActiveBookings(activeList);
          }

          if (types.includes('archive')) {
              const archiveRaw = allRaw.filter((b: any) => b.origin === 'archive');
              const archiveList = archiveRaw.map((b: any, index: number) => ({ 
                  ...b, 
                  rowIndex: b.rowIndex || (index + 2)
              })).sort(dateSorter);
              setArchivedBookings(archiveList);
              setArchiveLoaded(true);
          }
      }

      if (types.includes('blocked')) {
          const blockedData = results[resultIndex++];
          if (blockedData && blockedData.success && blockedData.blockedBuses) {
              setBlockedBookings(blockedData.blockedBuses);
          }
      }

    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Sync Error',
        text: 'Could not fetch booking data.',
        toast: true,
        position: 'top-end',
        timer: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchBookings(['pending', 'active', 'blocked']);
    }
  }, [isAuthenticated]);

  // Lazy load archive when tab is clicked
  useEffect(() => {
      if (viewMode === 'archive' && !archiveLoaded && isAuthenticated) {
          fetchBookings(['archive']);
      }
  }, [viewMode, isAuthenticated]);

  // Auto-archive old bookings every 5 minutes
  useEffect(() => {
      if (!isAuthenticated) return;

      const runAutoArchive = () => {
          fetch(`${GOOGLE_SCRIPT_URL}?method=autoArchive`)
              .then(res => res.json())
              .then(data => {
                  if (data.success && data.details?.totalRowsArchived > 0) {
                      console.log(`Auto-archived ${data.details.totalRowsArchived} bookings`);
                      // Only refresh if we archived something
                      if (viewMode === 'active' || viewMode === 'pending') {
                          fetchBookings(['pending', 'active']);
                      } else if (viewMode === 'archive') {
                          fetchBookings(['archive']);
                      }
                  }
              })
              .catch(e => console.error("Auto-archive interval failed", e));
      };

      // Run immediately on auth, then every 5 minutes (300,000 ms)
      runAutoArchive();
      const interval = setInterval(runAutoArchive, 300000);

      return () => clearInterval(interval);
  }, [isAuthenticated, viewMode]);

  // Compute actual lists by filtering out blocked buses
  const isBlockedBooking = (b: any) => {
    const status = String(b.Status || b.status || '').toLowerCase().trim();
    const name = String(b.Name || b.name || '').toUpperCase().trim();
    return status === 'fully booked' || name === 'SYSTEM_BLOCK';
  };
  
  const actualPending = pendingBookings.filter(b => !isBlockedBooking(b));
  const actualActive = activeBookings.filter(b => !isBlockedBooking(b));
  const actualArchive = archivedBookings.filter(b => !isBlockedBooking(b));
  
  const currentList = viewMode === 'pending' ? actualPending 
                    : viewMode === 'active' ? actualActive 
                    : viewMode === 'archive' ? actualArchive
                    : blockedBookings;

  const filteredBookings = currentList.filter(b => {
    const searchString = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      String(b.Name || b.name || b.bus || b.Bus || '').toLowerCase().includes(searchString) ||
      String(b.Phone || b.phone || '').includes(searchString) ||
      String(b["Booking ID"] || b["Booking Id"] || '').toLowerCase().includes(searchString);
    
    // Journey Date Filtering
    const journeyDateRaw = b.Date || b.date || b.dateFormatted || '';
    let matchesDate = true;
    
    if (filterDate) {
        try {
            const d = new Date(journeyDateRaw);
            if (!isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const localJourneyDate = `${y}-${m}-${day}`;
                matchesDate = localJourneyDate === filterDate;
            } else {
                matchesDate = journeyDateRaw.includes(filterDate);
            }
        } catch (e) {
            matchesDate = false;
        }
    }

    // Bus Filtering
    const matchesBus = !filterBus || 
      String(b.Bus || b.bus || '').toLowerCase().includes(filterBus.toLowerCase());
    
    // Status Filtering
    const matchesStatus = !filterStatus || 
      String(b.Status || b.status || 'Confirmed').toLowerCase() === filterStatus.toLowerCase();
    
    // Payment Filtering
    const matchesPayment = !filterPayment || 
      String(b.Payment || b.payment || '').toLowerCase().includes(filterPayment.toLowerCase());

    return matchesSearch && matchesDate && matchesBus && matchesStatus && matchesPayment;
  });

  const totalRevenue = [...activeBookings, ...archivedBookings].reduce((acc, curr) => {
    const total = curr.Total || curr.totalAmount || curr.estimatedTotal || 0;
    return acc + (typeof total === 'string' ? parseFloat(total.replace(/,/g, '')) : total);
  }, 0);

  const countSeatEntries = (val: any) => {
      if (!val) return 0;
      const s = String(val).trim();
      if (!s) return 0;
      return s.split(',').filter(item => item.trim() !== '').length;
  };

  const totalPassengers = [...activeBookings, ...archivedBookings].reduce((acc, curr) => {
    const m = countSeatEntries(curr["Male Seat"] || curr.maleSeats);
    const f = countSeatEntries(curr["Female Seat"] || curr.femaleSeats);
    return acc + m + f;
  }, 0);

  const openEditModal = (booking: AdminBooking) => {
    setEditingBooking(booking);
  };

  const closeEditModal = () => {
    setEditingBooking(null);
  };

  const handleSendSMS = (booking: AdminBooking) => {
      const phone = booking.Phone || booking.phone;
      
      // Get seat strings directly
      const maleSeats = booking["Male Seat"] || booking.maleSeats || "0";
      const femaleSeats = booking["Female Seat"] || booking.femaleSeats || "0";
      const busNumber = booking["Bus Number"] || booking.busNumber;
      const conductorNumber = booking["Conductor Number"] || booking.conductorNumber;

      if (!phone) {
          Swal.fire('Error', 'No phone number available', 'error');
          return;
      }

      const dateDisp = formatDateDisplay(booking.Date || booking.dateFormatted);

      // Shortened SMS message for faster loading
            let text = `Booking Confirmed!\n` +
                `${booking.Bus || booking.bus} | ${busNumber || '-'} | ${conductorNumber || '-'}\n` +
                `${booking.Time || booking.time} | ${dateDisp}\n` +
                `${booking.Pickup || booking.pickup} → ${booking.Destination || booking.destination} | Rs.${booking.Total || booking.totalAmount}\n` +
                `Seats: M${maleSeats} F${femaleSeats}\n` +
                `https://laganbusbooking.lk/`;

      const encodedText = encodeURIComponent(text);
      window.open(`sms:${phone}?body=${encodedText}`, '_blank');
  };

  const handleClearArchive = async () => {
      const result = await Swal.fire({
          title: 'Clear History?',
          text: "This will permanently delete ALL archived bookings from the database!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Yes, Delete All',
          customClass: { popup: 'rounded-3xl' }
      });

      if (result.isConfirmed) {
          setIsLoading(true);
          try {
              await fetch(GOOGLE_SCRIPT_URL, {
                  method: 'POST',
                  body: new URLSearchParams({ method: 'clearArchive' }),
                  mode: 'no-cors',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
              });
              setArchivedBookings([]);
              Swal.fire('Cleared!', 'Archive has been emptied.', 'success');
          } catch (e) {
              Swal.fire('Error', 'Failed to clear archive.', 'error');
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleRunAutoArchive = async () => {
      const result = await Swal.fire({
          title: 'Run Auto-Archive?',
          text: "Move all past journey bookings to archive (after 5:30 AM next day)?",
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: '#0066FF',
          confirmButtonText: 'Yes, Archive Now',
          customClass: { popup: 'rounded-3xl' }
      });

      if (result.isConfirmed) {
          setIsLoading(true);
          try {
              const response = await fetch(`${GOOGLE_SCRIPT_URL}?method=autoArchive`);
              const data = await response.json();
              
              if (data.success) {
                  Swal.fire('Success!', data.message || 'Auto-archive completed.', 'success');
                  // Reload bookings to refresh the list
                  fetchBookings(['pending', 'active', 'blocked', 'archive']);
              } else {
                  Swal.fire('Error', data.error || 'Auto-archive failed.', 'error');
              }
          } catch (e) {
              Swal.fire('Error', 'Failed to run auto-archive.', 'error');
              console.error('Auto-archive error:', e);
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleApprove = async (booking: AdminBooking) => {
      const id = booking["Booking ID"] || booking["Booking Id"];
      const row = booking.rowIndex;

      if (!id && !row) return;

      const { value: formValues } = await Swal.fire({
        title: 'Confirm Booking Details',
        html:
          '<div class="mb-4 text-left"><label class="block text-sm font-medium text-slate-700 mb-1">Bus Number</label><input id="swal-input1" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. NF-7441"></div>' +
          '<div class="mb-4 text-left"><label class="block text-sm font-medium text-slate-700 mb-1">Conductor Number</label><input id="swal-input2" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. 0771234567"></div>' +
          '<div class="mb-4 text-left"><label class="block text-sm font-medium text-slate-700 mb-1">Seat Numbers (Optional)</label><input id="swal-input3" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. A1, A2"></div>' +
          '<div class="text-left"><label class="block text-sm font-medium text-slate-700 mb-1">Payment Status</label><select id="swal-input4" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"><option value="Pending">Pending</option><option value="Paid">Paid</option></select></div>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Approve & Save',
        confirmButtonColor: '#0066FF',
        customClass: { popup: 'rounded-3xl' },
        preConfirm: () => {
          return [
            (document.getElementById('swal-input1') as HTMLInputElement).value,
            (document.getElementById('swal-input2') as HTMLInputElement).value,
            (document.getElementById('swal-input3') as HTMLInputElement).value,
            (document.getElementById('swal-input4') as HTMLSelectElement).value
          ]
        }
      });

      if (!formValues) return;

      const [busNumber, conductorNumber, seatNumbers, paymentStatus] = formValues;

      setIsLoading(true);
      try {
          const strictTime = formatTimeStrict(booking.Time || booking.time);
          let cleanDate = booking.Date || booking.dateFormatted || '';
          try {
               if (cleanDate.includes('-')) {
                   const parts = cleanDate.split('-');
                   if (parts[0].length === 4) {
                       cleanDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
                   }
               }
          } catch(e) { /* ignore */ }

          const cleanTotal = String(booking.Total || booking.totalAmount || 0).replace(/,/g, '');

          const payload: Record<string, string> = {
              'method': 'update',
              'id': id || '',
              'Booking ID': id || '',
              'type': 'pending',
              
              'name': String(booking.Name || booking.name || ''),
              'Name': String(booking.Name || booking.name || ''),
              
              'phone': String(booking.Phone || booking.phone || ''),
              'Phone': String(booking.Phone || booking.phone || ''),
              
              'bus': String(booking.Bus || booking.bus || ''),
              'Bus': String(booking.Bus || booking.bus || ''),
              
              'time': strictTime,
              'Time': strictTime,
              
              'date': cleanDate,
              'Date': cleanDate,
              
              'pickup': String(booking.Pickup || booking.pickup || ''),
              'Pickup': String(booking.Pickup || booking.pickup || ''),
              
              'destination': String(booking.Destination || booking.destination || ''),
              'Destination': String(booking.Destination || booking.destination || ''),
              
              'maleSeats': String(booking["Male Seat"] || booking.maleSeats || ''),
              'Male Seat': String(booking["Male Seat"] || booking.maleSeats || ''),
              
              'femaleSeats': String(booking["Female Seat"] || booking.femaleSeats || ''),
              'Female Seat': String(booking["Female Seat"] || booking.femaleSeats || ''),
              
              'Bus Number': busNumber || String(booking["Bus Number"] || booking.busNumber || ''),
              'Conductor Number': conductorNumber || String(booking["Conductor Number"] || booking.conductorNumber || ''),
              'Seat Numbers': seatNumbers || String(booking["Seat Numbers"] || booking.seatNumbers || ''),
              
              'feedback': String(booking.Feedback || booking.feedback || ''),
              'Feedback': String(booking.Feedback || booking.feedback || ''),
              'payment': paymentStatus || String(booking.Payment || booking.payment || 'Pending'),
              'Payment': paymentStatus || String(booking.Payment || booking.payment || 'Pending'),
              
              'total': cleanTotal,
              'Total': cleanTotal,
              
              'status': 'Confirmed',
              'Status': 'Confirmed'
          };
          
          if (row) payload['row'] = row.toString();

          const params = new URLSearchParams();
          Object.entries(payload).forEach(([key, val]) => params.append(key, val));

          await fetch(GOOGLE_SCRIPT_URL, { 
              method: 'POST',
              body: params,
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });

          const updatedBooking = {
              ...booking, 
              Status: 'Confirmed', 
              status: 'Confirmed', 
              "Bus Number": busNumber,
              busNumber: busNumber,
              "Conductor Number": conductorNumber,
              conductorNumber: conductorNumber,
              "Seat Numbers": seatNumbers,
              seatNumbers: seatNumbers,
              origin: 'active' as const
          };

          // Move locally
          setPendingBookings(prev => prev.filter(b => {
              const bId = b["Booking ID"] || b["Booking Id"];
              if (id && bId) return String(bId) !== String(id);
              return b.rowIndex !== row;
          }));
          setActiveBookings(prev => [updatedBooking, ...prev]);

          // Send automatic WhatsApp notification in background
          sendBusAssignmentNotification(updatedBooking);

          // Show notification options AFTER successful booking approval
          const notificationResult = await Swal.fire({
              title: 'Approved!',
              text: 'Booking moved to Active list. Send confirmation to passenger?',
              icon: 'success',
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: 'Send SMS',
              denyButtonText: 'Send WhatsApp',
              cancelButtonText: 'Cancel',
              confirmButtonColor: '#0066FF',
              customClass: { popup: 'rounded-3xl' }
          });

          if (notificationResult.isConfirmed) {
              handleSendSMS(updatedBooking);
          } else if (notificationResult.isDenied) {
              // Extract phone and create WhatsApp message
              const phone = updatedBooking.Phone || updatedBooking.phone;
              if (!phone) {
                  Swal.fire('Error', 'No phone number available', 'error');
              } else {
                  const smsText = `Booking Confirmed!\n${updatedBooking.Bus || updatedBooking.bus} | ${busNumber || '-'} | ${conductorNumber || '-'}\n${updatedBooking.Time || updatedBooking.time} | ${formatDateDisplay(updatedBooking.Date || updatedBooking.dateFormatted)}\n${updatedBooking.Pickup || updatedBooking.pickup} → ${updatedBooking.Destination || updatedBooking.destination} | Rs.${updatedBooking.Total || updatedBooking.totalAmount}\nSeats: M${updatedBooking["Male Seat"] || updatedBooking.maleSeats || 0} F${updatedBooking["Female Seat"] || updatedBooking.femaleSeats || 0}\nhttps://laganbusbooking.lk/`;
                  const encodedMessage = encodeURIComponent(smsText);
                  
                  // Format phone number for WhatsApp (Sri Lanka country code +94)
                  let whatsappPhone = phone.replace(/\D/g, ''); // Remove non-digits
                  if (whatsappPhone.startsWith('0')) {
                      whatsappPhone = '94' + whatsappPhone.slice(1); // Replace leading 0 with 94
                  } else if (!whatsappPhone.startsWith('94')) {
                      whatsappPhone = '94' + whatsappPhone; // Add 94 if not present
                  }
                  
                  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                      window.open(`whatsapp://send?phone=${whatsappPhone}&text=${encodedMessage}`, '_blank');
                  } else {
                      window.open(`https://web.whatsapp.com/send?phone=${whatsappPhone}&text=${encodedMessage}`, '_blank');
                  }
              }
          }

      } catch (error) {
          Swal.fire('Error', 'Failed to approve booking', 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleDelete = async (booking: AdminBooking) => {
    if (viewMode === 'blocked') {
        const result = await Swal.fire({
            title: 'Unblock Bus?',
            text: "This bus will be available for booking again.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Unblock',
            customClass: { popup: 'rounded-3xl' }
        });

        if (result.isConfirmed) {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('method', 'unblockBus');
                params.append('bus', booking.bus || booking.Bus || '');
                params.append('date', booking.date || booking.Date || '');

                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: params,
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                setBlockedBookings(prev => prev.filter(b => !(b.bus === (booking as any).bus && b.date === (booking as any).date)));
                
                Swal.fire({
                    title: 'Unblocked!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            } catch (error) {
                Swal.fire('Error', 'Failed to unblock bus', 'error');
            } finally {
                setIsLoading(false);
            }
        }
        return;
    }

    const id = booking["Booking ID"] || booking["Booking Id"];
    const row = booking.rowIndex;

    if (!id && !row) return;

    const result = await Swal.fire({
        title: 'Delete Booking?',
        text: "This cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Delete',
        customClass: { popup: 'rounded-3xl' }
    });

    if (result.isConfirmed) {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('method', 'delete');
            params.append('id', id || '');
            if (row) params.append('row', row.toString());
            params.append('type', booking.origin); 

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: params,
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (booking.origin === 'pending') setPendingBookings(prev => prev.filter(b => (b["Booking ID"] || b["Booking Id"]) !== id));
            if (booking.origin === 'active') setActiveBookings(prev => prev.filter(b => (b["Booking ID"] || b["Booking Id"]) !== id));
            if (booking.origin === 'archive') setArchivedBookings(prev => prev.filter(b => (b["Booking ID"] || b["Booking Id"]) !== id));
            
            Swal.fire({
                title: 'Deleted!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-3xl' }
            });
        } catch (error) {
            Swal.fire('Error', 'Failed to delete booking', 'error');
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handleUpdate = async (e?: React.FormEvent | React.MouseEvent, overrideStatus?: string) => {
    if (e) e.preventDefault();
    if (!editingBooking) return;

    setIsSubmitting(true);
    try {
        const id = editingBooking["Booking ID"] || editingBooking["Booking Id"];
        const row = editingBooking.rowIndex;
        const origin = editingBooking.origin;
        const targetStatus = overrideStatus || String(editingBooking.Status || editingBooking.status || 'Confirmed');

        // PREPARE PAYLOAD
        const strictTime = formatTimeStrict(editingBooking.Time || editingBooking.time);
        
        let cleanDate = editingBooking.Date || editingBooking.dateFormatted || '';
        try {
             // Ensure date is in MM/DD/YYYY format for Google Sheet
             if (cleanDate.includes('-')) {
                 const parts = cleanDate.split('-');
                 if (parts[0].length === 4) { // YYYY-MM-DD
                     cleanDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
                 }
             }
        } catch(e) { /* ignore */ }

        const cleanTotal = String(editingBooking.Total || editingBooking.totalAmount || 0).replace(/,/g, '');

        const isMovingToActive = origin === 'pending' && targetStatus === 'Confirmed';

        const payload: Record<string, string> = {
            'method': 'update',
            'id': id || '',
            'Booking ID': id || '', // Send as column header too
            'type': origin,
            
            // Send both formats to ensure script catches it
            'name': String(editingBooking.Name || editingBooking.name || ''),
            'Name': String(editingBooking.Name || editingBooking.name || ''),
            
            'phone': String(editingBooking.Phone || editingBooking.phone || ''),
            'Phone': String(editingBooking.Phone || editingBooking.phone || ''),
            
            'bus': String(editingBooking.Bus || editingBooking.bus || ''),
            'Bus': String(editingBooking.Bus || editingBooking.bus || ''),
            
            'time': strictTime,
            'Time': strictTime,
            
            'date': cleanDate,
            'Date': cleanDate,
            
            'pickup': String(editingBooking.Pickup || editingBooking.pickup || ''),
            'Pickup': String(editingBooking.Pickup || editingBooking.pickup || ''),
            
            'destination': String(editingBooking.Destination || editingBooking.destination || ''),
            'Destination': String(editingBooking.Destination || editingBooking.destination || ''),
            
            'feedback': String(editingBooking.Feedback || editingBooking.feedback || ''),
            'Feedback': String(editingBooking.Feedback || editingBooking.feedback || ''),
            'maleSeats': String(editingBooking["Male Seat"] || editingBooking.maleSeats || ''),
            'Male Seat': String(editingBooking["Male Seat"] || editingBooking.maleSeats || ''),
            
            'femaleSeats': String(editingBooking["Female Seat"] || editingBooking.femaleSeats || ''),
            'Female Seat': String(editingBooking["Female Seat"] || editingBooking.femaleSeats || ''),
            
            'Bus Number': String(editingBooking["Bus Number"] || editingBooking.busNumber || ''),
            'Conductor Number': String(editingBooking["Conductor Number"] || editingBooking.conductorNumber || ''),
            'Seat Numbers': String(editingBooking["Seat Numbers"] || editingBooking.seatNumbers || ''),
            
            'payment': String(editingBooking.Payment || editingBooking.payment || 'Pending'),
            'Payment': String(editingBooking.Payment || editingBooking.payment || 'Pending'),
            
            'total': cleanTotal,
            'Total': cleanTotal,
            
            'status': targetStatus,
            'Status': targetStatus
        };
        
        if (row) payload['row'] = row.toString();

        console.log("Updating Booking Payload:", payload);

        // STANDARD SINGLE UPDATE
        const params = new URLSearchParams();
        Object.entries(payload).forEach(([key, val]) => params.append(key, val));

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: params,
            mode: 'no-cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // UPDATE LOCAL STATE IMMEDIATELY
        const updateList = (list: AdminBooking[]) => list.map(b => {
            const bId = b["Booking ID"] || b["Booking Id"];
            if ((bId && bId === id) || (row && b.rowIndex === row)) {
                return { ...b, ...editingBooking };
            }
            return b;
        });

        if (isMovingToActive) {
             setPendingBookings(prev => prev.filter(b => {
                 const bId = b["Booking ID"] || b["Booking Id"];
                 if (id && bId) return String(bId) !== String(id);
                 return b.rowIndex !== row;
             }));
             setActiveBookings(prev => [{...editingBooking, Status: 'Confirmed', status: 'Confirmed', origin: 'active'}, ...prev]);
        } else {
             if (origin === 'pending') setPendingBookings(updateList);
             if (origin === 'active') setActiveBookings(updateList);
             if (origin === 'archive') setArchivedBookings(updateList);
        }

        Swal.fire({
            title: 'Saved!',
            text: 'Booking details updated successfully.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: 'rounded-3xl' }
        });

        closeEditModal();
        // Optional: Refresh from server to be sure
        // setTimeout(fetchBookings, 2000); 
    } catch (error) {
        console.error("Update Error:", error);
        Swal.fire('Error', 'Failed to update booking', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const busName = newBooking.bus || '';
        const service = BUS_SERVICES[busName];
        const pricePerSeat = service ? service.price : 0;
        
        // If total is not manually set, calculate it
        let totalCost = newBooking.totalAmount;
        if (!totalCost) {
             // Treat input strictly as seat numbers separated by commas
             const countSeats = (val: string) => {
                 if (!val) return 0;
                 return val.split(',').filter(item => item.trim() !== '').length;
             };

             const m = countSeats(newBooking.maleSeats);
             const f = countSeats(newBooking.femaleSeats);
             totalCost = String(pricePerSeat * (m + f));
        }

        // Format Date
        let formattedDate = newBooking.date || '';
        if (formattedDate.includes('-')) {
             const [y, m, d] = formattedDate.split('-');
             formattedDate = `${m}/${d}/${y}`;
        }

        // Format Time
        const formattedTime = formatTimeStrict(newBooking.time);

        const params = new URLSearchParams();
        params.append('method', 'add');
        params.append('type', 'active'); // Direct to Active Sheet
        params.append('name', newBooking.name || '');
        params.append('phone', newBooking.phone || '');
        params.append('bus', newBooking.bus || '');
        params.append('time', formattedTime);
        params.append('date', formattedDate);
        params.append('maleSeats', newBooking.maleSeats);
        params.append('femaleSeats', newBooking.femaleSeats);
        params.append('pickup', newBooking.pickup || '');
        params.append('destination', newBooking.destination || '');
        params.append('Feedback', (newBooking as any).feedback || '');
        params.append('feedback', (newBooking as any).feedback || '');
        params.append('Bus Number', newBooking.busNumber || '');
        params.append('Conductor Number', newBooking.conductorNumber || '');
        params.append('Seat Numbers', (newBooking as any).seatNumbers || '');
        params.append('payment', newBookingPayment);
        params.append('total', String(totalCost).replace(/,/g, ''));
        params.append('status', 'Confirmed'); // Always Confirmed for Admin Add

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: params,
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        Swal.fire({
            title: 'Added!',
            text: 'New booking has been added to Active list.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-3xl' }
        });

        setShowAddModal(false);
        setNewBooking({ name: '', phone: '', bus: '', date: '', time: '', pickup: '', destination: '', maleSeats: '', femaleSeats: '', feedback: '', totalAmount: '', busNumber: '', conductorNumber: '' });
        setTimeout(fetchBookings, 2000);

    } catch (error) {
        Swal.fire('Error', 'Failed to add booking', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleBlockBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const busName = blockBusData.bus || '';
        
        // Format Date (Send as string to prevent timezone issues in Google Sheets)
        let formattedDate = blockBusData.date || '';
        if (formattedDate) {
             formattedDate = `'${formattedDate}`; // Prepend quote to force text format in Google Sheets
        }

        const params = new URLSearchParams();
        params.append('method', 'blockBus');
        params.append('bus', busName);
        params.append('date', formattedDate);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: params,
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        Swal.fire({
            title: 'Bus Blocked!',
            text: 'The selected bus has been marked as fully booked for this date.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-3xl' }
        });

        setShowBlockBusModal(false);
        setBlockBusData({ bus: '', date: '' });
        setTimeout(() => fetchBookings(['blocked']), 2000);

    } catch (error) {
        Swal.fire('Error', 'Failed to block bus', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleNewBookingChange = (field: string, value: any) => {
      setNewBooking(prev => ({ ...prev, [field]: value }));
      
      // Auto-set time if bus changes
      if (field === 'bus' && BUS_SERVICES[value]) {
          setNewBooking(prev => ({ ...prev, [field]: value, time: BUS_SERVICES[value].time }));
      }
  };

  const calculateNewTotal = () => {
    const busName = newBooking.bus || '';
    const service = BUS_SERVICES[busName];
    
    const countSeats = (val: string) => {
        if (!val) return 0;
        return val.split(',').filter(item => item.trim() !== '').length;
    };

    const male = countSeats(newBooking.maleSeats);
    const female = countSeats(newBooking.femaleSeats);

    if (service) {
        const total = service.price * (male + female);
        handleNewBookingChange('totalAmount', total.toLocaleString());
    }
  };

  const handleEditChange = (field: string, value: any) => {
    if (!editingBooking) return;
    setEditingBooking(prev => {
        if (!prev) return null;
        const newState = { ...prev };
        (newState as any)[field] = value;
        // Map common fields to ensure state updates correctly for both formats
        if (field === 'Name' || field === 'name') { newState.Name = value; newState.name = value; }
        else if (field === 'Phone' || field === 'phone') { newState.Phone = value; newState.phone = value; }
        else if (field === 'Bus' || field === 'bus') { newState.Bus = value; newState.bus = value; }
        else if (field === 'Date' || field === 'dateFormatted') { newState.Date = value; newState.dateFormatted = value; }
        else if (field === 'Time' || field === 'time') { newState.Time = value; newState.time = value; }
        else if (field === 'Pickup' || field === 'pickup') { newState.Pickup = value; newState.pickup = value; }
        else if (field === 'Destination' || field === 'destination') { newState.Destination = value; newState.destination = value; }
        else if (field === 'Male Seat' || field === 'maleSeats') { newState["Male Seat"] = value; newState.maleSeats = value; }
        else if (field === 'Female Seat' || field === 'femaleSeats') { newState["Female Seat"] = value; newState.femaleSeats = value; }
        else if (field === 'Total' || field === 'totalAmount') { newState.Total = value; newState.totalAmount = value; }
        else if (field === 'Status' || field === 'status') { newState.Status = value; newState.status = value; }
        else if (field === 'Payment' || field === 'payment') { newState.Payment = value; newState.payment = value; }
        else if (field === 'Feedback' || field === 'feedback') { newState.Feedback = value; newState.feedback = value; }
        else if (field === 'Seat Numbers' || field === 'seatNumbers') { newState["Seat Numbers"] = value; newState.seatNumbers = value; }
        return newState;
    });
  };

  const calculateTotal = () => {
    if (!editingBooking) return;
    const busName = editingBooking.Bus || editingBooking.bus || '';
    const service = BUS_SERVICES[busName];
    
    const countSeats = (val: any) => {
        if (!val) return 0;
        const s = String(val).trim();
        if (!s) return 0;
        if (s.includes(',')) {
            return s.split(',').filter(item => item.trim() !== '').length;
        }
        return 1;
    };

    const male = countSeats(editingBooking["Male Seat"] || editingBooking.maleSeats);
    const female = countSeats(editingBooking["Female Seat"] || editingBooking.femaleSeats);

    if (service) {
        const total = service.price * (male + female);
        handleEditChange('Total', total.toLocaleString());
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Bus Service Not Found',
            text: 'Could not find pricing for this bus service.',
            toast: true,
            position: 'top-end',
            timer: 3000
        });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-50"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <BusLoader />
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 shadow-glow">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-4xl font-display font-black text-slate-900 mb-2">Admin Panel</h1>
            <p className="text-slate-500">Authorized Access Only</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl transition-all duration-300">
                <form onSubmit={handleLogin} className="space-y-6 animate-fade-in-up">
                    {loginStep === 'password' ? (
                        <div className="space-y-6">
                            <div className="relative group">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter Access Key"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-4">Enter Verification PIN</p>
                            </div>
                            <div className="relative group">
                                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={securityPin}
                                    onChange={(e) => setSecurityPin(e.target.value)}
                                    placeholder="Security PIN"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 tracking-[0.5em] font-bold text-center"
                                    autoFocus
                                    maxLength={6}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setLoginStep('password');
                                        setSecurityPin('');
                                    }}
                                    className="px-4 py-4 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    )}
                </form>
          </div>
          <button onClick={onExit} className="mt-8 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 w-full">
             <LogOut size={16} /> Exit to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isLoading && <BusLoader variant="overlay" text="Syncing Data..." />}
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-30 gap-4 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <LayoutDashboard size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none">Dashboard</h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">LAGAN BUS ADMIN</p>
            </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl md:rounded-2xl overflow-x-auto max-w-full">
             <button 
                onClick={() => setViewMode('pending')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                    viewMode === 'pending' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                <div className="relative">
                   <AlertCircle size={16} className={viewMode === 'pending' ? 'text-orange-500' : 'text-slate-400'} />
                   {actualPending.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                </div>
                Pending
             </button>
             <button 
                onClick={() => setViewMode('active')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                    viewMode === 'active' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                <Calendar size={16} className={viewMode === 'active' ? 'text-primary' : 'text-slate-400'} />
                Active
             </button>
             <button 
                onClick={() => setViewMode('archive')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                    viewMode === 'archive' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                <Archive size={16} className={viewMode === 'archive' ? 'text-blue-500' : 'text-slate-400'} />
                Archive
             </button>
             <button 
                onClick={() => setViewMode('blocked')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                    viewMode === 'blocked' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                <div className="relative">
                   <AlertCircle size={16} className={viewMode === 'blocked' ? 'text-red-500' : 'text-slate-400'} />
                   {blockedBookings.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                </div>
                Blocked
             </button>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
             <button 
                onClick={() => setShowBlockBusModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 active:scale-95"
             >
                <span className="hidden md:inline">Block Bus</span>
             </button>
             <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
             >
                <Plus size={18} /> <span className="hidden md:inline">Add Booking</span>
             </button>
             <button 
                onClick={handleRunAutoArchive}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-95"
                title="Auto-archive past bookings"
             >
                <span className="hidden md:inline">Auto-Archive</span>
             </button>
             <button 
                onClick={() => fetchBookings(['pending', 'active', 'blocked'])}
                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" 
                title="Sync & Refresh"
             >
                <RefreshCw size={20} />
             </button>
             <button onClick={onExit} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs md:text-sm font-bold transition-colors">
                <LogOut size={16} /> Exit
             </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-6 md:p-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pending Review</p>
                    <h3 className="text-5xl font-black text-slate-900 mb-2">{actualPending.length}</h3>
                    <div className="absolute right-6 top-8 text-orange-200 opacity-50">
                        <AlertCircle size={64} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Total Confirmed Pax</p>
                    <h3 className="text-5xl font-black text-slate-900 mb-2">{totalPassengers}</h3>
                    <div className="absolute right-6 top-8 text-blue-200 opacity-50">
                        <Users size={64} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Total Revenue</p>
                    <h3 className="text-5xl font-black text-slate-900 mb-2">LKR { (totalRevenue / 1000).toFixed(1) }k</h3>
                    <div className="absolute right-6 top-8 text-green-200 opacity-50">
                        <DollarSign size={64} />
                    </div>
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
            <div className="relative w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Name, Phone, or ID..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-primary/50 shadow-sm transition-all"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm hover:border-primary/50 transition-colors">
                    <Filter size={18} className="text-slate-400" />
                    <input 
                      type="date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      className="text-sm font-medium text-slate-700 focus:outline-none bg-transparent cursor-pointer w-full"
                    />
                </div>
                
                <select 
                    value={filterBus}
                    onChange={e => setFilterBus(e.target.value)}
                    className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-primary/50 shadow-sm transition-all"
                >
                    <option value="">All Buses</option>
                    {Object.keys(BUS_SERVICES).map(bus => (
                        <option key={bus} value={bus}>{bus}</option>
                    ))}
                </select>
                
                <select 
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-primary/50 shadow-sm transition-all"
                >
                    <option value="">All Status</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                </select>
                
                <select 
                    value={filterPayment}
                    onChange={e => setFilterPayment(e.target.value)}
                    className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-primary/50 shadow-sm transition-all"
                >
                    <option value="">All Payments</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                </select>
                
                {viewMode === 'archive' && (
                   <button 
                       onClick={handleClearArchive}
                       className="px-5 py-3.5 bg-red-50 text-red-600 font-bold text-sm rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm border border-red-100"
                   >
                       <Trash2 size={18} />
                   </button>
                )}
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                {viewMode === 'blocked' ? (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-left">
                                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bus Name</th>
                                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Search size={40} />
                                            </div>
                                            <p className="text-lg font-medium text-slate-400">No blocked buses found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking, idx) => {
                                    const busName = booking.Bus || booking.bus || 'Unknown Bus';
                                    const date = formatDateDisplay(booking.Date || booking.dateFormatted || booking.date);
                                    const status = booking.Status || booking.status || 'Fully Booked';
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                                                        <Bus size={20} />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{busName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                                    <Calendar size={16} className="text-slate-400" />
                                                    {date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-red-100">
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleDelete(booking)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Unblock Bus (Delete)"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full">
                    <thead>
                        <tr className="bg-white border-b border-slate-100 text-left">
                            <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passenger</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trip</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Seats</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bus Details</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                            <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <Search size={40} />
                                        </div>
                                        <p className="text-lg font-medium text-slate-400">No bookings found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking, idx) => {
                                // Extract Data
                                const id = booking["Booking ID"] || booking["Booking Id"];
                                const name = booking.Name || booking.name || 'Unknown';
                                const phone = booking.Phone || booking.phone || '';
                                const bus = booking.Bus || booking.bus;
                                const pickup = booking.Pickup || booking.pickup;
                                const destination = booking.Destination || booking.destination;
                                const date = formatDateDisplay(booking.Date || booking.dateFormatted || booking.date);
                                const time = booking.Time || booking.time;
                                const maleSeats = booking["Male Seat"] || booking.maleSeats;
                                const femaleSeats = booking["Female Seat"] || booking.femaleSeats;
                                const total = booking.Total || booking.totalAmount || 0;
                                const payment = String(booking.Payment || booking.payment || 'Pending');
                                const status = String(booking.Status || booking.status || 'Confirmed');
                                const isPaid = payment.toLowerCase().includes('paid');

                                // Short ID
                                const shortId = id?.split('-').pop() || idx + 1;

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-400">#{shortId}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{name}</span>
                                                <span className="text-xs text-slate-400 font-medium mt-0.5">{phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                                                    <Bus size={12} /> {bus}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                    <span>{pickup}</span>
                                                    <ArrowRight size={10} className="text-slate-300" />
                                                    <span>{destination}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                                   <Calendar size={12} className="text-slate-400" /> {date}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                   <Clock size={12} /> {time}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-2">
                                                {/* Male Seats */}
                                                {maleSeats && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-100">Male</span>
                                                        {viewMode === 'pending' ? (
                                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                Requesting: <strong className="text-slate-900 bg-slate-100 px-1.5 rounded">{maleSeats}</strong>
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-900">{maleSeats}</span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Female Seats */}
                                                {femaleSeats && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-pink-50 text-pink-600 text-[10px] font-bold rounded uppercase tracking-wider border border-pink-100">Fem</span>
                                                        {viewMode === 'pending' ? (
                                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                Requesting: <strong className="text-slate-900 bg-slate-100 px-1.5 rounded">{femaleSeats}</strong>
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-900">{femaleSeats}</span>
                                                        )}
                                                    </div>
                                                )}
                                                {!maleSeats && !femaleSeats && <span className="text-xs text-slate-300 italic">None</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                {booking["Bus Number"] || booking.busNumber ? (
                                                    <span className="text-xs font-bold text-slate-900">{booking["Bus Number"] || booking.busNumber}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No Bus No.</span>
                                                )}
                                                {booking["Conductor Number"] || booking.conductorNumber ? (
                                                    <span className="text-xs font-medium text-slate-500">{booking["Conductor Number"] || booking.conductorNumber}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No Contact</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs text-slate-700 font-medium block h-14 overflow-hidden text-ellipsis">
                                                {booking.Feedback || booking.feedback || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                status === 'Confirmed'
                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                : status === 'Cancelled'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-orange-50 text-orange-600 border-orange-100'
                                            }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                    isPaid 
                                                    ? 'bg-green-50 text-green-600 border-green-100' 
                                                    : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                                                }`}>
                                                    {isPaid ? 'Paid' : 'Pending'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-900">
                                                    LKR {parseFloat(String(total).replace(/,/g, '')).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {viewMode === 'pending' && (
                                                    <button 
                                                        onClick={() => handleApprove(booking)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => handleSendSMS(booking)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Send SMS"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => generateTicketPDF(booking)}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => openEditModal(booking)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleDelete(booking)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
                )}
            </div>
            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <p className="text-xs text-slate-400 font-medium">Showing {filteredBookings.length} records in {viewMode}</p>
                <p className="text-xs text-slate-400 font-medium">Sorted by Newest</p>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="sticky top-0 bg-white p-6 md:p-8 border-b border-slate-100 flex justify-between items-center z-10">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <Edit size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">
                              Edit {editingBooking.origin === 'active' ? 'Active' : editingBooking.origin === 'pending' ? 'Pending' : 'Archived'} Booking
                          </h3>
                      </div>
                      <button onClick={closeEditModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-8">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                          {/* Column 1 */}
                          <div className="space-y-8">
                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Info</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name</label>
                                          <input 
                                              type="text" 
                                              value={editingBooking.Name || editingBooking.name || ''}
                                              onChange={e => handleEditChange('Name', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                                          <input 
                                              type="text" 
                                              value={editingBooking.Phone || editingBooking.phone || ''}
                                              onChange={e => handleEditChange('Phone', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Route & Seats</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Pickup</label>
                                          <input 
                                              type="text" 
                                              value={editingBooking.Pickup || editingBooking.pickup || ''}
                                              onChange={e => handleEditChange('Pickup', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination</label>
                                          <input 
                                              type="text" 
                                              value={editingBooking.Destination || editingBooking.destination || ''}
                                              onChange={e => handleEditChange('Destination', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                          />
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                      <div>
                                          <label className="block text-sm font-medium text-blue-700 mb-1.5 flex items-center gap-2">
                                              <Users size={14} /> Assign Male Seat(s)
                                          </label>
                                          <input 
                                              type="text" 
                                              placeholder="e.g. 27, 28"
                                              value={editingBooking["Male Seat"] || editingBooking.maleSeats || ''}
                                              onChange={e => handleEditChange('Male Seat', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-blue-50 border border-blue-100 outline-none focus:border-blue-300 focus:bg-white transition-all font-bold text-blue-900 text-center"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-pink-700 mb-1.5 flex items-center gap-2">
                                              <Users size={14} /> Assign Female Seat(s)
                                          </label>
                                          <input 
                                              type="text" 
                                              placeholder="e.g. 29, 30"
                                              value={editingBooking["Female Seat"] || editingBooking.femaleSeats || ''}
                                              onChange={e => handleEditChange('Female Seat', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-pink-50 border border-pink-100 outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-pink-900 text-center"
                                          />
                                      </div>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-2">* Replace the requested seat count with specific seat numbers (separated by commas).</p>
                              </div>
                          </div>

                          {/* Column 2 */}
                          <div className="space-y-8">
                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trip Details</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bus Service</label>
                                          <select 
                                              value={editingBooking.Bus || editingBooking.bus || ''}
                                              onChange={e => handleEditChange('Bus', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                          >
                                              {Object.keys(BUS_SERVICES).map(service => (
                                                  <option key={service} value={service}>{service}</option>
                                              ))}
                                          </select>
                                          <p className="text-[10px] text-orange-500 mt-1 flex items-start gap-1">
                                              <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                              <span>If "Saved" but not updated in Sheet, check Sheet Data Validation (Dropdown) rules.</span>
                                          </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                                              <input 
                                                  type="text" 
                                                  value={formatDateDisplay(editingBooking.Date || editingBooking.dateFormatted || '')}
                                                  onChange={e => handleEditChange('Date', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
                                              <input 
                                                  type="text" 
                                                  value={editingBooking.Time || editingBooking.time || ''}
                                                  onChange={e => handleEditChange('Time', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              />
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bus Number</label>
                                              <input 
                                                  type="text" 
                                                  value={editingBooking["Bus Number"] || editingBooking.busNumber || ''}
                                                  onChange={e => handleEditChange('Bus Number', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                                  placeholder="e.g. NF-7441"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Conductor Number</label>
                                              <input 
                                                  type="text" 
                                                  value={editingBooking["Conductor Number"] || editingBooking.conductorNumber || ''}
                                                  onChange={e => handleEditChange('Conductor Number', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                                  placeholder="e.g. 0771234567"
                                              />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Seat Numbers</label>
                                          <input 
                                              type="text" 
                                              value={editingBooking["Seat Numbers"] || editingBooking.seatNumbers || ''}
                                              onChange={e => handleEditChange('Seat Numbers', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              placeholder="e.g. A1, A2"
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment & Status</h4>
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Status</label>
                                              <select 
                                                  value={editingBooking.Payment || editingBooking.payment || 'Pending'}
                                                  onChange={e => handleEditChange('Payment', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                              >
                                                  <option value="Pending">Pending</option>
                                                  <option value="Paid">Paid</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Booking Status</label>
                                              <select 
                                                  value={editingBooking.Status || editingBooking.status || 'Confirmed'}
                                                  onChange={e => handleEditChange('Status', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                              >
                                                  <option value="Confirmed">Confirmed</option>
                                                  <option value="Pending">Pending</option>
                                                  <option value="Cancelled">Cancelled</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                                              <span>Total Amount (LKR)</span>
                                              <button 
                                                type="button" 
                                                onClick={calculateTotal}
                                                className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded"
                                              >
                                                  <Calculator size={12} /> Auto-Calculate
                                              </button>
                                          </label>
                                          <input 
                                              type="text" 
                                              value={editingBooking.Total || editingBooking.totalAmount || ''}
                                              onChange={e => handleEditChange('Total', e.target.value)}
                                              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-900 outline-none focus:border-primary/50 transition-all font-mono font-bold text-xl text-white tracking-wider"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                          <button 
                              type="button" 
                              onClick={closeEditModal} 
                              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                              Cancel
                          </button>
                          {editingBooking.origin === 'pending' ? (
                              <>
                                  <button 
                                      type="button" 
                                      onClick={(e) => {
                                          handleEditChange('Status', 'Pending');
                                          handleUpdate(e, 'Pending');
                                      }}
                                      disabled={isSubmitting}
                                      className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-70"
                                  >
                                      Save Details
                                  </button>
                                  <button 
                                      type="button" 
                                      onClick={(e) => {
                                          handleEditChange('Status', 'Confirmed');
                                          handleUpdate(e, 'Confirmed');
                                      }}
                                      disabled={isSubmitting}
                                      className="px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
                                  >
                                      {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                      Approve & Move to Active
                                  </button>
                              </>
                          ) : (
                              <button 
                                  type="submit" 
                                  disabled={isSubmitting}
                                  className="px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                  {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                  Save Changes
                              </button>
                          )}
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Block Bus Modal */}
      {showBlockBusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up">
                  <div className="bg-white p-6 md:p-8 border-b border-slate-100 flex justify-between items-center rounded-t-3xl">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                              <X size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">Block Bus</h3>
                      </div>
                      <button onClick={() => setShowBlockBusModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleBlockBus} className="p-6 md:p-8 space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Date</label>
                          <input 
                              type="date" 
                              required
                              value={blockBusData.date}
                              onChange={e => setBlockBusData(prev => ({...prev, date: e.target.value}))}
                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500/50 focus:bg-white transition-all font-medium text-slate-900"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Bus</label>
                          <select 
                              required
                              value={blockBusData.bus}
                              onChange={e => setBlockBusData(prev => ({...prev, bus: e.target.value}))}
                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-red-500/50 focus:bg-white transition-all font-medium text-slate-900"
                          >
                              <option value="" disabled>Select Bus Service</option>
                              {Object.keys(BUS_SERVICES).map(bus => (
                                  <option key={bus} value={bus}>{bus}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div className="pt-4 flex justify-end gap-3">
                          <button 
                              type="button" 
                              onClick={() => setShowBlockBusModal(false)}
                              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : null}
                              Block Bus
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Add Booking Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="sticky top-0 bg-white p-6 md:p-8 border-b border-slate-100 flex justify-between items-center z-10">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <Plus size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">Add New Booking</h3>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddBooking} className="p-6 md:p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                          {/* Column 1 */}
                          <div className="space-y-8">
                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Info</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name</label>
                                          <input 
                                              type="text" 
                                              required
                                              value={newBooking.name}
                                              onChange={e => handleNewBookingChange('name', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              placeholder="Enter name"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                                          <input 
                                              type="text" 
                                              required
                                              value={newBooking.phone}
                                              onChange={e => handleNewBookingChange('phone', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              placeholder="e.g. 0771234567"
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Route & Seats</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Pickup</label>
                                          <select 
                                              value={newBooking.pickup}
                                              onChange={e => handleNewBookingChange('pickup', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                          >
                                              <option value="">Select City</option>
                                              {CITIES.map(city => (
                                                  <option key={city} value={city}>{city}</option>
                                              ))}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination</label>
                                          <select 
                                              value={newBooking.destination}
                                              onChange={e => handleNewBookingChange('destination', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                          >
                                              <option value="">Select City</option>
                                              {CITIES.map(city => (
                                                  <option key={city} value={city}>{city}</option>
                                              ))}
                                          </select>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                      <div>
                                          <label className="block text-sm font-medium text-blue-700 mb-1.5 flex items-center gap-2">
                                              <Users size={14} /> Male Seat Numbers
                                          </label>
                                          <input 
                                              type="text" 
                                              placeholder="e.g. 1, 2, 3"
                                              value={newBooking.maleSeats}
                                              onChange={e => handleNewBookingChange('maleSeats', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-blue-50 border border-blue-100 outline-none focus:border-blue-300 focus:bg-white transition-all font-bold text-blue-900 text-center"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-pink-700 mb-1.5 flex items-center gap-2">
                                              <Users size={14} /> Female Seat Numbers
                                          </label>
                                          <input 
                                              type="text" 
                                              placeholder="e.g. 4, 5, 6"
                                              value={newBooking.femaleSeats}
                                              onChange={e => handleNewBookingChange('femaleSeats', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-pink-50 border border-pink-100 outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-pink-900 text-center"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Column 2 */}
                          <div className="space-y-8">
                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trip Details</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bus Service</label>
                                          <select 
                                              required
                                              value={newBooking.bus}
                                              onChange={e => handleNewBookingChange('bus', e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                          >
                                              <option value="">Select Bus</option>
                                              {Object.keys(BUS_SERVICES).map(service => (
                                                  <option key={service} value={service}>{service}</option>
                                              ))}
                                          </select>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                                              <input 
                                                  type="date" 
                                                  required
                                                  value={newBooking.date}
                                                  onChange={e => handleNewBookingChange('date', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
                                              <input 
                                                  type="text" 
                                                  value={newBooking.time}
                                                  onChange={e => handleNewBookingChange('time', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                                  placeholder="e.g. 9:00 PM"
                                              />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedback / Review</label>
                                          <textarea
                                              value={(newBooking as any).feedback || ''}
                                              onChange={e => handleNewBookingChange('feedback', e.target.value)}
                                              className="w-full p-3.5 rounded-xl h-24 resize-none bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                              placeholder="Optional customer review or notes"
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment & Status</h4>
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bus Number</label>
                                              <input 
                                                  type="text" 
                                                  value={newBooking.busNumber}
                                                  onChange={e => handleNewBookingChange('busNumber', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                                  placeholder="e.g. NF-7441"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Conductor Number</label>
                                              <input 
                                                  type="text" 
                                                  value={newBooking.conductorNumber}
                                                  onChange={e => handleNewBookingChange('conductorNumber', e.target.value)}
                                                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900"
                                                  placeholder="e.g. 0771234567"
                                              />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Status</label>
                                          <select 
                                              value={newBookingPayment}
                                              onChange={e => setNewBookingPayment(e.target.value)}
                                              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-slate-900 appearance-none"
                                          >
                                              <option value="Pending">Pending</option>
                                              <option value="Paid">Paid</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                                              <span>Total Amount (LKR)</span>
                                              <button 
                                                type="button" 
                                                onClick={calculateNewTotal}
                                                className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded"
                                              >
                                                  <Calculator size={12} /> Auto-Calculate
                                              </button>
                                          </label>
                                          <input 
                                              type="text" 
                                              value={newBooking.totalAmount}
                                              onChange={e => handleNewBookingChange('totalAmount', e.target.value)}
                                              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-900 outline-none focus:border-primary/50 transition-all font-mono font-bold text-xl text-white tracking-wider"
                                              placeholder="0.00"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                          <button 
                              type="button" 
                              onClick={() => setShowAddModal(false)} 
                              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                              Add Booking
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;