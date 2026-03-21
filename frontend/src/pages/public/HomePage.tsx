import { AboutSection } from "../../features/home/components/AboutSection";
import { BenefitsSection } from "../../features/home/components/BenefitsSection";
import { ContactSection } from "../../features/home/components/ContactSection";
import { FaqSection } from "../../features/home/components/FaqSection";
import { HeroSection } from "../../features/home/components/HeroSection";
import { ServicesSection } from "../../features/home/components/ServicesSection";
import { TestimonialsSection } from "../../features/home/components/TestimonialsSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <BenefitsSection />
      <TestimonialsSection />
      <FaqSection />
      <ContactSection />
    </>
  );
}
