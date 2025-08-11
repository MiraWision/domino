import { ElementTarget, WaitOptions } from './types';

/** Default timeout in milliseconds for wait operations */
const DefaultTimeout = 10000;

/**
 * Type guard to check if a target is a string selector or Element.
 * 
 * @param target - The target to check
 * @returns True if the target is a string or Element
 */
function isElementTarget(target: ElementTarget): target is string | Element {
  return typeof target === 'string' || target instanceof Element;
}

/**
 * Internal utility to check if an element matches a target specification.
 * 
 * @param el - The DOM element to check
 * @param target - The target to match against (selector string, Element, or predicate function)
 * @returns True if the element matches the target
 */
function matchesTarget(el: Element, target: ElementTarget): boolean {
  if (typeof target === 'string') {
    return el.matches(target);
  } else if (target instanceof Element) {
    return el === target;
  } else {
    return target(el);
  }
}

/**
 * Creates a Promise that rejects after a specified timeout.
 * 
 * @param ms - The timeout in milliseconds
 * @returns A Promise that rejects with a timeout error
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

/**
 * Waits for an element matching the target to appear in the DOM.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param options - Configuration options
 * @param options.root - The root element to observe (defaults to document)
 * @param options.timeout - Maximum time to wait in milliseconds (defaults to 10000)
 * @param options.signal - Optional AbortSignal to cancel the wait
 * @param options.subtree - Whether to observe the entire subtree (defaults to true)
 * @returns Promise that resolves with the matching element
 * 
 * @example
 * ```typescript
 * // Wait for element by selector
 * const element = await waitFor('.my-class');
 * 
 * // Wait with timeout and abort signal
 * const controller = new AbortController();
 * const element = await waitFor('.my-class', {
 *   timeout: 5000,
 *   signal: controller.signal
 * });
 * ```
 * 
 * @throws {Error} If the operation times out or is aborted
 */
export function waitFor(target: ElementTarget, options: WaitOptions = {}): Promise<Element> {
  const {
    root = document,
    timeout = DefaultTimeout,
    signal,
    subtree = true
  } = options;

  // Check if element already exists
  if (isElementTarget(target)) {
    const existing = subtree
      ? root.querySelector(target.toString())
      : root === document
        ? document.querySelector(target.toString())
        : null;
    if (existing) return Promise.resolve(existing);
  }

  return Promise.race([
    new Promise<Element>((resolve, reject) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node instanceof Element) {
                if (matchesTarget(node, target)) {
                  observer.disconnect();
                  resolve(node);
                  return;
                }
                if (subtree) {
                  const match = node.querySelector(target.toString());
                  if (match) {
                    observer.disconnect();
                    resolve(match);
                    return;
                  }
                }
              }
            }
          }
        }
      });

      observer.observe(root, {
        childList: true,
        subtree
      });

      signal?.addEventListener('abort', () => {
        observer.disconnect();
        reject(new Error('Operation was aborted'));
      });
    }),
    createTimeoutPromise(timeout)
  ]);
}

/**
 * Waits for an element matching the target to be removed from the DOM.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param options - Configuration options
 * @param options.root - The root element to observe (defaults to document)
 * @param options.timeout - Maximum time to wait in milliseconds (defaults to 10000)
 * @param options.signal - Optional AbortSignal to cancel the wait
 * @param options.subtree - Whether to observe the entire subtree (defaults to true)
 * @returns Promise that resolves when the element is removed
 * 
 * @example
 * ```typescript
 * // Wait for element to be removed
 * await waitForRemoved('.loading-spinner');
 * 
 * // Wait with custom timeout
 * await waitForRemoved('.my-class', {
 *   timeout: 3000
 * });
 * ```
 * 
 * @throws {Error} If the operation times out or is aborted
 */
export function waitForRemoved(target: ElementTarget, options: WaitOptions = {}): Promise<void> {
  const {
    root = document,
    timeout = DefaultTimeout,
    signal,
    subtree = true
  } = options;

  return Promise.race([
    new Promise<void>((resolve, reject) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.removedNodes) {
              if (node instanceof Element && matchesTarget(node, target)) {
                observer.disconnect();
                resolve();
                return;
              }
            }
          }
        }
      });

      observer.observe(root, {
        childList: true,
        subtree
      });

      signal?.addEventListener('abort', () => {
        observer.disconnect();
        reject(new Error('Operation was aborted'));
      });
    }),
    createTimeoutPromise(timeout)
  ]);
}

/**
 * Waits for a specific change to occur on elements matching the target.
 * The change is determined by a predicate function that evaluates mutation records.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param predicate - Function that evaluates mutation records to determine if the desired change occurred
 * @param options - Configuration options
 * @param options.root - The root element to observe (defaults to document)
 * @param options.timeout - Maximum time to wait in milliseconds (defaults to 10000)
 * @param options.signal - Optional AbortSignal to cancel the wait
 * @param options.subtree - Whether to observe the entire subtree (defaults to true)
 * @returns Promise that resolves with the mutation records when the predicate returns true
 * 
 * @example
 * ```typescript
 * // Wait for a specific attribute to change
 * const records = await waitForChange('.my-class', 
 *   (records) => records.some(r => r.attributeName === 'data-status')
 * );
 * 
 * // Wait for text content to contain specific text
 * const records = await waitForChange('.my-class', 
 *   (records) => records.some(r => {
 *     const node = r.target as Element;
 *     return node.textContent?.includes('Ready');
 *   })
 * );
 * ```
 * 
 * @throws {Error} If the operation times out or is aborted
 */
export function waitForChange(
  target: ElementTarget,
  predicate: (records: MutationRecord[]) => boolean,
  options: WaitOptions = {}
): Promise<MutationRecord[]> {
  const {
    root = document,
    timeout = DefaultTimeout,
    signal,
    subtree = true
  } = options;

  return Promise.race([
    new Promise<MutationRecord[]>((resolve, reject) => {
      const observer = new MutationObserver((records) => {
        const relevantRecords = records.filter(record => {
          const node = record.target;
          return node instanceof Element && matchesTarget(node, target);
        });

        if (relevantRecords.length > 0 && predicate(relevantRecords)) {
          observer.disconnect();
          resolve(relevantRecords);
        }
      });

      observer.observe(root, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree
      });

      signal?.addEventListener('abort', () => {
        observer.disconnect();
        reject(new Error('Operation was aborted'));
      });
    }),
    createTimeoutPromise(timeout)
  ]);
}