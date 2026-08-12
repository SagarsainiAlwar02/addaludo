import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const WalletPage = ({ adminConfig }) => {
  const navigate = useNavigate();

  // ----------------- WALLET STATES -----------------
  const [showAddCash, setShowAddCash] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'withdraw'
  const [depositCoin, setDepositCoin] = useState(450.00);
  const [bonusCoin, setBonusCoin] = useState(0.00);
  const [winningCoin, setWinningCoin] = useState(62053.00);
  const [transactions, setTransactions] = useState([]);

  // ----------------- DEPOSIT PROCESS STATES -----------------
  const [depositStep, setDepositStep] = useState(1);
  const [amount, setAmount] = useState('500');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: adminConfig?.upiId || '8233725398@mairtel',
    bankName: adminConfig?.bankName || 'AddaLudo Gaming Pvt Ltd',
    accountNo: adminConfig?.accountNo || '918237465012',
    ifsc: adminConfig?.ifsc || 'PYTM0123456'
  });

  // Mobile Viewport Fix (Prevents auto-zooming on mobile devices)
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const settingsRes = await axios.get(`${API_BASE_URL}/payment/settings`, { headers }).catch(() => null);
      if (settingsRes?.data) {
        setPaymentSettings((prev) => ({ ...prev, ...settingsRes.data }));
      }

      const txRes = await axios.get(`${API_BASE_URL}/transactions/deposits`, { headers }).catch(() => null);
      if (txRes?.data) {
        setTransactions(txRes.data.deposits || txRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    }
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

  const resetDepositState = () => {
    setDepositStep(1);
    setAmount('500');
    setUtrNumber('');
    setSelectedFile(null);
    setIsModalOpen(false);
    setShowAddCash(false);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();

    if (!utrNumber || utrNumber.trim().length !== 12) {
      alert('Kripya sahi 12-digit UTR Number enter karein!');
      return;
    }
    if (!selectedFile) {
      alert('Kripya screenshot upload karein!');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('utr', utrNumber);
      formData.append('screenshot', selectedFile);

      const res = await axios.post(`${API_BASE_URL}/transactions/deposit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data?.success || res.status === 200) {
        alert('Payment details submit ho gayi hain! Verification me 5-10 min lagenge.');
        resetDepositState();
        fetchInitialData();
      } else {
        alert(res.data?.message || 'Submission failed! Try again.');
      }
    } catch (err) {
      console.error('Deposit Error:', err);
      alert(err.response?.data?.message || 'Payment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '20px',
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'transparent'
    }}>

      {/* ========================================================= */}
      {/* SCREENSHOT EXACT WALLET UI                                */}
      {/* ========================================================= */}
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '16px' }}>

        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: 'none',
                background: '#ffffff',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            >
              ←
            </button>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>Wallet</h2>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>0 online</span>
        </div>

        {/* 1. Deposit Coin Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            
            {/* Left Info */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                💰
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Deposit Coin</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                  ₹ {depositCoin.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🎁 Bonus: ₹ {bonusCoin.toFixed(2)}
                </div>
              </div>
            </div>

            {/* SCREENSHOT 'ADD CASH +' BUTTON */}
            <button
              type="button"
              onClick={() => setShowAddCash(true)}
              style={{
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)'
              }}
            >
              Add Cash +
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
            Use to play Tournaments & Battles. Cannot be withdrawn.
          </p>
        </div>

        {/* 2. Winning Coin Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                🏆
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Winning Coin</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }}>
                  ₹ {winningCoin.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("KYC Section")}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Complete KYC 📋
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
            Withdrawable to UPI or Bank. Also usable for play.
          </p>
        </div>

        {/* 3. History Tabs */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('deposit')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'deposit' ? '#2563eb' : '#f1f5f9',
                color: activeTab === 'deposit' ? '#ffffff' : '#64748b'
              }}
            >
              Deposit History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('withdraw')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'withdraw' ? '#2563eb' : '#f1f5f9',
                color: activeTab === 'withdraw' ? '#ffffff' : '#64748b'
              }}
            >
              Withdraw History
            </button>
          </div>

          {/* History List */}
          {activeTab === 'deposit' ? (
            transactions.length === 0 ? (
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>₹200</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>UTR: 074099631300</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>7/8/2026, 3:33:53 pm</div>
                </div>
                <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                  rejected
                </span>
              </div>
            ) : (
              transactions.map((item, idx) => (
                <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>₹{item.amount}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>UTR: {item.utr || 'N/A'}</div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>{item.date || 'Recent'}</div>
                  </div>
                  <span style={{
                    backgroundColor: item.status === 'Approved' ? '#dcfce7' : item.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                    color: item.status === 'Approved' ? '#15803d' : item.status === 'Rejected' ? '#dc2626' : '#b45309',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {item.status || 'pending'}
                  </span>
                </div>
              ))
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>No withdraw history found</div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* DEPOSIT PAGE OVERLAY (OPENED AFTER CLICKING 'ADD CASH +') */}
      {/* ========================================================= */}
      {showAddCash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 9999,
          overflowY: 'auto',
          padding: '16px 12px',
          boxSizing: 'border-box'
        }}>
          <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>

            <button
              type="button"
              onClick={() => resetDepositState()}
              style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#0f172a',
                marginBottom: '16px'
              }}
            >
              ← Back
            </button>
            
            {/* Step 1: Amount */}
            {depositStep === 1 && (
              <div>
                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <span>👉</span>
                  <span>जितना Payment add करना है वो अमाउंट भर के Next पर क्लिक करें 🙏</span>
                </div>

                <div style={{
                  backgroundColor: '#1b496d',
                  padding: '20px 16px',
                  borderRadius: '22px',
                  boxShadow: '0 8px 20px rgba(27, 73, 109, 0.2)',
                  color: '#ffffff'
                }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Enter Amount to Add
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #ffffff', marginBottom: '8px', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', marginRight: '8px' }}>₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '26px',
                        fontWeight: 'bold',
                        width: '100%',
                        outline: 'none',
                        padding: 0
                      }}
                    />
                  </div>

                  <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '20px', fontWeight: '600' }}>
                    Min: ₹100 • Max: ₹100000
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    {[300, 500, 1000, 2000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleAddAmount(val)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.12)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                          padding: '12px',
                          borderRadius: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ background: '#f59e0b', color: '#000', width: '18px', height: '18px', borderRadius: '50%', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>₹</span>
                        +{val}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (Number(amount) < 100) {
                        alert("Minimum amount ₹100 required!");
                        return;
                      }
                      setDepositStep(2);
                    }}
                    style={{
                      width: '100%',
                      background: '#5c67f2',
                      color: '#ffffff',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '14px',
                      fontSize: '16px',
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

            {/* Step 2: QR & UPI Payment Details */}
            {depositStep === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                    Amount to add: <strong style={{ fontSize: '18px', color: '#1b496d' }}>₹{amount}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDepositStep(1)}
                    style={{
                      background: '#1b496d',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '18px',
                  lineHeight: '1.4'
                }}>
                  Payment सक्सेसफुल होने के बाद स्क्रीनशॉट और UTR नंबर डालके सबमिट करें 🙏
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 'bold', textAlign: 'center', color: '#0f172a', marginBottom: '16px' }}>
                  नीचे दी हुई UPI Or QR पर भुगतान करें
                </h4>

                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #0f172a',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>UPI ID:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444', wordBreak: 'break-all', margin: '0 6px' }}>{paymentSettings.upiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentSettings.upiId)}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {Number(amount) <= 5000 ? (
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '12px',
                      borderRadius: '16px',
                      display: 'inline-block',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${paymentSettings.upiId}&am=${amount}`}
                        alt="Payment QR"
                        style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #0f172a',
                    padding: '14px',
                    borderRadius: '14px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#0284c7' }}>BANK ACCOUNT DETAILS</p>
                    <div style={{ marginBottom: '8px', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <small style={{ color: '#64748b', fontSize: '10px' }}>ACCOUNT NAME</small>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{paymentSettings.bankName}</div>
                    </div>
                    <div style={{ marginBottom: '8px', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <small style={{ color: '#64748b', fontSize: '10px' }}>ACCOUNT NUMBER</small>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{paymentSettings.accountNo}</div>
                      </div>
                      <button type="button" onClick={() => handleCopy(paymentSettings.accountNo)} style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Copy</button>
                    </div>
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <small style={{ color: '#64748b', fontSize: '10px' }}>IFSC CODE</small>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{paymentSettings.ifsc}</div>
                      </div>
                      <button type="button" onClick={() => handleCopy(paymentSettings.ifsc)} style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Copy</button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    width: '100%',
                    background: '#22a038',
                    color: '#ffffff',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(34, 160, 56, 0.25)'
                  }}
                >
                  Upload Payment Details
                </button>
              </div>
            )}

            {/* Proof Submission Modal */}
            {isModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                zIndex: 10000
              }}>
                <div style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '20px',
                  width: '100%',
                  maxWidth: '340px',
                  padding: '20px',
                  position: 'relative',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  boxSizing: 'border-box'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#f1f5f9',
                      border: 'none',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    ✕
                  </button>

                  <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                    Submit Payment Details
                  </h3>

                  <form onSubmit={handleDepositSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>AMOUNT</label>
                      <input
                        type="text"
                        value={`₹${amount}`}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          color: '#1b496d'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>12 DIGIT UTR NUMBER</label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="Enter 12 Digit UTR Number"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          fontSize: '16px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{
                        display: 'block',
                        background: '#f8fafc',
                        border: '1.5px dashed #94a3b8',
                        padding: '14px',
                        textAlign: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#475569',
                        fontWeight: 'bold'
                      }}>
                        {selectedFile ? selectedFile.name : '📷 Attach Payment Screenshot'}
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
                      disabled={loading}
                      style={{
                        width: '100%',
                        background: loading ? '#94a3b8' : '#1b496d',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Payment'}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default WalletPage;
