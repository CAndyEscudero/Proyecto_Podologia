import type { LucideIcon } from "lucide-react";

export interface HomeServiceCard {
  id: number;
  name: string;
  duration: number;
  priceLabel: string;
  description: string;
  image: string;
}

export interface HomeBenefit {
  title: string;
  copy: string;
  icon: LucideIcon;
}

export interface HomeTestimonial {
  author: string;
  quote: string;
}

export interface HomeFaq {
  question: string;
  answer: string;
}

export interface AdminHighlight {
  label: string;
  value: string;
}

export interface TrustPillar {
  title: string;
  icon: LucideIcon;
}
