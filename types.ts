export interface BusService {
  name: string;
  price: number;
  time: string;
  quota?: number;
}

export interface BookingFormData {
  name: string;
  phone: string;
  from: string;
  to: string;
  date: string;
  time: string;
  bus: string;
  maleSeats: number;
  femaleSeats: number;
  feedback?: string;
  seatSelections?: { id: string, type: 'male' | 'female' }[];
}

export interface BookingResponse {
  "Booking ID"?: string;
  "Booking Id"?: string;
  rowIndex?: number;
  Name?: string;
  name?: string;
  Phone?: string;
  phone?: string;
  Bus?: string;
  bus?: string;
  Date?: string;
  date?: string;
  dateFormatted?: string;
  Time?: string;
  time?: string;
  Pickup?: string;
  pickup?: string;
  Destination?: string;
  destination?: string;
  "Male Seat"?: number | string;
  maleSeats?: number | string;
  "Female Seat"?: number | string;
  femaleSeats?: number | string;
  Payment?: string;
  payment?: string;
  Total?: number | string;
  totalAmount?: number | string;
  estimatedTotal?: number;
  "Booked Date"?: string;
  Status?: string;
  status?: string;
  "Bus Number"?: string;
  busNumber?: string;
  "Conductor Number"?: string;
  conductorNumber?: string;
  "Seat Numbers"?: string;
  seatNumbers?: string;
  Feedback?: string;
  feedback?: string;
}

export interface ApiResponse {
  success: boolean;
  booking?: BookingResponse;
  allBookings?: BookingResponse[];
  error?: string;
  bookingId?: string;
}