import React from 'react';
import { motion } from 'motion/react';
import { SPRING } from '../../theme/motion';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-theme-cyan/20 text-theme-cyan border border-theme-cyan/30 hover:bg-theme-cyan/30',
  secondary: 'bg-theme-surface2 text-theme-text border border-theme-border hover:bg-theme-surface2/80',
  ghost: 'text-theme-muted hover:text-theme-text hover:bg-theme-surface2/50',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-xs font-bold',
  lg: 'px-6 py-3 text-sm font-bold',
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => (
  <motion.button
    className={`rounded-inner transition-colors focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    whileTap={disabled ? undefined : { scale: 0.97 }}
    whileHover={disabled ? undefined : { scale: 1.02 }}
    transition={SPRING.snappy}
    disabled={disabled}
    {...props}
  >
    {children}
  </motion.button>
);
