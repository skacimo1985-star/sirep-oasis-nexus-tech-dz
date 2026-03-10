import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  fullPage?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  label,
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={clsx(
        'rounded-full border-oasis-200 border-t-oasis-600 animate-spin',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label={label ?? 'Chargement…'}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
        {label && (
          <p className="mt-4 text-sm text-slate-500 animate-pulse">{label}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      {spinner}
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}
