import React from "react";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111827",
        color: "#fff",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>
          🚧 Website Under Maintenance
        </h1>

        <p style={{ fontSize: "22px", lineHeight: "1.8" }}>
          Server Issue 🛜 की वजह से हमारी वेबसाइट अगले
          <strong> 24 घंटे </strong>
          के लिए Maintenance पर रहेगी.
        </p>

        <p style={{ fontSize: "20px", marginTop: "15px" }}>
          👉 कृपया धैर्य रखें 🙏
        </p>

        <p style={{ fontSize: "20px" }}>
          आपका विश्वास और सहयोग हमारे लिए बहुत महत्वपूर्ण है।
        </p>

        <p
          style={{
            marginTop: "30px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          धन्यवाद 🙏
        </p>

        <p style={{ marginTop: "10px", opacity: 0.8 }}>
          Team Adda Ludo
        </p>
      </div>
    </div>
  );
}



// maintaince code