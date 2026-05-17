import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium', {
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      clean: 'bg-emerald-500/12 text-emerald-500',
      dirty: 'bg-amber-500/14 text-amber-500',
      detached: 'bg-violet-500/14 text-violet-400',
      destructive: 'bg-destructive/14 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
