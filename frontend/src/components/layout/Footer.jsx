import { siteConfig } from "../../app/config/site-config";

export function Footer() {
  return (
    <footer className="border-t border-rose-100/80 bg-white/80 py-10">
      <div className="container-shell flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="font-display text-2xl text-brand-wine">{siteConfig.businessName}</p>
          <p className="text-sm text-slate-600">{siteConfig.address}</p>
        </div>
        <div className="text-sm text-slate-600">
          <p>{siteConfig.phone}</p>
          <a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-wine">
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
