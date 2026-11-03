import React, { createContext, useContext } from 'react';

/**
 * Where systm's floating parts (Tooltip, Popover, Select, Modal, DatePicker, the Breadcrumbs'
 * switchers) render. Radix portals them to `document.body` by default, which is outside a shadow
 * root: an app that renders systm inside one (the Indx widget, a component embedded in another
 * site) passes its shadow root here, so those parts stay inside it and keep its styles. Without a
 * provider nothing changes.
 */
const PortalContainerContext = createContext<Element | DocumentFragment | null>(null);

export interface PortalContainerProviderProps {
  /** The element or shadow root floating parts render into. */
  container: Element | DocumentFragment | null;
  children?: React.ReactNode;
}

export const PortalContainerProvider: React.FC<PortalContainerProviderProps> = ({ container, children }) => (
  <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
);

/** The container the nearest provider names, or undefined for Radix's default (`document.body`). */
export function usePortalContainer(): Element | DocumentFragment | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}
