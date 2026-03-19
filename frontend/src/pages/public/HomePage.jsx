import { AboutSection } from "../../components/home/AboutSection";
import { BenefitsSection } from "../../components/home/BenefitsSection";
import { ContactSection } from "../../components/home/ContactSection";
import { FaqSection } from "../../components/home/FaqSection";
import { HeroSection } from "../../components/home/HeroSection";
import { ServicesSection } from "../../components/home/ServicesSection";
import { TestimonialsSection } from "../../components/home/TestimonialsSection";

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
