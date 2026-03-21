import { Link, NavLink } from "react-router-dom";
import { siteConfig } from "../../app/config/site-config";
import { Button } from "../../shared/ui/button/Button";

interface HeaderLink {
  to: string;
  label: string;
}

const links: HeaderLink[] = [
  { to: "/", label: "Inicio" },
  { to: "/#servicios", label: "Servicios" },
  { to: "/#faq", label: "FAQ" },
  { to: "/reservas", label: "Reservas" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rose-100/70 bg-white/85 backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-4">
        <Link to="/" className="font-display text-3xl font-bold text-brand-wine">
          {siteConfig.businessName}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.label} to={link.to} className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/reservas">
          <Button>Reservar turno</Button>
        </Link>
      </div>
    </header>
  );
}
