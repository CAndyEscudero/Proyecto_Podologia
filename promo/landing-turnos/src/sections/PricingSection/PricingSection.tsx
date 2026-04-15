import Button from '../../components/Button/Button';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import { promoSite } from '../../content/promoSite';
import styles from './PricingSection.module.scss';

const plans = [
  {
    title: 'Implementación asistida',
    price: 'Acordada con cada local',
    description:
      'Nos sentamos con ustedes, entendemos el rubro y dejamos el negocio configurado para salir a operar.',
    bullets: [
      'Alta manual del tenant',
      'Configuración inicial de servicios y agenda',
      'Acompañamiento de arranque',
    ],
    ctaLabel: 'Solicitar implementación',
    ctaHref: promoSite.whatsappImplementationUrl,
  },
  {
    title: 'Abono mensual',
    price: 'Simple y sin vueltas',
    description:
      'Una vez validado el caso, definimos el esquema mensual según el tipo de negocio y la operación real.',
    bullets: [
      'Sin signup público',
      'Sin checkout autoservicio por ahora',
      'Pensado para crecimiento local por local',
    ],
    ctaLabel: 'Hablar por WhatsApp',
    ctaHref: promoSite.whatsappSalesUrl,
  },
] as const;

const PricingSection = () => {
  return (
    <section className={styles.section} id="pricing">
      <div className={styles.container}>
        <SectionTitle
          title="Planes simples para esta etapa"
          subtitle="No estamos vendiendo autoservicio masivo. Estamos vendiendo implementación asistida, validación comercial y un arranque prolijo."
        />

        <div className={styles.grid}>
          {plans.map((plan) => (
            <article className={styles.card} key={plan.title}>
              <p className={styles.kicker}>{plan.title}</p>
              <h3>{plan.price}</h3>
              <p className={styles.description}>{plan.description}</p>

              <ul className={styles.list}>
                {plan.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>

              <Button href={plan.ctaHref} target="_blank" rel="noreferrer">
                {plan.ctaLabel}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
