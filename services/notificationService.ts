import { BookingResponse } from '../types';

export const sendWhatsAppNotification = async (
  phone: string,
  message: string
): Promise<boolean> => {
  try {
    // Open WhatsApp with pre-filled message (client-side fallback)
    const encodedMessage = encodeURIComponent(message);
    
    // Format phone number for WhatsApp (Sri Lanka country code +94)
    let whatsappPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (whatsappPhone.startsWith('0')) {
      whatsappPhone = '94' + whatsappPhone.slice(1); // Replace leading 0 with 94
    } else if (!whatsappPhone.startsWith('94')) {
      whatsappPhone = '94' + whatsappPhone; // Add 94 if not present
    }
    
    // For mobile: Open WhatsApp app
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.open(`whatsapp://send?phone=${whatsappPhone}&text=${encodedMessage}`, '_blank');
    } else {
      // For desktop: Open WhatsApp Web
      window.open(`https://web.whatsapp.com/send?phone=${whatsappPhone}&text=${encodedMessage}`, '_blank');
    }
    
    return true;
  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return false;
  }
};

export const sendBookingConfirmationNotification = (booking: BookingResponse) => {
  const phone = booking.Phone || booking.phone;
  if (!phone) return false;

  const message = `✅ Booking Confirmed!\nBus: ${booking.Bus || booking.bus}\nDate: ${booking.Date || booking.dateFormatted}\nTime: ${booking.Time || booking.time}\nTotal: Rs.${booking.Total || booking.totalAmount}\n\nCheck your booking: https://laganbusbooking.lk/`;
  
  return sendWhatsAppNotification(phone, message);
};

export const sendBusAssignmentNotification = (booking: BookingResponse) => {
  const phone = booking.Phone || booking.phone;
  if (!phone) return false;

  const busNumber = (booking["Bus Number"] || booking.busNumber || 'TBD');
  const conductorNumber = (booking["Conductor Number"] || booking.conductorNumber || 'TBD');
  
  const message = `🚌 Bus Assigned!\nRef: ${booking["Booking ID"] || booking["Booking Id"]}\nBus No: ${busNumber}\nConductor: ${conductorNumber}\nDate: ${booking.Date || booking.dateFormatted}\nTime: ${booking.Time || booking.time}\n\nArrive 15 mins early!`;
  
  return sendWhatsAppNotification(phone, message);
};

export const sendCancellationNotification = (booking: BookingResponse, reason?: string) => {
  const phone = booking.Phone || booking.phone;
  if (!phone) return false;

  const message = `❌ Booking Cancelled\nRef: ${booking["Booking ID"] || booking["Booking Id"]}\nBus: ${booking.Bus || booking.bus}\nDate: ${booking.Date || booking.dateFormatted}${reason ? `\nReason: ${reason}` : ''}\n\nContact: https://laganbusbooking.lk/`;
  
  return sendWhatsAppNotification(phone, message);
};

export const sendPaymentReminderNotification = (booking: BookingResponse) => {
  const phone = booking.Phone || booking.phone;
  if (!phone) return false;

  const message = `💰 Payment Reminder\nRef: ${booking["Booking ID"] || booking["Booking Id"]}\nAmount: Rs.${booking.Total || booking.totalAmount}\nBus: ${booking.Bus || booking.bus}\nDate: ${booking.Date || booking.dateFormatted}\n\nComplete payment to confirm your booking!`;
  
  return sendWhatsAppNotification(phone, message);
};
