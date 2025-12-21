'use client';

interface SkeletonLoaderProps {
  className?: string;
}

export default function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-foreground/10 rounded" />
    </div>
  );
}

// Pre-built skeleton components
export function CardSkeleton() {
  return (
    <div className="p-6 border border-foreground/10 rounded-lg">
      <div className="h-6 bg-foreground/10 rounded w-1/3 mb-4 animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 bg-foreground/10 rounded w-full animate-pulse" />
        <div className="h-4 bg-foreground/10 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-foreground/10 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );
}

export function ServerCardSkeleton() {
  return (
    <div className="p-5 bg-background border border-foreground/10 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-foreground/10 rounded-full animate-pulse" />
            <div className="h-5 bg-foreground/10 rounded w-32 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-foreground/10 rounded w-24 animate-pulse" />
            <div className="h-4 bg-foreground/10 rounded w-16 animate-pulse" />
          </div>
        </div>
        <div className="h-6 bg-foreground/10 rounded w-20 animate-pulse" />
      </div>
    </div>
  );
}

