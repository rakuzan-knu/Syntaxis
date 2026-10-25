import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

interface ActionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong px-5 py-3 rounded-xl font-medium',
  secondary:
    'bg-surface text-ink shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--faint)] px-5 py-3 rounded-xl font-medium',
  quiet: 'link-underline text-ink py-1 font-medium',
};

export function ActionLink({
  variant = 'primary',
  icon,
  className = '',
  children,
  ...rest
}: ActionLinkProps) {
  return (
    <a
      className={`inline-flex items-center gap-2.5 transition-[background-color,box-shadow,background-size,translate] duration-200 active:translate-y-px ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </a>
  );
}
