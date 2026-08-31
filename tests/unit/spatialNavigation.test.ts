import { describe, it, expect, beforeEach, vi } from 'vitest';
import { spatialNavigation } from '../../src/platform/tv/spatialNavigation';

describe('TV Spatial Navigation Engine', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('identifies visible interactive elements', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <a id="link1" href="/test">Link 1</a>
      <input id="input1" type="text" />
      <button id="btnDisabled" disabled>Disabled Button</button>
      <button id="btnHidden" style="display: none;">Hidden Button</button>
      <div id="divFocusable" tabindex="0" data-tv-focusable="true">Focusable Card</div>
    `;
    document.body.appendChild(container);

    // Mock bounding client rects
    const btn1 = document.getElementById('btn1')!;
    const link1 = document.getElementById('link1')!;
    const input1 = document.getElementById('input1')!;
    const btnDisabled = document.getElementById('btnDisabled')!;
    const btnHidden = document.getElementById('btnHidden')!;
    const divFocusable = document.getElementById('divFocusable')!;

    vi.spyOn(btn1, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 } as DOMRect);
    vi.spyOn(link1, 'getBoundingClientRect').mockReturnValue({ left: 120, top: 0, right: 220, bottom: 40, width: 100, height: 40 } as DOMRect);
    vi.spyOn(input1, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 60, right: 100, bottom: 100, width: 100, height: 40 } as DOMRect);
    vi.spyOn(divFocusable, 'getBoundingClientRect').mockReturnValue({ left: 120, top: 60, right: 220, bottom: 100, width: 100, height: 40 } as DOMRect);

    const focusables = spatialNavigation.getFocusableElements(container);
    expect(focusables).toContain(btn1);
    expect(focusables).toContain(link1);
    expect(focusables).toContain(input1);
    expect(focusables).toContain(divFocusable);
    expect(focusables).not.toContain(btnDisabled);
    expect(focusables).not.toContain(btnHidden);
  });

  it('calculates spatial directional movement (Right, Down, Left, Up)', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="top-left">Top Left</button>
      <button id="top-right">Top Right</button>
      <button id="bottom-left">Bottom Left</button>
      <button id="bottom-right">Bottom Right</button>
    `;
    document.body.appendChild(container);

    const topLeft = document.getElementById('top-left')!;
    const topRight = document.getElementById('top-right')!;
    const bottomLeft = document.getElementById('bottom-left')!;
    const bottomRight = document.getElementById('bottom-right')!;

    vi.spyOn(topLeft, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 } as DOMRect);
    vi.spyOn(topRight, 'getBoundingClientRect').mockReturnValue({ left: 150, top: 0, right: 250, bottom: 40, width: 100, height: 40 } as DOMRect);
    vi.spyOn(bottomLeft, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 80, right: 100, bottom: 120, width: 100, height: 40 } as DOMRect);
    vi.spyOn(bottomRight, 'getBoundingClientRect').mockReturnValue({ left: 150, top: 80, right: 250, bottom: 120, width: 100, height: 40 } as DOMRect);

    // From Top-Left: Right should yield Top-Right
    const nextRight = spatialNavigation.findNextCandidate(topLeft, 'right', container);
    expect(nextRight).toBe(topRight);

    // From Top-Left: Down should yield Bottom-Left
    const nextDown = spatialNavigation.findNextCandidate(topLeft, 'down', container);
    expect(nextDown).toBe(bottomLeft);

    // From Bottom-Right: Left should yield Bottom-Left
    const nextLeft = spatialNavigation.findNextCandidate(bottomRight, 'left', container);
    expect(nextLeft).toBe(bottomLeft);

    // From Bottom-Right: Up should yield Top-Right
    const nextUp = spatialNavigation.findNextCandidate(bottomRight, 'up', container);
    expect(nextUp).toBe(topRight);
  });

  it('traps focus inside an active modal dialog', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="outsideBtn">Outside</button>
      <div role="dialog" aria-modal="true" id="modal">
        <button id="modalBtn1">Modal 1</button>
        <button id="modalBtn2">Modal 2</button>
      </div>
    `;
    document.body.appendChild(container);

    const outsideBtn = document.getElementById('outsideBtn')!;
    const modalBtn1 = document.getElementById('modalBtn1')!;
    const modalBtn2 = document.getElementById('modalBtn2')!;

    vi.spyOn(outsideBtn, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 } as DOMRect);
    vi.spyOn(modalBtn1, 'getBoundingClientRect').mockReturnValue({ left: 200, top: 200, right: 300, bottom: 240, width: 100, height: 40 } as DOMRect);
    vi.spyOn(modalBtn2, 'getBoundingClientRect').mockReturnValue({ left: 200, top: 260, right: 300, bottom: 300, width: 100, height: 40 } as DOMRect);

    modalBtn1.focus();

    const focusables = spatialNavigation.getFocusableElements(container);
    expect(focusables).toContain(modalBtn1);
    expect(focusables).toContain(modalBtn2);
    expect(focusables).not.toContain(outsideBtn);
  });

  it('saves and restores focus state across route transitions', () => {
    const container = document.createElement('div');
    container.innerHTML = `<button id="targetBtn">Target Button</button>`;
    document.body.appendChild(container);

    const targetBtn = document.getElementById('targetBtn')!;
    vi.spyOn(targetBtn, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 } as DOMRect);

    targetBtn.focus();
    spatialNavigation.saveFocusState('/home');

    // Simulate navigation away and focus loss
    document.body.focus();

    spatialNavigation.restoreFocusState('/home', container);
    expect(document.activeElement).toBe(targetBtn);
  });
});
