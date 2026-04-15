import Button from '../../components/Button/Button';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import { promoSite } from '../../content/promoSite';
import styles from './DemoSection.module.scss';

const demoPoints = [
  'Una experiencia real para mostrar cómo se reservan turnos',
  'Un recorrido comercial para entender el valor del producto rápido',
  'Una base concreta para pasar de demo a implementación sin humo',
] as const;

const DemoSection = () => {
  return (
    <section className={styles.section} id="demo">
      <div className={styles.container}>
        <div className={styles.content}>
          <SectionTitle
            title="Demo pública para vender con evidencia"
            subtitle="La demo no es un adorno. Es la herramienta para mostrar el flujo real, responder objeciones y llevar la conversación comercial al cierre."
          />

          <ul className={styles.list}>
            {demoPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Button href={promoSite.demoUrl} target="_blank" rel="noreferrer">
              Probar demo
            </Button>
            <Button href={promoSite.whatsappDemoUrl} variant="secondary" target="_blank" rel="noreferrer">
              Pedir recorrido guiado
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
