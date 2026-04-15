import { BarChart3, CalendarCheck2, CreditCard, MessageCircleMore } from 'lucide-react';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import styles from './FeaturesSection.module.scss';

const features = [
  {
    icon: <CalendarCheck2 size={28} />,
    title: 'Agenda online real',
    description:
      'Mostrá disponibilidad, servicios y horarios para que el cliente entienda cómo trabaja tu local.',
  },
  {
    icon: <CreditCard size={28} />,
    title: 'Señas y cobros',
    description:
      'Podés cobrar con Mercado Pago cuando el flujo comercial lo pida, sin improvisar después.',
  },
  {
    icon: <MessageCircleMore size={28} />,
    title: 'Canal humano claro',
    description:
      'La promo no te suelta solo: demo, WhatsApp e implementación asistida dentro del mismo circuito.',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Más orden operativo',
    description:
      'Tenés una base lista para crecer sin mezclar marketing, demo y alta pública antes de tiempo.',
  },
];

const FeaturesSection = () => {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        <SectionTitle
          title="Todo lo que necesitás para vender mejor tu agenda"
          subtitle="La promo muestra valor, la demo convence y ustedes mantienen el control del alta. Así evitás complejidad prematura y salís más prolijo."
        />

        <div className={styles.grid}>
          {features.map((feature) => (
            <div className={styles.card} key={feature.title}>
              <div className={styles.icon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
