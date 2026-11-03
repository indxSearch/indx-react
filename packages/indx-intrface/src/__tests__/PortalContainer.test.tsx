import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Modal, PortalContainerProvider } from '@indxsearch/systm';

// systm's floating parts render through Radix portals into document.body, outside a shadow root:
// in the Indx widget they would show up on the host page, unstyled. Given a container, they stay
// inside it.

describe('PortalContainerProvider', () => {
  it('renders a modal into the shadow root it is given, not into the page', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.appendChild(mount);

    render(
      <PortalContainerProvider container={shadow}>
        <Modal open title="Inside">
          <p>In the shadow root</p>
        </Modal>
      </PortalContainerProvider>,
      { container: mount },
    );

    expect(shadow.textContent).toContain('In the shadow root');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    host.remove();
  });

  it('without a provider, renders into the page as before', () => {
    render(<Modal open title="Outside"><p>On the page</p></Modal>);
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('On the page');
  });
});
