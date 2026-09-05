import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DatePicker } from '../../../indx-systm/src/components/DatePicker/DatePicker';
import { Button } from '../../../indx-systm/src/components/Button/Button';
import { Slider } from '../../../indx-systm/src/components/Slider/Slider';
import { Tabs } from '../../../indx-systm/src/components/Tabs/Tabs';

vi.mock('@indxsearch/pixl', () => ({ Chevron_left: () => null, Chevron_right: () => null, Chevron_down: () => null }));

afterEach(cleanup);

it('preserves enabled link tab order and callbacks', () => {
  const click = vi.fn(event => event.preventDefault());
  render(<Button href="/destination" tabIndex={3} onClick={click}>Continue</Button>);
  const link = screen.getByRole('link');
  expect(link.tabIndex).toBe(3);
  fireEvent.click(link);
  expect(click).toHaveBeenCalledOnce();
});

it('navigates date weeks and restores trigger focus on Escape', async () => {
  render(<DatePicker label="Start" value={new Date(2026, 8, 5)} />);
  const trigger = screen.getByRole('button', { name: /Start/ });
  fireEvent.click(trigger);
  const day = await screen.findByRole('button', { pressed: true });
  await waitFor(() => expect(document.activeElement).toBe(day));
  fireEvent.keyDown(day, { key: 'Home' });
  expect(document.activeElement?.textContent).toBe('31');
  fireEvent.keyDown(document.activeElement!, { key: 'End' });
  expect(document.activeElement?.textContent).toBe('6');
  fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
  expect(document.activeElement?.textContent).toBe('13');
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('names the date picker and clamps keyboard month navigation', async () => {
  const onChange = vi.fn();
  render(<DatePicker label="Start date" value={new Date(2026, 0, 31)} onChange={onChange} />);
  const trigger = screen.getByRole('button', { name: /Start date/ });
  fireEvent.click(trigger);
  const selected = await screen.findByRole('button', { pressed: true });
  expect(selected.getAttribute('aria-label')).toContain('2026');
  fireEvent.keyDown(selected, { key: 'PageDown' });
  expect(document.activeElement?.textContent).toBe('28');
  fireEvent.click(document.activeElement!);
  expect(onChange.mock.calls[0][0]).toEqual(new Date(2026, 1, 28));
});

it('keeps invalid sliders non-interactive in both modes', () => {
  const { container } = render(<><Slider min={4} max={4} value={4} label="Single" onChange={() => {}} /><Slider min={5} max={4} value={[4, 5]} isRange label="Range" onChange={() => {}} /></>);
  expect(screen.queryAllByRole('slider')).toHaveLength(0);
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
});

it('removes navigation and callbacks from disabled links', () => {
  const click = vi.fn();
  render(<Button href="/destination" disabled onClick={click}>Continue</Button>);
  const element = screen.getByText('Continue');
  fireEvent.click(element);
  expect(element.hasAttribute('href')).toBe(false);
  expect(element.tabIndex).toBe(-1);
  expect(click).not.toHaveBeenCalled();
});

it('wraps tab navigation and focuses the selected tab', () => {
  function Example() {
    const [value, setValue] = React.useState('one');
    return <Tabs items={[{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }]} value={value} onValueChange={setValue} />;
  }
  render(<Example />);
  fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Two' }));
  expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');
  fireEvent.keyDown(document.activeElement!, { key: 'Home' });
  expect(document.activeElement?.textContent).toBe('One');
  fireEvent.keyDown(document.activeElement!, { key: 'End' });
  expect(document.activeElement?.textContent).toBe('Two');
});
