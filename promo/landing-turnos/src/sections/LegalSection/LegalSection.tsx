import SectionTitle from '../../components/SectionTitle/SectionTitle';
import styles from './LegalSection.module.scss';

const legalItems = [
  {
    title: 'Términos',
    description:
      'La demo y la promo son informativas. La activación real del servicio se acuerda con ustedes antes del alta.',
  },
  {
    title: 'Privacidad',
    description:
      'Los datos que lleguen por WhatsApp o formulario se usan para responder consultas comerciales y coordinar la implementación.',
  },
  {
    title: 'Política comercial',
    description:
      'La salida en esta etapa es asistida: demo, conversación comercial, alta manual y acompañamiento inicial.',
  },
] as const;

const LegalSection = () => {
  return (
    <section className={styles.section} id="legal">
      <div className={styles.container}>
        <SectionTitle
          title="Legales mínimos para salir prolijos"
          subtitle="No hace falta escribir una biblia legal para arrancar, pero sí dejar claro cómo funciona la demo, cómo se usan los contactos y cómo se activa el servicio."
        />

        <div className={styles.grid}>
          {legalItems.map((item) => (
            <article className={styles.card} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LegalSection;
