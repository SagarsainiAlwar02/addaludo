import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DepositPage = ({ adminConfig }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('500');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState(false);

  // Admin Panel se dynamic aane wala data (Default values fallbacks ke sath)
  const upiId = adminConfig?.upiId || '';
  const bankDetails = {
    name: adminConfig?.bankName || "",
    accountNo: adminConfig?.accountNo || "",
    ifsc: adminConfig?.ifsc || ""
  };

  const handleAddAmount = (val) => {
    const currentVal = parseInt(amount) || 0;
    setAmount((currentVal + val).toString());
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 12) {
      alert('Enter 12-digit UTR Number');
      return;
    }
    if (!selectedFile) {
      alert(' Upload payment screenshot!');
      return;
    }
    alert('Payment details submit successfully');
    setIsModalOpen(false);
    navigate('/');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        
        {/* STEP 1: Amount Selection */}
        {step === 1 && (
          <div>
            {/* Top Notice Banner */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              padding: '14px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <span>👉</span>
              <span>जितना Payment add करना है वो अमाउंट भर के Next पर क्लिक करें 🙏</span>
            </div>

            {/* Dark Blue Main Card */}
            <div style={{
              backgroundColor: '#1b496d',
              padding: '24px 20px',
              borderRadius: '24px',
              boxShadow: '0 10px 25px rgba(27, 73, 109, 0.15)',
              color: '#ffffff'
            }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
                Enter Amount to Add
              </p>
              
              {/* Amount Display */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #ffffff', marginBottom: '12px', paddingBottom: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', marginRight: '10px' }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px', fontWeight: '600' }}>
                Min: ₹100 • Max: ₹100000
              </p>

              {/* Quick Add Buttons Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {[300, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddAmount(val)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      padding: '14px',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ background: '#f59e0b', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>₹</span>
                    +{val}
                  </button>
                ))}
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={() => {
                  if (Number(amount) < 100) {
                    alert("Minimum deposit  ₹100 ");
                    return;
                  }
                  setStep(2);
                }}
                style={{
                  width: '100%',
                  background: '#5c67f2',
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(92, 103, 242, 0.3)'
                }}
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Details */}
        {step === 2 && (
          <div>
            {/* Header Amount & Edit Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                Amount to be added <strong style={{ fontSize: '20px', color: '#1b496d' }}>₹{amount}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: '#1b496d',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>

            {/* Instruction Banner */}
            <div style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px',
              lineHeight: '1.5',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              Payment successfull होने के बाद स्क्रीनशॉट और UTR नंबर डालके सबमिट करें 🙏
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', color: '#0f172a', marginBottom: '20px' }}>
              नीचे दी हुई Upi Or QR पर भुगतान करें |
            </h3>

            {/* UPI ID Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '2px solid #0f172a',
              padding: '10px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>UPI ID:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{upiId}</span>
              <button
                type="button"
                onClick={() => handleCopy(upiId)}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Conditional Display: QR Code (<= 5000) OR Bank Account Details (> 5000) */}
            {Number(amount) <= 20000 ? (
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  borderRadius: '16px',
                  display: 'inline-block',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&am=${amount}`}
                    alt="Payment QR"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '2px solid #0f172a',
                padding: '18px',
                borderRadius: '16px',
                marginBottom: '28px'
              }}>
                <p style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase' }}>
                  Bank Account Details
                </p>
                <div style={{ marginBottom: '10px', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <small style={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}>ACCOUNT NAME</small>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{bankDetails.name}</div>
                </div>
                <div style={{ marginBottom: '10px', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <small style={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}>ACCOUNT NUMBER</small>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{bankDetails.accountNo}</div>
                  </div>
                  <button type="button" onClick={() => handleCopy(bankDetails.accountNo)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Copy</button>
                </div>
                <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <small style={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}>IFSC CODE</small>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{bankDetails.ifsc}</div>
                  </div>
                  <button type="button" onClick={() => handleCopy(bankDetails.ifsc)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Copy</button>
                </div>
              </div>
            )}

            {/* Green Upload Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                width: '100%',
                background: '#22a038',
                color: '#ffffff',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(34, 160, 56, 0.3)'
              }}
            >
              Upload Payment Details
            </button>
          </div>
        )}

        {/* Floating Modal (Top Right Cross Button Included) */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}>
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '360px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
            }}>
              {/* TOP RIGHT CROSS CANCEL BUTTON */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>

              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                Submit Payment Details
              </h3>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>AMOUNT</label>
                  <input
                    type="text"
                    value={`₹${amount}`}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#1b496d'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>12 DIGIT UTR NUMBER</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="Enter 12 Digit UTR Number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    background: '#f8fafc',
                    border: '2px dashed #94a3b8',
                    padding: '16px',
                    textAlign: 'center',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#475569',
                    fontWeight: 'bold'
                  }}>
                    {selectedFile ? selectedFile.name : '📷 Upload Payment Screenshot'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: '#1b496d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Submit Payment
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DepositPage;