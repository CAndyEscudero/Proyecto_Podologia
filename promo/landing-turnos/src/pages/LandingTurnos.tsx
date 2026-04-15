import HeroSection from '../sections/HeroSection/HeroSection';
import FeaturesSection from '../sections/FeaturesSection/FeaturesSection';
import HowItWorksSection from '../sections/HowItWorksSection/HowItWorksSection';
import AudienceSection from '../sections/AudienceSection/AudienceSection';
import PricingSection from '../sections/PricingSection/PricingSection';
import DemoSection from '../sections/DemoSection/DemoSection';
import CTASection from '../sections/CTASection/CTASection';
import LegalSection from '../sections/LegalSection/LegalSection';
import FooterSection from '../sections/FooterSection/FooterSection';
import styles from './LandingTurnos.module.scss';

const LandingTurnos = () => {
  return (
    <main className={styles.page}>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AudienceSection />
      <PricingSection />
      <DemoSection />
      <CTASection />
      <LegalSection />
      <FooterSection />
    </main>
  );
};

export default LandingTurnos;
