import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { WhatsAppFloat } from "../components/layout/WhatsAppFloat";

export function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
      return;
    }

    const headerOffset = 104;
    const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(elementTop - headerOffset, 0),
      behavior: "smooth",
    });
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
