import { Link } from "react-router-dom";
import { siteConfig } from "../../../app/config/site-config";
import { trustPillars } from "../data/home-content";
import { Button } from "../../../shared/ui/button/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/01_salud_para_tus_pies.webp')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,26,31,0.60)_0%,rgba(37,26,31,0.26)_45%,rgba(37,26,31,0.12)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_85%_78%,rgba(255,214,224,0.18),transparent_18%)]" />
      <div className="container-shell relative flex min-h-[86vh] items-center py-24">
        <div className="max-w-3xl text-white">
          <p className="mb-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.28em] text-rose-50">
            Podologia y pedicuria profesional en {siteConfig.location}
          </p>
          <h1 className="font-display text-5xl font-semibold leading-none md:text-7xl">
            {siteConfig.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-rose-50/90 md:text-xl">
            {siteConfig.heroCopy}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/reservas">
              <Button>Quiero reservar mi turno</Button>
            </Link>
            <a href="#servicios">
              <Button variant="secondary" className="bg-white/90">
                Conocer tratamientos
              </Button>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {trustPillars.map(({ title, icon: Icon }) => (
              <div key={title} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                <span className="inline-flex items-center gap-2">
                  <Icon size={16} />
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
