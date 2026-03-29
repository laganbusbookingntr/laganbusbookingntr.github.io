import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, Clock, AlertCircle, DollarSign } from 'lucide-react';

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Payment & Confirmation',
      items: [
        {
          q: 'How do I confirm my booking?',
          a: 'After clicking "Book via WhatsApp", your booking request will be sent to our admin. The admin will verify your payment slip within 1 hour and confirm the booking. You will receive confirmation on WhatsApp.'
        },
        {
          q: 'How long does payment verification take?',
          a: 'Our admin verifies payments and confirms bookings within 1 hour on weekdays/weekends during operating hours. Payment verification is done by checking the bank transfer slip you send on WhatsApp.'
        },
        {
          q: 'What if my payment is not verified within 2 hours?',
          a: 'If we don\'t confirm your booking within 2 hours, your booking may be automatically cancelled. Please contact our hotline (+94 77 740 2886) to inquire about your payment status.'
        },
        {
          q: 'Which bank accounts can I transfer to?',
          a: 'We accept transfers to: Hatton National Bank (HNB), Account: 159020046687, Name: MOHAMED FAWAS M, Branch: Nintavur Branch. Please keep the payment slip to send on WhatsApp.'
        }
      ]
    },
    {
      category: 'Refunds & Cancellations',
      items: [
        {
          q: 'What is the refund policy?',
          a: 'FULL REFUND: If you cancel before 10 AM on the day of travel. PARTIAL REFUND: If you cancel between 10 AM - 5 PM, we deduct LKR 500. NO REFUND: If you cancel after 5 PM or don\'t show up.'
        },
        {
          q: 'How do I cancel my booking?',
          a: 'Contact our hotline (+94 77 740 2886) or email laganbusbooking@gmail.com with your booking details. We\'ll process your cancellation and refund request accordingly based on the cancellation time.'
        },
        {
          q: 'How long does refund processing take?',
          a: 'Once your cancellation is approved, the refund will be transferred back to your bank account within 2-3 business days.'
        }
      ]
    },
    {
      category: 'Support & Contact',
      items: [
        {
          q: 'What are the support hours?',
          a: 'Weekdays: 12 PM - 10 PM | Weekends: 12 PM - 10 PM | You can reach us via WhatsApp, phone, or email during these hours.'
        },
        {
          q: 'How can I contact customer support?',
          a: 'Email: laganbusbooking@gmail.com | Phone: +94 77 740 2886 | WhatsApp: Same number | Response time: Within 1 hour during operating hours.'
        },
        {
          q: 'Can I modify my booking after confirmation?',
          a: 'Yes, you can modify your booking (date, bus, seats) before the scheduled departure. Contact our support team on WhatsApp or call +94 77 740 2886 with your booking details.'
        },
        {
          q: 'What if I have a complaint about the service?',
          a: 'Please email us at laganbusbooking@gmail.com or contact us via WhatsApp with your booking reference and detailed complaint. We aim to resolve issues within 24 hours.'
        }
      ]
    },
    {
      category: 'Booking Process',
      items: [
        {
          q: 'How does the booking process work?',
          a: '1. Fill in your journey details and personal information in the form. 2. Select your seats (male/female). 3. Click "Book via WhatsApp" to send your booking request. 4. Transfer the payment to the HNB account. 5. Send the payment slip on WhatsApp. 6. Admin will verify and confirm your booking within 1 hour.'
        },
        {
          q: 'Can I book without WhatsApp?',
          a: 'Our booking system is primarily WhatsApp-based. However, you can also call +94 77 740 2886 or email laganbusbooking@gmail.com to make a booking manually. Response time: within 1 hour during operating hours.'
        },
        {
          q: 'Is my booking confirmed immediately after payment?',
          a: 'No, your booking is confirmed only after the admin verifies your payment slip and responds with confirmation on WhatsApp. This typically happens within 1 hour.'
        },
        {
          q: 'Can I book multiple passengers at once?',
          a: 'Yes, you can book up to 10 seats (male and female combined) in a single booking. For group bookings, contact us directly at +94 77 740 2886 for special discounts.'
        }
      ]
    },
    {
      category: 'Safety & Security',
      items: [
        {
          q: 'Is my personal information safe?',
          a: 'Yes, we use secure transmission for all booking details. Your payment information is never stored directly - you make bank transfers through your own bank. Your contact information is used only for booking confirmation.'
        },
        {
          q: 'What safety features do your buses have?',
          a: 'All our buses feature 24/7 GPS tracking, 100% CCTV monitoring, professional trained drivers, and full insurance coverage. Your safety is our top priority.'
        },
        {
          q: 'What is your policy on lost items?',
          a: 'If you lose an item on the bus, contact us immediately with your booking reference. We\'ll check with the driver and see if the item was found. Contact: +94 77 740 2886'
        }
      ]
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let flatIndex = 0;

  return (
    <div className="py-20 md:py-32 bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Everything you need to know about booking with Lagan Bus Services.
          </p>
        </div>

        {/* Support Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-16">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="text-blue-600 dark:text-blue-400" size={24} />
              <h3 className="font-bold text-slate-900 dark:text-white">Email</h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm">laganbusbooking@gmail.com</p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-6 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="text-green-600 dark:text-green-400" size={24} />
              <h3 className="font-bold text-slate-900 dark:text-white">Contact</h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm">+94 77 740 2886</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="text-amber-600 dark:text-amber-400" size={24} />
              <h3 className="font-bold text-slate-900 dark:text-white">Hours</h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm">12 PM - 10 PM<br></br>(Weekdays & Weekends)</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-600 rounded-r-lg p-6 mb-16">
          <div className="flex gap-4">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-300 mb-2">Important Notice</h3>
              <p className="text-red-800 dark:text-red-200 text-sm">
                Your booking is confirmed only after the admin verifies your payment slip on WhatsApp. Expected confirmation time: <strong>within 1 hour</strong> during operating hours. If not confirmed within 2 hours, your booking will be automatically cancelled. Please contact the hotline if you have any concerns.
              </p>
            </div>
          </div>
        </div>

        {/* Refund Policy Summary */}
        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-8 mb-16 border border-indigo-200 dark:border-indigo-900">
          <div className="flex items-start gap-4 mb-6">
            <DollarSign className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Refund Policy at a Glance</h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-indigo-200 dark:border-indigo-900">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">Before 10 AM</p>
              <p className="text-2xl font-black text-green-600">100% Refund</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Cancel on day of travel before 10 AM</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-indigo-200 dark:border-indigo-900">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">10 AM - 5 PM</p>
              <p className="text-2xl font-black text-amber-600">Deduct LKR 500</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Partial refund after deduction</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-indigo-200 dark:border-indigo-900">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">After 5 PM</p>
              <p className="text-2xl font-black text-red-600">No Refund</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">No cancellations allowed</p>
            </div>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                {section.category}
              </h2>
              
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => {
                  const index = flatIndex++;
                  return (
                    <div
                      key={itemIndex}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
                    >
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full flex items-center justify-between p-5 md:p-6 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <h3 className="font-bold text-slate-900 dark:text-white pr-4 text-sm md:text-base">
                          {item.q}
                        </h3>
                        <ChevronDown
                          size={20}
                          className={`flex-shrink-0 text-primary transition-transform duration-300 ${
                            openIndex === index ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {openIndex === index && (
                        <div className="px-5 md:px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 dark:border-primary/30">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Still need help?
          </h3>
          <p className="text-slate-700 dark:text-slate-300 mb-6">
            Our support team is here to assist you during operating hours
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="mailto:laganbusbooking@gmail.com"
              className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Email Us
            </a>
            <a
              href="tel:+94777402886"
              className="inline-block px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
