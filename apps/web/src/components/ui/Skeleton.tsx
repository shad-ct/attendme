import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  return (
    <div
      className={`skeleton animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '70%' : '100%'}
          className="rounded"
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<SkeletonProps> = ({ className = '', width = 40, height = 40 }) => {
  return (
    <Skeleton
      width={width}
      height={height}
      className={`rounded-full ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 border rounded-xl space-y-4 ${className}`} style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-center space-x-4">
        <SkeletonAvatar />
        <SkeletonText lines={2} className="flex-1" />
      </div>
      <Skeleton height="8rem" className="w-full rounded-lg" />
    </div>
  );
};

export default Skeleton;
