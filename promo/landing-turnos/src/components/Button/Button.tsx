import type { AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary';
}

const Button = ({
  children,
  href = '#',
  variant = 'primary',
  ...props
}: ButtonProps) => {
  return (
    <a href={href} className={`${styles.button} ${styles[variant]}`} {...props}>
      {children}
    </a>
  );
};

export default Button;
