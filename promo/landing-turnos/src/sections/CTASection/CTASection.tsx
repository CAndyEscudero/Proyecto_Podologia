import Button from '../../components/Button/Button';
import { promoSite } from '../../content/promoSite';
import styles from './CTASection.module.scss';

const CTASection = () => {
  return (
    <section className={styles.section} id="contacto">
      <div className={styles.container}>
        <h2>¿Querés cerrar locales con una demo prolija y una implementación ordenada?</h2>
        <p>
          En esta etapa no abrimos alta online. Primero probás la demo, hablamos del caso real y
          después les damos el alta nosotros para que arranquen sin fricción.
        </p>

        <div className={styles.actions}>
          <Button href={promoSite.whatsappImplementationUrl} target="_blank" rel="noreferrer">
            Solicitar implementación
          </Button>
          <Button href={promoSite.whatsappCallUrl} variant="secondary" target="_blank" rel="noreferrer">
            Agendar una llamada
          </Button>
          <Button href={promoSite.demoUrl} variant="secondary" target="_blank" rel="noreferrer">
            Probar demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
