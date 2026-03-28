import React from 'react';

const OfferPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative animate-fade-in-up">
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-primary mb-2">Special Offer!</h2>
        <p className="text-base text-slate-700 mb-4">
          Book your tickets for <b>Al Ahla</b>, <b>Sakeer</b>, or <b>Al Rasith</b> buses using <b>online transaction</b> and get <span className="text-green-600 font-bold">Rs. 100 OFF</span> instantly!
        </p>
        <div className="bg-green-100 text-green-800 rounded-lg px-4 py-2 font-semibold mb-2">
          Use online payment to avail this discount.
        </div>
        <p className="text-xs text-slate-400">* Offer valid for a limited time only.</p>
      </div>
    </div>
  );
};

export default OfferPopup;
