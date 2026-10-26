import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import styles from './Tooltip.module.css';
import { usePortalContainer } from '../PortalContainer/PortalContainer';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipProps = {
  content: string;
  position?: TooltipPosition;
  children: React.ReactElement;
  className?: string;
};

export function Tooltip({ content, position = 'top', children, className }: TooltipProps) {
  const portalContainer = usePortalContainer();
  return (
    <TooltipPrimitive.Provider delayDuration={80}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={portalContainer}>
          <TooltipPrimitive.Content
            side={position}
            sideOffset={7}
            className={[styles.tooltip, className].filter(Boolean).join(' ')}
          >
            {content}
            <TooltipPrimitive.Arrow className={styles.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
