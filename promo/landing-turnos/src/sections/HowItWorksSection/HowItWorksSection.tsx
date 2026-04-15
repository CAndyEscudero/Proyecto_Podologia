import SectionTitle from '../../components/SectionTitle/SectionTitle';
import styles from './HowItWorksSection.module.scss';

const steps = [
  'El cliente entra a la promo y prueba una demo real del producto.',
  'Hablan con ustedes por WhatsApp o coordinan una llamada corta.',
  'Ustedes configuran el negocio, servicios, horarios y datos iniciales.',
  'Entregan acceso listo para operar sin depender de signup público.',
];

const HowItWorksSection = () => {
  return (
    <section className={styles.section} id="como-funciona">
      <div className={styles.container}>
        <SectionTitle
          title="Cómo funciona el circuito comercial"
          subtitle="La lógica de esta etapa es simple: demo para vender, contacto para cerrar y onboarding manual para arrancar bien."
        />

        <div className={styles.steps}>
          {steps.map((step, index) => (
            <div className={styles.step} key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
