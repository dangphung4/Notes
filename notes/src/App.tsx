import PWABadge from "./PWABadge.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Auth from "./Core/Auth/Auth.tsx";
import Home from "./Core/Pages/Home.tsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </BrowserRouter>
      <PWABadge />
    </>
  );
}

export default App;
