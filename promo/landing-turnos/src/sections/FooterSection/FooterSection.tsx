import { promoSite } from '../../content/promoSite';
import styles from './FooterSection.module.scss';

const FooterSection = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <strong>{promoSite.brandName}</strong>
          <nav className={styles.links} aria-label="Enlaces de la promo">
            <a href="#pricing">Planes</a>
            <a href="#demo">Demo</a>
            <a href="#contacto">Contacto</a>
            <a href="#legal">Legales</a>
          </nav>
        </div>
        <p>© 2026 {promoSite.brandName}. Promo comercial con demo y alta asistida.</p>
      </div>
    </footer>
  );
};

export default FooterSection;
