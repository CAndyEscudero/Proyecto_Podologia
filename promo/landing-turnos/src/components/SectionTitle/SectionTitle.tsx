import styles from './SectionTitle.module.scss';

interface SectionTitleProps {
  title: string;
  subtitle: string;
}

const SectionTitle = ({ title, subtitle }: SectionTitleProps) => {
  return (
    <div className={styles.wrapper}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
};

export default SectionTitle;