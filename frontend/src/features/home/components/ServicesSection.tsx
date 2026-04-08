import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AxiosError } from "axios";
import { getPublicServices } from "../../booking/api/booking.api";
import { formatBookingPrice } from "../../booking/utils/booking-formatters";
import type { Service } from "../../../shared/types/domain";
import type { ApiErrorResponse } from "../../../shared/types/api";
import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";
import { Button } from "../../../shared/ui/button/Button";
import { usePublicTenant } from "../../public/tenant/PublicTenantProvider";

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  const apiError = error as AxiosError<ApiErrorResponse>;
  return apiError.response?.data?.message || fallbackMessage;
}

export function ServicesSection() {
  const { siteConfig } = usePublicTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadServices() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getPublicServices();

        if (isCancelled) {
          return;
        }

        setServices(data);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setServices([]);
        setErrorMessage(getErrorMessage(error, "No se pudieron cargar los servicios del negocio."));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <section id="servicios" className="py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Servicios"
          title={`Servicios disponibles en ${siteConfig.businessName}`}
          copy="La grilla se alimenta con los servicios activos del tenant actual para que cada negocio muestre solo su oferta real."
        />

        {isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-surface overflow-hidden">
                <div className="h-60 animate-pulse bg-rose-100/70" />
                <div className="space-y-4 p-6">
                  <div className="h-6 w-3/4 animate-pulse rounded bg-rose-100/70" />
                  <div className="h-20 animate-pulse rounded bg-rose-50/80" />
                  <div className="h-11 w-40 animate-pulse rounded-full bg-rose-100/70" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="mt-12 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !errorMessage && services.length === 0 ? (
          <div className="mt-12 rounded-[1.7rem] border border-rose-100 bg-white/90 px-6 py-8 text-center shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-wine">
              Sin servicios publicados
            </p>
            <h3 className="mt-3 font-display text-3xl text-brand-ink">
              Este negocio todavia no cargo servicios visibles
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Cuando el tenant active sus servicios, van a aparecer aca y tambien en la agenda de
              reservas.
            </p>
          </div>
        ) : null}

        {!isLoading && !errorMessage && services.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <article key={service.id} className="card-surface overflow-hidden">
                <div className="flex h-60 items-end bg-[radial-gradient(circle_at_top_left,rgba(246,214,223,0.8),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,237,240,0.96))] p-6">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-wine">
                      Servicio activo
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-brand-ink">{service.name}</h3>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-brand-wine">
                      {service.durationMin} min
                    </span>
                    <span className="rounded-full border border-rose-100 px-3 py-1 text-xs font-bold text-brand-ink">
                      {formatBookingPrice(service.priceCents)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{service.description}</p>
                  <Link
                    to={`/reservas?service=${encodeURIComponent(service.name)}`}
                    className="inline-flex"
                  >
                    <Button className="w-full">Reservar este servicio</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
