export interface BusService {
  name: string;
  price: number;
  time: string;
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
}

export interface ApiResponse {
  success: boolean;
  booking?: BookingResponse;
  allBookings?: BookingResponse[];
  error?: string;
  bookingId?: string;
}