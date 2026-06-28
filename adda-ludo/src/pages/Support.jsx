import React from "react";
import { useNavigate } from "react-router-dom";

export default function Support() {
  const navigate = useNavigate();

  const supportNumber = "918764076211";
  const whatsappLink = `https://api.whatsapp.com/send?phone=${supportNumber}&text=Hello%20Support`;

  return (
    <div className="min-h-screen bg-white px-4 py-6 font-sans">
      <div className="mx-auto max-w-[400px]">
        
        {/* Simple Header */}
        <div className="flex items-center mb-8">
          <button onClick={() => navigate(-1)} className="text-2xl mr-4">←</button>
          <h2 className="text-xl font-bold">Support Center</h2>
        </div>

        {/* Support Card - Sirf wahi content jo photo mein tha */}
        <div className="flex flex-col items-center">
          
          <img 
            src="https://storyset.com/images/illustrations/customer-support.svg" 
            alt="Support" 
            className="w-full max-w-[280px] mb-6"
          />

          <div className="w-full text-left">
            <h3 className="text-2xl font-bold mb-3">We're here to help</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Quick answers, friendly support. Reach out over WhatsApp and our team will get back to you within a few hours.
            </p>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#12cc66] text-white text-center py-3 rounded-lg font-bold text-lg mb-4 hover:bg-[#0eb659] active:scale-[0.98]"
          >
            WhatsApp
          </a>

          <p className="text-gray-500 font-medium self-start">Available 24 X 7</p>
        </div>

      </div>
    </div>
  );
}
