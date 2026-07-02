import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import PresencePing from "./components/PresencePing";
import HomePage from "./pages/HomePage";
import RastrearPage from "./pages/RastrearPage";
import LoginPage from "./pages/LoginPage";
import PainelPage from "./pages/PainelPage";

/** Scroll to top on route change (and to a #hash target when present). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <PresencePing />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rastrear" element={<RastrearPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/painel" element={<PainelPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}
