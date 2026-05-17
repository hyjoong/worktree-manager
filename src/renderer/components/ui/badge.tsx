import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wide', {
  variants: {
    variant: {
      default: 'border-border bg-secondary text-secondary-foreground',
      clean: 'border-border bg-muted/40 text-muted-foreground',
      dirty: 'border-amber-500/35 bg-amber-500/15 text-amber-400 shadow-[inset_0_0_0_1px_rgb(245_158_11_/_0.08)]',
      detached: 'border-violet-500/25 bg-violet-500/12 text-violet-400',
      destructive: 'border-destructive/35 bg-destructive/14 text-destructive',
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
