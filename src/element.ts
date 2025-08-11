import { HTMLOptions } from './types';

export function setClasses(el: Element, { add = [], remove = [] }: { add?: string[]; remove?: string[] }): void {
  if (add.length > 0) {
    el.classList.add(...add);
  }
  if (remove.length > 0) {
    el.classList.remove(...remove);
  }
}

export function setAttributes(el: Element, attrs: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  }
}

export function setText(el: Element, text: string): void {
  el.textContent = text;
}

export function setHTML(el: Element, html: string, options: HTMLOptions = {}): void {
  const { sanitize } = options;
  el.innerHTML = sanitize ? sanitize(html) : html;
}