import React, { ReactNode } from 'react';
import type { AttendanceStatus } from '@attendme/shared';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'accent'
  | 'info';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const variantClasses = {
    success: 'status-success bg-green-100 text-green-800',
    danger: 'status-danger bg-red-100 text-red-800',
    warning: 'status-warning bg-yellow-100 text-yellow-800',
    neutral: 'status-neutral bg-gray-100 text-gray-800',
    accent: 'status-accent',
    info: 'status-info bg-blue-100 text-blue-800',
  };

  const style = variant === 'accent' ? {
    backgroundColor: 'var(--color-accent)',
    color: 'white',
  } : {};

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: AttendanceStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  let variant: BadgeVariant = 'neutral';
  
  switch (status) {
    case 'PRESENT':
      variant = 'success';
      break;
    case 'ABSENT':
      variant = 'danger';
      break;
    case 'LATE':
      variant = 'warning';
      break;
    case 'EXCUSED':
      variant = 'info';
      break;
  }

  return <Badge variant={variant} {...props} />;
};

export default Badge;
