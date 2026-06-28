import React from "react";
import { useNavigate } from "react-router-dom";

export default function Support() {
  const navigate = useNavigate();

  const supportNumber = "918764076211";
  const whatsappLink = `https://api.whatsapp.com/send?phone=${supportNumber}&text=Hello%20Support`;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans">
      
      {/* Top Premium Gradient Header */}
      <div className="bg-gradient-to-r from-[#ff9a62] to-[#ff7350] px-4 py-3 flex items-center justify-between text-white shadow-sm fixed top-0 left-0 right-0 z-50 h-14 max-w-[480px] mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white/20 hover:bg-white/30 transition-colors w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold"
        >
          ←
        </button>
        <h2 className="text-lg font-black tracking-wide">Support Center</h2>
        <div className="flex items-center gap-1.5 bg-black/10 px-2.5 py-1 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse"></span>
          <span>0</span>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="mx-auto max-w-[480px] px-3 pt-18 pb-24">
        
        {/* Central Card Wrapper */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mt-2 flex flex-col items-center">
          
          {/* Centered Dynamic Vector Illustration */}
          <div className="w-full flex justify-center mb-4">
            <img 
              src="https://storyset.com/images/illustrations/customer-support.svg" 
              alt="Support Team" 
              className="w-full max-w-[280px] h-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Core Content Typography Details */}
          <div className="w-full text-left">
            <h3 className="text-xl font-black text-slate-800 leading-snug">
              We're here to help
            </h3>
            
            <p className="text-sm font-semibold text-slate-500/90 mt-2 leading-relaxed">
              Quick answers, friendly support. Reach out over WhatsApp and our team will get back to you within a few hours.
            </p>
          </div>

          {/* Full-Width WhatsApp Interactive Trigger Button */}
          <div className="w-full mt-6">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#12cc66] hover:bg-[#0eb659] text-white py-3 px-4 font-black text-base text-center shadow-md shadow-green-500/10 active:scale-[0.98] transition-transform w-full"
            >
              <span className="text-lg">💬</span> WhatsApp Support
            </a>
          </div>

          {/* Availability Time Stamp Footer */}
          <div className="w-full text-left mt-5">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Available 24 X 7
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
