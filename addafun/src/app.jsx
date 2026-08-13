import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import DepositPage from "./pages/deposit";

function App() {
  return (
    <BrowserRouter>
      <DepositPage />
    </BrowserRouter>
  );
}

export default App;