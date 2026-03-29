import React from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'motion/react';
import { SPRING } from '../../theme/motion';

type AnimatedButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tab' | 'icon';
type AnimatedButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type AnimatedButtonShape = 'default' | 'pill' | 'circle';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: AnimatedButtonVariant;
  size?: AnimatedButtonSize;
  shape?: AnimatedButtonShape;
  active?: boolean;
  isClassic?: boolean;
  children: React.ReactNode;
}

const sizeClasses: Record<AnimatedButtonSize, string> = {
  sm: 'min-h-[44px] px-3 py-2 text-[9px]',
  md: 'min-h-[44px] px-4 py-2.5',
  lg: 'min-h-12 px-5 py-3 text-xs',
  icon: 'min-h-[44px] min-w-[44px] p-0 text-sm',
};

const shapeClasses: Record<AnimatedButtonShape, string> = {
  default: 'rounded-inner',
  pill: 'rounded-full',
  circle: 'rounded-full',
};

const getVariantClasses = (
  variant: AnimatedButtonVariant,
  isClassic: boolean,
  active: boolean,
): string => {
  if (isClassic) {
    switch (variant) {
      case 'primary':
        return 'border-2 border-theme-magenta bg-theme-cyan text-white shadow-card hover:bg-theme-cyan/90';
      case 'secondary':
        return 'border-2 border-black/25 bg-black/15 text-white/90 shadow-card hover:bg-black/20 hover:text-white';
      case 'ghost':
        return 'border-2 border-black/25 bg-black/10 text-white/80 shadow-card hover:bg-black/20 hover:text-white';
      case 'danger':
        return 'border-2 border-red-500/35 bg-red-500/15 text-red-100 shadow-card hover:bg-red-500/25';
      case 'tab':
        return active
          ? 'border-2 border-theme-magenta bg-theme-cyan text-white shadow-card'
          : 'border-2 border-black/25 bg-black/15 text-white/90 shadow-card hover:bg-black/20';
      case 'icon':
        return active
          ? 'border-2 border-transparent bg-theme-warning text-black shadow-card'
          : 'border-2 border-transparent bg-black/10 text-white/80 hover:bg-black/20 hover:text-white';
    }
  }

  switch (variant) {
    case 'primary':
      return 'border border-theme-cyan/40 bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-110';
    case 'secondary':
      return 'border border-theme-border bg-theme-surface2 text-theme-text hover:border-theme-cyan/35 hover:bg-theme-surface2/85';
    case 'ghost':
      return 'border border-transparent text-theme-muted hover:border-theme-border/60 hover:bg-theme-surface2/60 hover:text-theme-text';
    case 'danger':
      return 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20';
    case 'tab':
      return active
        ? 'border border-theme-cyan/50 bg-theme-cyan text-theme-bg shadow-glow-cyan'
        : 'border border-transparent text-theme-muted hover:border-theme-border/60 hover:bg-theme-surface2/60 hover:text-theme-text';
    case 'icon':
      return active
        ? 'border border-theme-cyan/50 bg-theme-cyan text-theme-bg shadow-glow-cyan'
        : 'border border-transparent text-theme-muted hover:border-theme-border/60 hover:bg-theme-surface2/60 hover:text-theme-text';
  }
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  active = false,
  isClassic = false,
  children,
  className = '',
  disabled,
  type,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type={type ?? 'button'}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap typo-button leading-none theme-transition focus-ring motion-reduce:transform-none ${shapeClasses[shape]} ${sizeClasses[size]} ${getVariantClasses(variant, isClassic, active)} ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${className}`}
      whileTap={disabled || prefersReducedMotion ? undefined : { scale: 0.97 }}
      whileHover={disabled || prefersReducedMotion ? undefined : { scale: active ? 1.04 : 1.02 }}
      transition={SPRING.snappy}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
