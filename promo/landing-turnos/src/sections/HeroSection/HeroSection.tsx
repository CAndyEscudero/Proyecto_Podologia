import { CalendarDays, CreditCard, MessageCircle } from 'lucide-react';
import Button from '../../components/Button/Button';
import { promoSite } from '../../content/promoSite';
import logoResergo from '../../assets/logo-resergo.png';
import styles from './HeroSection.module.scss';

const HeroSection = () => {
  return (
    <section className={styles.hero} id="inicio">
      <div className={styles.container}>
        <div className={styles.content}>
          <img src={logoResergo} alt="Logo de Resergo" className={styles.logo} />

          <span className={styles.badge}>Promo comercial + demo + implementación asistida</span>

          <h1>
            Ordená tus <span>reservas</span> y mostrale valor real al cliente desde el primer click
          </h1>

          <p>
            {promoSite.brandName} está pensado para negocios y profesionales que trabajan por
            turnos. El cliente prueba una demo real, habla con ustedes y ustedes mantienen el
            control del alta para arrancar prolijos.
          </p>

          <div className={styles.actions}>
            <Button href={promoSite.demoUrl} target="_blank" rel="noreferrer">
              Probar demo
            </Button>

            <Button href={promoSite.whatsappSalesUrl} variant="secondary" target="_blank" rel="noreferrer">
              Hablar por WhatsApp
            </Button>

            <Button href="#pricing" variant="secondary">
              Ver planes
            </Button>
          </div>

          <div className={styles.highlights}>
            <div>
              <CalendarDays size={18} />
              <span>Demo pública para vender mejor</span>
            </div>
            <div>
              <CreditCard size={18} />
              <span>Señas y cobros ordenados</span>
            </div>
            <div>
              <MessageCircle size={18} />
              <span>Implementación acompañada</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>Circuito comercial recomendado</div>
          <div className={styles.cardBody}>
            <div className={styles.mockItem}>
              <span>1. El cliente prueba la demo</span>
              <strong>Entiende el producto en minutos</strong>
            </div>
            <div className={styles.mockItem}>
              <span>2. Habla con ustedes</span>
              <strong>WhatsApp o llamada de cierre</strong>
            </div>
            <div className={styles.mockItem}>
              <span>3. Ustedes dan el alta</span>
              <strong>Onboarding manual y prolijo</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
