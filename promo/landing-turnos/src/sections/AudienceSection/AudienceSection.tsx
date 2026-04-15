import SectionTitle from '../../components/SectionTitle/SectionTitle';
import styles from './AudienceSection.module.scss';

const audience = [
  'Estéticas y centros de belleza',
  'Psicólogos, terapeutas y consultorios',
  'Peluquerías y barberías',
  'Profesores particulares',
  'Kinesiólogos y profesionales de salud',
  'Manicuras, masajistas y servicios por turnos',
];

const AudienceSection = () => {
  return (
    <section className={styles.section} id="para-quien">
      <div className={styles.container}>
        <SectionTitle
          title="Ideal para negocios y profesionales que atienden por turnos"
          subtitle="Si tu local vive de una agenda bien ordenada, esta propuesta te ayuda a mostrar valor rápido y arrancar con una implementación asistida."
        />

        <div className={styles.grid}>
          {audience.map((item) => (
            <div className={styles.item} key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
