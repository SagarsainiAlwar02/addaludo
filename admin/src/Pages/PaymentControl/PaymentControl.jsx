import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API, { getError, serverBase } from "../../api";
import "./PaymentControl.css";

const PaymentControl = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "scanner";

  const [upiList, setUpiList] = useState([""]);
  const [account, setAccount] = useState({
    name: "",
    accountNumber: "",
    ifsc: "",
  });

  const [scannerLimit, setScannerLimit] = useState({
    min: 0,
    max: 2000,
  });

  const [upiLimit, setUpiLimit] = useState({
    min: 2000,
    max: 100000,
  });

  const [scannerImage, setScannerImage] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await API.get("/payment/settings");

      const data = res.data;

      setUpiList(data.upiList?.length ? data.upiList : [""]);
      setAccount(data.bank || { name: "", accountNumber: "", ifsc: "" });
      setScannerLimit(data.scanner || { min: 0, max: 2000 });
      setUpiLimit(data.upiLimit || { min: 2000, max: 100000 });
      setScannerImage(data.scannerImage || "");
    } catch (err) {
      console.log(err);
      alert(getError(err));
    }
  };

  const saveScanner = async () => {
    try {
      if (!file && !scannerImage) {
        alert("Please choose QR scanner image");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      if (file) {
        formData.append("file", file);
      }

      formData.append("scannerLimit", JSON.stringify(scannerLimit));

      const res = await API.post("/admin/upload-scanner", formData);

      alert(res.data?.msg || "Scanner saved");
      setFile(null);
      fetchSettings();
    } catch (err) {
      alert(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveUpi = async () => {
    try {
      const cleanUpi = upiList.map((x) => x.trim()).filter(Boolean);

      if (cleanUpi.length === 0) {
        alert("At least one UPI ID required");
        return;
      }

      setLoading(true);

      const res = await API.post("/admin/save-upi", { upiList: cleanUpi, upiLimit });

      alert(res.data?.msg || "UPI saved");
      fetchSettings();
    } catch (err) {
      alert(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveBank = async () => {
    try {
      if (!account.name || !account.accountNumber || !account.ifsc) {
        alert("Fill all bank details");
        return;
      }

      setLoading(true);

      const res = await API.post("/admin/save-bank", account);

      alert(res.data?.msg || "Bank details saved");
      fetchSettings();
    } catch (err) {
      alert(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const addUpi = () => {
    setUpiList([...upiList, ""]);
  };

  const removeUpi = (index) => {
    const updated = upiList.filter((_, i) => i !== index);
    setUpiList(updated.length ? updated : [""]);
  };

  const handleUpiChange = (value, index) => {
    const updated = [...upiList];
    updated[index] = value;
    setUpiList(updated);
  };

  return (
    <div className="payment-container">
      <h1>Payment Control</h1>

      {tab === "scanner" && (
        <div className="form-box">
          <h3>Upload QR Scanner</h3>

          {scannerImage && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ color: "#cbd5e1", fontWeight: 700 }}>Current QR</p>
              <img
                src={`${serverBase}${scannerImage}`}
                alt="QR Scanner"
                style={{
                  width: "180px",
                  height: "180px",
                  objectFit: "contain",
                  background: "#fff",
                  padding: "10px",
                  borderRadius: "12px",
                }}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <h4>Scanner Payment Limit</h4>

          <input
            type="number"
            placeholder="Min Amount"
            value={scannerLimit.min}
            onChange={(e) =>
              setScannerLimit({ ...scannerLimit, min: Number(e.target.value) })
            }
          />

          <input
            type="number"
            placeholder="Max Amount"
            value={scannerLimit.max}
            onChange={(e) =>
              setScannerLimit({ ...scannerLimit, max: Number(e.target.value) })
            }
          />

          <button className="btn save" onClick={saveScanner} disabled={loading}>
            {loading ? "Saving..." : "Save Scanner"}
          </button>
        </div>
      )}

      {tab === "upi" && (
        <div className="form-box">
          <h3>Add UPI IDs</h3>

          {upiList.map((upi, index) => (
            <div key={index} className="upi-row">
              <input
                type="text"
                placeholder="Enter UPI ID"
                value={upi}
                onChange={(e) => handleUpiChange(e.target.value, index)}
              />

              <button
                type="button"
                className="upi-remove"
                onClick={() => removeUpi(index)}
              >
                X
              </button>
            </div>
          ))}

          <button className="btn add" onClick={addUpi}>
            + Add More UPI
          </button>

          <h4>UPI Payment Limit</h4>

          <input
            type="number"
            placeholder="Min Amount"
            value={upiLimit.min}
            onChange={(e) =>
              setUpiLimit({ ...upiLimit, min: Number(e.target.value) })
            }
          />

          <input
            type="number"
            placeholder="Max Amount"
            value={upiLimit.max}
            onChange={(e) =>
              setUpiLimit({ ...upiLimit, max: Number(e.target.value) })
            }
          />

          <button className="btn save" onClick={saveUpi} disabled={loading}>
            {loading ? "Saving..." : "Save All"}
          </button>
        </div>
      )}

      {tab === "bank" && (
        <div className="form-box">
          <h3>Bank Details</h3>

          <input
            type="text"
            placeholder="Account Holder Name"
            value={account.name}
            onChange={(e) => setAccount({ ...account, name: e.target.value })}
          />

          <input
            type="text"
            placeholder="Account Number"
            value={account.accountNumber}
            onChange={(e) =>
              setAccount({ ...account, accountNumber: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="IFSC Code"
            value={account.ifsc}
            onChange={(e) => setAccount({ ...account, ifsc: e.target.value })}
          />

          <button className="btn save" onClick={saveBank} disabled={loading}>
            {loading ? "Saving..." : "Save Details"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentControl;