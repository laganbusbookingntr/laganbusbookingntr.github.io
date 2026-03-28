import React from 'react';

const OfferPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative border border-primary/20">
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-extrabold text-primary mb-2">Special Offer</h2>
        <div className="mb-4">
          <span className="inline-block text-3xl text-green-600 font-bold">Rs. 100 OFF</span>
        </div>
        <p className="text-base text-slate-700 mb-4">
          Book your tickets for <b>Al Ahla</b>, <b>Sakeer</b>, or <b>Al Rasith</b> buses using <b>online transaction</b> and get an instant discount.
        </p>
        <div className="bg-green-50 text-green-800 rounded-lg px-4 py-2 font-semibold mb-2 border border-green-200">
          Use online payment to avail this discount.
        </div>
        <p className="text-xs text-slate-400 mt-2">* Offer valid for a limited time only.</p>
        <button
          className="mt-4 w-full py-3 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition"
          onClick={onClose}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default OfferPopup;
