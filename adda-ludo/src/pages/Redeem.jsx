import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Redeem() {
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  const [bank, setBank] = useState({
    holderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: "",
  });

  const [upi, setUpi] = useState({
    upiId: "",
    confirmUpiId: "",
  });

  const [qr, setQr] = useState({
    receiverName: "",
    qrImage: null,
  });

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/redeem", authHeader);
      setWalletBalance(res.data.winningBalance || 0);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to load redeem data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadData();
    // eslint-disable-next-line
  }, []);

  const canSelect = Number(amount) >= 200;
  const bankRequired = Number(amount) > 2000;

  const chooseMethod = (method) => {
    if (!canSelect) {
      alert("Minimum ₹200 amount enter karo");
      return;
    }

    if (bankRequired && (method === "upi" || method === "qr")) {
      alert("₹2000 se jyada withdrawal ke liye Bank Transfer required hai");
      setSelectedMethod("bank");
      return;
    }

    setSelectedMethod(method);

    setTimeout(() => {
      document.getElementById("withdraw-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const submitWithdraw = async () => {
    if (!amount || Number(amount) < 200) {
      alert("Minimum withdraw ₹200 hai");
      return;
    }

    if (Number(amount) > walletBalance) {
      alert("Insufficient winning balance");
      return;
    }

    if (!selectedMethod) {
      alert("Withdrawal option select karo");
      return;
    }

    if (Number(amount) > 2000 && selectedMethod !== "bank") {
      alert("₹2000 se jyada withdrawal ke liye Bank Details required hai");
      return;
    }

    let details = {};

    if (selectedMethod === "bank") {
      if (!bank.holderName || !bank.accountNumber || !bank.confirmAccountNumber || !bank.ifsc) {
        alert("Bank details complete fill karo");
        return;
      }

      if (bank.accountNumber !== bank.confirmAccountNumber) {
        alert("Account number match nahi hua");
        return;
      }

      details = bank;
    }

    if (selectedMethod === "upi") {
      if (!upi.upiId || !upi.confirmUpiId) {
        alert("UPI details complete fill karo");
        return;
      }

      if (upi.upiId !== upi.confirmUpiId) {
        alert("UPI ID match nahi hui");
        return;
      }

      details = upi;
    }

    if (selectedMethod === "qr") {
      if (!qr.receiverName) {
        alert("Receiver / Account name required");
        return;
      }

      details = {
        receiverName: qr.receiverName,
        qrImageName: qr.qrImage?.name || "",
      };
    }

    try {
      setWithdrawLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/redeem/withdraw",
        {
          amount: Number(amount),
          method: selectedMethod,
          details,
        },
        authHeader
      );

      alert(res.data.msg || "Withdraw request submitted successfully");

      setAmount("");
      setSelectedMethod("");
      await loadData();
    } catch (err) {
      alert(err.response?.data?.msg || "Withdraw failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Choose Withdrawal Option</h1>

      <div style={styles.amountBox}>
        <p style={styles.label}>Amount to Withdraw</p>
        <h2 style={styles.minText}>Minimum Amount 200</h2>

        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setSelectedMethod("");
          }}
          style={styles.input}
        />

        <p style={styles.help}>Minimum 200 required to enable options.</p>
        <p style={styles.balance}>
          Available Winning Balance: ₹ {Number(walletBalance).toFixed(2)}
        </p>

        {bankRequired && (
          <p style={styles.bankRequired}>
            ₹2000 se jyada amount ke liye Bank Transfer required hai.
          </p>
        )}
      </div>

      <OptionCard
        active={selectedMethod === "bank"}
        disabled={!canSelect}
        bg="#eef6ff"
        icon="🏦"
        title="Bank Transfer"
        onClick={() => chooseMethod("bank")}
      />

      <OptionCard
        active={selectedMethod === "upi"}
        disabled={!canSelect || bankRequired}
        bg="#ecfdf5"
        icon="🏛️"
        title="UPI Transfer"
        onClick={() => chooseMethod("upi")}
      />

      <OptionCard
        active={selectedMethod === "qr"}
        disabled={!canSelect || bankRequired}
        bg="#fff7ff"
        icon="🏛️"
        title="QR Code Transfer"
        text="Upload your QR image and name once; we'll reuse it."
        onClick={() => chooseMethod("qr")}
      />

      {selectedMethod && (
        <div id="withdraw-form" style={styles.formBox}>
          {selectedMethod === "bank" && (
            <>
              <h2 style={styles.formTitle}>बैंक डिटेल्स सावधानी से भरें...</h2>
              <p style={styles.warning}>
                कृपया अपनी बैंक Details सही तरीके से जोड़ें। गलत Details जोड़ने पर Support से संपर्क करना पड़ेगा।
              </p>

              <Field label="Account holder name">
                <input
                  style={styles.formInput}
                  placeholder="Account holder name"
                  value={bank.holderName}
                  onChange={(e) => setBank({ ...bank, holderName: e.target.value })}
                />
              </Field>

              <Field label="Account number">
                <input
                  style={styles.formInput}
                  placeholder="Account number"
                  value={bank.accountNumber}
                  onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                />
              </Field>

              <Field label="Confirm account number">
                <input
                  style={styles.formInput}
                  placeholder="Confirm account number"
                  value={bank.confirmAccountNumber}
                  onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value })}
                />
              </Field>

              <Field label="IFSC code">
                <input
                  style={styles.formInput}
                  placeholder="IFSC code"
                  value={bank.ifsc}
                  onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })}
                />
              </Field>
            </>
          )}

          {selectedMethod === "upi" && (
            <>
              <h2 style={styles.formTitle}>UPI आईडी ध्यान से भरें...</h2>
              <p style={styles.warning}>
                कृपया अपनी UPI Details सही तरीके से जोड़ें। गलत Details जोड़ने पर Support से संपर्क करना पड़ेगा।
              </p>

              <Field label="UPI ID">
                <input
                  style={styles.formInput}
                  placeholder="example@upi"
                  value={upi.upiId}
                  onChange={(e) => setUpi({ ...upi, upiId: e.target.value })}
                />
              </Field>

              <Field label="Confirm UPI ID">
                <input
                  style={styles.formInput}
                  placeholder="confirm example@upi"
                  value={upi.confirmUpiId}
                  onChange={(e) => setUpi({ ...upi, confirmUpiId: e.target.value })}
                />
              </Field>
            </>
          )}

          {selectedMethod === "qr" && (
            <>
              <p style={styles.warning}>
                कृपया अपना QR कोड सही अपलोड करें। गलत QR upload होने पर Support से संपर्क करना पड़ेगा।
              </p>

              <Field label="Receiver / Account Name">
                <input
                  style={styles.formInput}
                  placeholder="e.g., Ravi Sharma"
                  value={qr.receiverName}
                  onChange={(e) => setQr({ ...qr, receiverName: e.target.value })}
                />
              </Field>

              <Field label="QR Image">
                <input
                  type="file"
                  accept="image/*"
                  style={styles.formInput}
                  onChange={(e) => setQr({ ...qr, qrImage: e.target.files[0] })}
                />
              </Field>
            </>
          )}

          <Field label="Coin">
            <input style={styles.formInput} value={amount} readOnly />
          </Field>

          <button
            onClick={submitWithdraw}
            disabled={loading || withdrawLoading}
            style={styles.withdrawBtn}
          >
            {withdrawLoading ? "Submitting..." : "WITHDRAW"}
          </button>
        </div>
      )}
    </div>
  );
}

