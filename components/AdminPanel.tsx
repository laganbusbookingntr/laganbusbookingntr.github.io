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
  Fingerprint,
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
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  
  // Categorized Bookings
  const [pendingBookings, setPendingBookings] = useState<AdminBooking[]>([]);
  const [activeBookings, setActiveBookings] = useState<AdminBooking[]>([]);
  const [archivedBookings, setArchivedBookings] = useState<AdminBooking[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // View Mode: Pending, Active, Archive
  const [viewMode, setViewMode] = useState<'pending' | 'active' | 'archive'>('active');

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
    totalAmount: ''
  });
  const [newBookingPayment, setNewBookingPayment] = useState('Paid');

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

  // Helper: Check if booking is expired (Journey Date + 1 Day at 05:30 AM)
  const isBookingExpired = (dateStr: string) => {
    try {
      const journeyDate = new Date(dateStr);
      if (isNaN(journeyDate.getTime())) return false;

      // Create expiration date: Next day at 05:30 AM
      const expirationDate = new Date(journeyDate);
      expirationDate.setDate(expirationDate.getDate() + 1);
      expirationDate.setHours(5, 30, 0, 0);

      return new Date() > expirationDate;
    } catch (e) {
      return false;
    }
  };

  // Check Biometric Availability on Mount
  useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          setBiometricAvailable(available);
          if (!available) setShowPasswordInput(true);
        })
        .catch(err => {
          console.warn("Biometric availability check failed:", err);
          setShowPasswordInput(true);
        });
    } else {
      setShowPasswordInput(true);
    }
  }, []);

  // Biometric Auth Handler
  const handleBiometricAuth = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Lagan Bus Admin",
            id: window.location.hostname 
          },
          user: {
            id: Uint8Array.from("admin", c => c.charCodeAt(0)),
            name: "admin@lagan.com",
            displayName: "Admin User"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        }
      });

      if (credential) {
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error("Biometric failed", error);
      setShowPasswordInput(true);
    }
  };

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

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    
    try {
      // Step 1: Trigger Auto Archive on Backend
      await fetch(`${GOOGLE_SCRIPT_URL}?method=autoArchive`);

      // Step 2: Fetch Data from all 3 sheets
      const [pendingRes, activeRes, archiveRes] = await Promise.all([
        fetch(`${GOOGLE_SCRIPT_URL}?method=getAll&type=pending`),
        fetch(`${GOOGLE_SCRIPT_URL}?method=getAll&type=active`),
        fetch(`${GOOGLE_SCRIPT_URL}?method=getAll&type=archive`)
      ]);
      
      const pendingData = await pendingRes.json();
      const activeData = await activeRes.json();
      const archiveData = await archiveRes.json();
      
      const pendingRaw = pendingData.bookings || (pendingData.success ? (pendingData.bookings || pendingData.allBookings) : []) || [];
      const activeRaw = activeData.bookings || (activeData.success ? (activeData.bookings || activeData.allBookings) : []) || [];
      const archiveRaw = archiveData.bookings || (archiveData.success ? (archiveData.bookings || archiveData.allBookings) : []) || [];

      // Sort Function
      const dateSorter = (a: any, b: any) => {
          const idA = a["Booking ID"] || a["Booking Id"];
          const idB = b["Booking ID"] || b["Booking Id"];
          if (idA && idB) return idB.localeCompare(idA);
          return 0;
      };

      // Process Pending
      const pendingList = pendingRaw.map((b: any, index: number) => ({
         ...b,
         origin: 'pending' as const,
         rowIndex: b.rowIndex || (index + 2)
      })).sort(dateSorter);

      // Process Active (Filter Expired visually)
      const activeList: AdminBooking[] = [];
      activeRaw.forEach((b: any, index: number) => {
        const dateStr = b.Date || b.dateFormatted || '';
        if (!isBookingExpired(dateStr)) {
            activeList.push({
                ...b,
                origin: 'active' as const,
                rowIndex: b.rowIndex || (index + 2)
            });
        }
      });
      activeList.sort(dateSorter);

      // Process Archive
      const archiveList = archiveRaw.map((b: any, index: number) => ({ 
          ...b, 
          origin: 'archive' as const,
          rowIndex: b.rowIndex || (index + 2)
      })).sort(dateSorter);

      setPendingBookings(pendingList);
      setActiveBookings(activeList);
      setArchivedBookings(archiveList);

      // Automatically switch to pending if there are new requests and we are on initial load (empty active)
      if (pendingList.length > 0 && activeList.length === 0 && viewMode === 'active') {
          setViewMode('pending');
      }

    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Sync Error',
        text: 'Could not fetch booking data. Ensure Google Script is updated.',
        confirmButtonColor: '#0066FF',
        customClass: { popup: 'rounded-3xl' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isAuthenticated]);

  const currentList = viewMode === 'pending' ? pendingBookings 
                    : viewMode === 'active' ? activeBookings 
                    : archivedBookings;

  const filteredBookings = currentList.filter(b => {
    const searchString = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      String(b.Name || b.name || '').toLowerCase().includes(searchString) ||
      String(b.Phone || b.phone || '').includes(searchString) ||
      String(b["Booking ID"] || b["Booking Id"] || '').toLowerCase().includes(searchString);
    
    // Journey Date Filtering
    const journeyDateRaw = b.Date || b.dateFormatted || '';
    let matchesDate = true;
    
    if (filterDate) {
        try {
            const d = new Date(journeyDateRaw);
            if (!isNaN(d.getTime())) {
                const isoJourneyDate = d.toISOString().split('T')[0];
                matchesDate = isoJourneyDate === filterDate;
            } else {
                matchesDate = journeyDateRaw.includes(filterDate);
            }
        } catch (e) {
            matchesDate = false;
        }
    }

    return matchesSearch && matchesDate;
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
      const id = booking["Booking ID"] || booking["Booking Id"];
      const phone = booking.Phone || booking.phone;
      
      // Get seat strings directly
      const maleSeats = booking["Male Seat"] || booking.maleSeats || "0";
      const femaleSeats = booking["Female Seat"] || booking.femaleSeats || "0";

      if (!phone) {
          Swal.fire('Error', 'No phone number available', 'error');
          return;
      }

      const dateDisp = formatDateDisplay(booking.Date || booking.dateFormatted);

      // Construct message
      const text = `Lagan Bus Booking Confirmed! 🚍\n` +
                   `Ref: ${id}\n` +
                   `Bus: ${booking.Bus || booking.bus}\n` +
                   `Date: ${dateDisp}\n` +
                   `Time: ${booking.Time || booking.time}\n` +
                   `From: ${booking.Pickup || booking.pickup}\n` +
                   `To: ${booking.Destination || booking.destination}\n` +
                   `Seats (M): ${maleSeats}\n` +
                   `Seats (F): ${femaleSeats}\n` +
                   `Total: ${booking.Total || booking.totalAmount}\n` +
                   `Please arrive 15 mins early.`;

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

  const handleApprove = async (booking: AdminBooking) => {
      const id = booking["Booking ID"] || booking["Booking Id"];
      const row = booking.rowIndex;

      if (!id && !row) return;

      setIsLoading(true);
      try {
          const params = new URLSearchParams();
          params.append('method', 'update');
          params.append('id', id || '');
          if (row) params.append('row', row.toString());
          params.append('type', 'pending');
          params.append('status', 'Confirmed'); 

          await fetch(GOOGLE_SCRIPT_URL, { 
              method: 'POST',
              body: params,
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });

          // Move locally
          setPendingBookings(prev => prev.filter(b => (b["Booking ID"] || b["Booking Id"]) !== id));
          setActiveBookings(prev => [{...booking, Status: 'Confirmed', status: 'Confirmed', origin: 'active'}, ...prev]);

          const smsResult = await Swal.fire({
              title: 'Approved!',
              text: 'Booking moved to Active list. Send confirmation SMS now?',
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: 'Send SMS',
              cancelButtonText: 'No',
              confirmButtonColor: '#0066FF',
              customClass: { popup: 'rounded-3xl' }
          });

          if (smsResult.isConfirmed) {
              handleSendSMS(booking);
          }

      } catch (error) {
          Swal.fire('Error', 'Failed to approve booking', 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleDelete = async (booking: AdminBooking) => {
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setIsSubmitting(true);
    try {
        const id = editingBooking["Booking ID"] || editingBooking["Booking Id"];
        const row = editingBooking.rowIndex;
        const origin = editingBooking.origin;
        const targetStatus = String(editingBooking.Status || editingBooking.status || 'Confirmed');

        // PREPARE PAYLOAD
        const strictTime = formatTimeStrict(editingBooking.Time || editingBooking.time);
        
        let cleanDate = editingBooking.Date || editingBooking.dateFormatted || '';
        try {
             if (cleanDate.includes('T') || cleanDate.includes('-')) {
                 const d = new Date(cleanDate);
                 if (!isNaN(d.getTime())) {
                     cleanDate = d.toLocaleDateString('en-US', {
                         month: '2-digit',
                         day: '2-digit',
                         year: 'numeric'
                     });
                 }
             }
        } catch(e) { /* ignore */ }

        const cleanTotal = String(editingBooking.Total || editingBooking.totalAmount || 0).replace(/,/g, '');

        const isMovingToActive = origin === 'pending' && targetStatus === 'Confirmed';

        const payload: Record<string, string> = {
            'method': 'update',
            'id': id || '',
            'type': origin,
            'name': String(editingBooking.Name || editingBooking.name || ''),
            'phone': String(editingBooking.Phone || editingBooking.phone || ''),
            'bus': String(editingBooking.Bus || editingBooking.bus || ''),
            'time': strictTime,
            'date': cleanDate,
            'pickup': String(editingBooking.Pickup || editingBooking.pickup || ''),
            'destination': String(editingBooking.Destination || editingBooking.destination || ''),
            'maleSeats': String(editingBooking["Male Seat"] || editingBooking.maleSeats || ''),
            'femaleSeats': String(editingBooking["Female Seat"] || editingBooking.femaleSeats || ''),
            'payment': String(editingBooking.Payment || editingBooking.payment || 'Pending'),
            'total': cleanTotal,
        };
        if (row) payload['row'] = row.toString();

        if (isMovingToActive) {
            // STEP 1: FORCE UPDATE DATA FIRST (Status = Pending)
            const saveParams = new URLSearchParams();
            Object.entries({...payload, status: 'Pending'}).forEach(([key, val]) => saveParams.append(key, val));

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: saveParams,
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // STEP 2: TRIGGER MOVE (Status = Confirmed)
            const moveParams = new URLSearchParams();
            moveParams.append('method', 'update');
            moveParams.append('id', id || '');
            if (row) moveParams.append('row', row.toString());
            moveParams.append('type', 'pending');
            moveParams.append('status', 'Confirmed');

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: moveParams,
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

        } else {
            // STANDARD SINGLE UPDATE
            const params = new URLSearchParams();
            Object.entries({...payload, status: targetStatus}).forEach(([key, val]) => params.append(key, val));

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: params,
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        }

        // UPDATE LOCAL STATE IMMEDIATELY
        const updateList = (list: AdminBooking[]) => list.map(b => {
            const bId = b["Booking ID"] || b["Booking Id"];
            if ((bId && bId === id) || (row && b.rowIndex === row)) {
                return { ...b, ...editingBooking };
            }
            return b;
        });

        if (isMovingToActive) {
             setPendingBookings(prev => prev.filter(b => (b["Booking ID"] || b["Booking Id"]) !== id));
             setActiveBookings(prev => [{...editingBooking, Status: 'Confirmed', status: 'Confirmed', origin: 'active'}, ...prev]);
        } else {
             if (origin === 'pending') setPendingBookings(updateList);
             if (origin === 'active') setActiveBookings(updateList);
             if (origin === 'archive') setArchivedBookings(updateList);
        }

        Swal.fire({
            title: 'Saved!',
            text: 'Data updated.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: 'rounded-3xl' }
        });

        closeEditModal();
        setTimeout(fetchBookings, 2000); 
    } catch (error) {
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
        setNewBooking({ name: '', phone: '', bus: '', date: '', time: '', pickup: '', destination: '', maleSeats: '', femaleSeats: '', totalAmount: '' });
        setTimeout(fetchBookings, 2000);

    } catch (error) {
        Swal.fire('Error', 'Failed to add booking', 'error');
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
             {!showPasswordInput ? (
                <div className="flex flex-col items-center py-8 space-y-6">
                    <div 
                      onClick={handleBiometricAuth}
                      className="w-24 h-24 rounded-full bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105 group"
                    >
                        <Fingerprint size={48} className="text-primary" />
                    </div>
                    <p className="text-slate-600 font-medium">Verify Identity</p>
                    <button 
                      onClick={() => setShowPasswordInput(true)}
                      className="text-primary text-sm hover:underline transition-colors"
                    >
                        Use Access Key
                    </button>
                </div>
             ) : (
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

                    {biometricAvailable && loginStep === 'password' && (
                        <button 
                           type="button"
                           onClick={() => setShowPasswordInput(false)}
                           className="w-full text-center text-slate-400 text-sm hover:text-slate-600"
                        >
                            Back to Biometrics
                        </button>
                    )}
                </form>
             )}
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
                   {pendingBookings.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
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
        </div>

        <div className="flex items-center gap-2 md:gap-3">
             <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
             >
                <Plus size={18} /> <span className="hidden md:inline">Add Booking</span>
             </button>
             <button onClick={fetchBookings} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="Sync & Refresh">
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
                    <h3 className="text-5xl font-black text-slate-900 mb-2">{pendingBookings.length}</h3>
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
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
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                 <div className="relative flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm hover:border-primary/50 transition-colors">
                     <Filter size={18} className="text-slate-400" />
                     <input 
                       type="date"
                       value={filterDate}
                       onChange={e => setFilterDate(e.target.value)}
                       className="text-sm font-medium text-slate-700 focus:outline-none bg-transparent cursor-pointer w-full md:w-auto"
                     />
                 </div>
                 {viewMode === 'archive' && (
                    <button 
                        onClick={handleClearArchive}
                        className="px-5 py-3.5 bg-red-50 text-red-600 font-bold text-sm rounded-2xl hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm border border-red-100 shrink-0"
                    >
                        <Trash2 size={18} />
                    </button>
                 )}
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white border-b border-slate-100 text-left">
                            <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passenger</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trip</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Seats</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
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
                                const date = formatDateDisplay(booking.Date || booking.dateFormatted);
                                const time = booking.Time || booking.time;
                                const maleSeats = booking["Male Seat"] || booking.maleSeats;
                                const femaleSeats = booking["Female Seat"] || booking.femaleSeats;
                                const total = booking.Total || booking.totalAmount || 0;
                                const payment = String(booking.Payment || booking.payment || '').toLowerCase();
                                const isPaid = payment.includes('paid');

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
                          <h3 className="text-xl font-bold text-slate-900">Edit Booking</h3>
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
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                                              <input 
                                                  type="text" 
                                                  value={editingBooking.Date || editingBooking.dateFormatted || ''}
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
                          <button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                              Save Changes
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
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment & Status</h4>
                                  <div className="space-y-4">
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