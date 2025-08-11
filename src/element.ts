import { HTMLOptions } from './types';

/**
 * Updates the class list of a DOM element by adding and/or removing specified classes.
 * 
 * @param el - The DOM element to update classes on
 * @param options - Object containing classes to add and/or remove
 * @param options.add - Array of class names to add to the element
 * @param options.remove - Array of class names to remove from the element
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.my-element');
 * setClasses(element, { 
 *   add: ['active', 'visible'], 
 *   remove: ['hidden'] 
 * });
 * ```
 */
export function setClasses(el: Element, { add = [], remove = [] }: { add?: string[]; remove?: string[] }): void {
  if (add.length > 0) {
    el.classList.add(...add);
  }
  if (remove.length > 0) {
    el.classList.remove(...remove);
  }
}

/**
 * Sets or removes attributes on a DOM element.
 * If an attribute value is undefined, the attribute will be removed.
 * 
 * @param el - The DOM element to update attributes on
 * @param attrs - Object mapping attribute names to their values
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.my-element');
 * setAttributes(element, {
 *   'aria-label': 'Close button',
 *   'disabled': undefined // This will remove the disabled attribute
 * });
 * ```
 */
export function setAttributes(el: Element, attrs: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  }
}

/**
 * Sets the text content of a DOM element.
 * This is safer than setting innerHTML as it automatically escapes HTML.
 * 
 * @param el - The DOM element to update text content on
 * @param text - The text content to set
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.my-element');
 * setText(element, 'Hello World!');
 * ```
 */
export function setText(el: Element, text: string): void {
  el.textContent = text;
}

/**
 * Sets the HTML content of a DOM element with optional sanitization.
 * 
 * @param el - The DOM element to update HTML content on
 * @param html - The HTML string to set
 * @param options - Configuration options
 * @param options.sanitize - Optional function to sanitize the HTML string before setting
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.my-element');
 * setHTML(element, '<p>Hello <strong>World!</strong></p>', {
 *   sanitize: (html) => DOMPurify.sanitize(html)
 * });
 * ```
 */
export function setHTML(el: Element, html: string, options: HTMLOptions = {}): void {
  const { sanitize } = options;
  el.innerHTML = sanitize ? sanitize(html) : html;
}