function OptionCard({ title, icon, active, disabled, bg, text, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.option,
        background: bg,
        opacity: disabled ? 0.45 : 1,
        border: active ? "2px solid #06b6d4" : "1px solid #dbeafe",
      }}
    >
      <div style={styles.optionIcon}>{icon}</div>

      <div>
        <h3 style={styles.optionTitle}>{title}</h3>
        <p style={styles.optionText}>• Minimum withdrawal 200.</p>
        <p style={styles.optionText}>• {text || "Instant withdrawal within 30 sec."}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "24px 16px 180px",
    fontFamily: "Arial, sans-serif",
    background: "#fff",
    minHeight: "100vh",
  },

  heading: {
    fontSize: "24px",
    fontWeight: 900,
    margin: "0 0 16px",
    color: "#0f172a",
  },

  amountBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "20px",
  },

  label: {
    margin: "0 0 8px",
    fontSize: "19px",
    color: "#0f172a",
  },

  minText: {
    margin: "0 0 14px",
    color: "red",
    fontSize: "24px",
    fontWeight: 900,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    height: "56px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "18px",
    outline: "none",
  },

  help: {
    color: "#64748b",
    margin: "12px 0 0",
    fontSize: "15px",
  },

  balance: {
    color: "#0f766e",
    margin: "8px 0 0",
    fontSize: "15px",
    fontWeight: 800,
  },

  bankRequired: {
    color: "#dc2626",
    margin: "8px 0 0",
    fontSize: "15px",
    fontWeight: 900,
  },

  option: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    padding: "20px",
    borderRadius: "18px",
    marginBottom: "16px",
    cursor: "pointer",
  },

  optionIcon: {
    fontSize: "24px",
    width: "40px",
    textAlign: "center",
  },

  optionTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
    color: "#334155",
  },

  optionText: {
    margin: "5px 0",
    color: "#64748b",
    fontSize: "15px",
  },

  formBox: {
    background: "#fff",
    padding: "20px",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    marginTop: "22px",
  },

  formTitle: {
    fontSize: "25px",
    margin: "0 0 10px",
    color: "#0f172a",
  },

  warning: {
    color: "red",
    fontWeight: 900,
    lineHeight: 1.55,
    fontSize: "17px",
    margin: "0 0 12px",
  },

  fieldLabel: {
    display: "block",
    fontSize: "18px",
    color: "#1f2937",
    marginBottom: "5px",
  },

  formInput: {
    width: "100%",
    boxSizing: "border-box",
    height: "50px",
    borderRadius: "9px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "16px",
    outline: "none",
  },

  withdrawBtn: {
    marginTop: "12px",
    marginLeft: "auto",
    display: "block",
    background: "linear-gradient(135deg,#06b6d4,#14b8a6)",
    color: "#fff",
    border: "none",
    padding: "16px 28px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: 900,
  },
};