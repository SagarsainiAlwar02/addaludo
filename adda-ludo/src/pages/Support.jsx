huimport React from "react";
import { useNavigate } from "react-router-dom";

export default function Support() {
  const navigate = useNavigate();

  const whatsappNumber = "919983776947";
  const callNumber = "8239092073";
  
  const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=Hello%20Support`;
  const callLink = `tel:${callNumber}`;

  return (
    <div className="min-h-screen bg-white px-4 pt-16 pb-24 font-sans max-w-[480px] mx-auto">
      <div>
        
        {/* Clean Back Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="text-2xl mr-4 font-bold text-slate-700">←</button>
          <h2 className="text-xl font-black text-slate-800">Support Center</h2>
        </div>

        {/* Support Section Content Layout */}
        <div className="flex flex-col items-center">
          
          {/* Static Un-blockable Inline SVG Illustration Vector */}
          <div className="w-full max-w-[260px] h-auto my-4 flex justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-auto text-blue-500" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="#eff6ff" />
              <path d="M100 50c-27.6 0-50 22.4-50 50 0 15.1 6.7 28.6 17.3 37.8L60 155l20.4-10.2c5.9 1.4 12.1 2.2 19.6 2.2 27.6 0 50-22.4 50-50s-22.4-50-50-50z" fill="#dbeafe" />
              <circle cx="85" cy="95" r="12" fill="#3b82f6" />
              <circle cx="115" cy="95" r="12" fill="#3b82f6" />
              <path d="M75 115s10 15 25 15 25-15 25-15" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M65 95c0-15 10-25 25-25s25 10 25 25" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" fill="none" />
              <rect x="58" y="90" width="10" height="20" rx="4" fill="#1e3a8a" />
              <rect x="132" y="90" width="10" height="20" rx="4" fill="#1e3a8a" />
            </svg>
          </div>

          <div className="w-full text-left mt-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">We're here to help</h3>
            <p className="text-sm font-semibold text-slate-500 mt-2 mb-6 leading-relaxed">
             ⚠️सुचना:- कृपया धयान दे Support No अब परमानेंट अब ये ही रहेगा किसी और no. पर मैसेज ना करे !
            </p>
          </div>

          {/* Action Buttons: WhatsApp & Call Side-by-Side */}
          <div className="w-full flex gap-3 mb-5">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#12cc66] hover:bg-[#0eb659] text-white text-center py-3 rounded-xl font-black text-base shadow-sm active:scale-[0.99] transition-transform block"
            >
              WhatsApp
            </a>

            <a
              href={callLink}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-black text-base shadow-sm active:scale-[0.99] transition-transform block"
            >
              Call
            </a>
          </div>

          <p className="text-xs font-black text-slate-400 uppercase tracking-wider self-start">
            Available 24 X 7
          </p>
        </div>

      </div>
    </div>
  );
}
