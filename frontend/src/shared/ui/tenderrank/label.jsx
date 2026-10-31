import React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/shared/ui/tenderrank/utils';

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
