import { ElementTarget, ObserverOptions, Dispose, SelectorHandlers, ElementChangeInfo } from './types';

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
 * Creates a debounced version of a function that delays its execution until after a specified time.
 * 
 * @param fn - The function to debounce
 * @param ms - The number of milliseconds to delay
 * @returns A debounced version of the input function
 */
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
    return undefined as ReturnType<T>;
  } as T;
}

/**
 * Creates a throttled version of a function that limits its execution frequency.
 * 
 * @param fn - The function to throttle
 * @param ms - The minimum number of milliseconds between function executions
 * @returns A throttled version of the input function
 */
function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();
    if (now - lastRun >= ms) {
      const result = fn.apply(this, args);
      lastRun = now;
      return result;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastRun = Date.now();
      }, ms - (now - lastRun));
      return undefined as ReturnType<T>;
    }
  } as T;
}

/**
 * Watches for elements being added to the DOM that match the specified target.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param onAdd - Callback function called when a matching element is added
 * @param options - Configuration options for the observer
 * @param options.root - The root element to observe (defaults to document)
 * @param options.subtree - Whether to observe the entire subtree (defaults to true)
 * @param options.debounce - Optional debounce time in milliseconds
 * @param options.throttle - Optional throttle time in milliseconds
 * @param options.once - Whether to stop observing after the first match (defaults to false)
 * @param options.signal - Optional AbortSignal to stop the observer
 * @returns A function to dispose of the observer
 * 
 * @example
 * ```typescript
 * const dispose = watchAdded('.my-class', (element) => {
 *   console.log('Element added:', element);
 * }, {
 *   debounce: 100,
 *   once: true
 * });
 * 
 * // Later: stop observing
 * dispose();
 * ```
 */
export function watchAdded(
  target: ElementTarget,
  onAdd: (el: Element) => void,
  options: ObserverOptions = {}
): Dispose {
  const {
    root = document,
    subtree = true,
    debounce: debounceMs,
    throttle: throttleMs,
    once = false,
    signal
  } = options;

  let callback = onAdd;
  if (debounceMs) {
    callback = debounce(onAdd, debounceMs) as typeof onAdd;
  } else if (throttleMs) {
    callback = throttle(onAdd, throttleMs) as typeof onAdd;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            if (matchesTarget(node, target)) {
              callback(node);
              if (once) {
                observer.disconnect();
                return;
              }
            }
            if (subtree && typeof target === 'string') {
              node.querySelectorAll(target).forEach((el) => {
                callback(el);
                if (once) {
                  observer.disconnect();
                  return;
                }
              });
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

  signal?.addEventListener('abort', () => observer.disconnect());

  return () => observer.disconnect();
}

/**
 * Watches for elements being removed from the DOM that match the specified target.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param onRemove - Callback function called when a matching element is removed
 * @param options - Configuration options for the observer
 * @param options.root - The root element to observe (defaults to document)
 * @param options.subtree - Whether to observe the entire subtree (defaults to true)
 * @param options.debounce - Optional debounce time in milliseconds
 * @param options.throttle - Optional throttle time in milliseconds
 * @param options.once - Whether to stop observing after the first match (defaults to false)
 * @param options.signal - Optional AbortSignal to stop the observer
 * @returns A function to dispose of the observer
 * 
 * @example
 * ```typescript
 * const dispose = watchRemoved('.my-class', (element) => {
 *   console.log('Element removed:', element);
 * }, {
 *   throttle: 100
 * });
 * ```
 */
export function watchRemoved(
  target: ElementTarget,
  onRemove: (el: Element) => void,
  options: ObserverOptions = {}
): Dispose {
  const {
    root = document,
    subtree = true,
    debounce: debounceMs,
    throttle: throttleMs,
    once = false,
    signal
  } = options;

  let callback = onRemove;
  if (debounceMs) {
    callback = debounce(onRemove, debounceMs) as typeof onRemove;
  } else if (throttleMs) {
    callback = throttle(onRemove, throttleMs) as typeof onRemove;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.removedNodes) {
          if (node instanceof Element) {
            if (matchesTarget(node, target)) {
              callback(node);
              if (once) {
                observer.disconnect();
                return;
              }
            }
            if (subtree && typeof target === 'string') {
              const matches = node.querySelectorAll(target);
              matches.forEach((el) => {
                callback(el);
                if (once) {
                  observer.disconnect();
                  return;
                }
              });
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

  signal?.addEventListener('abort', () => observer.disconnect());

  return () => observer.disconnect();
}

/**
 * Watches for modifications to elements that match the specified target.
 * This includes attribute changes, text content changes, and child element changes.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param onChange - Callback function called when a matching element is modified
 * @param options - Configuration options for the observer
 * @param options.root - The root element to observe (defaults to document)
 * @param options.subtree - Whether to observe the entire subtree (defaults to true)
 * @param options.attributes - Whether to watch for attribute changes or an array of specific attributes to watch
 * @param options.characterData - Whether to watch for text content changes (defaults to true)
 * @param options.childList - Whether to watch for child element changes (defaults to true)
 * @param options.debounce - Optional debounce time in milliseconds
 * @param options.throttle - Optional throttle time in milliseconds
 * @param options.once - Whether to stop observing after the first change (defaults to false)
 * @param options.signal - Optional AbortSignal to stop the observer
 * @returns A function to dispose of the observer
 * 
 * @example
 * ```typescript
 * const dispose = watchModified('.my-class', (element, change) => {
 *   if (change.attrs) {
 *     console.log('Attributes changed:', Array.from(change.attrs));
 *   }
 *   if (change.text) {
 *     console.log('Text content changed');
 *   }
 *   if (change.childList) {
 *     console.log('Child elements changed');
 *   }
 * }, {
 *   attributes: ['class', 'style'],
 *   characterData: true
 * });
 * ```
 */
export function watchModified(
  target: ElementTarget,
  onChange: (el: Element, change: ElementChangeInfo) => void,
  options: ObserverOptions = {}
): Dispose {
  const {
    root = document,
    subtree = true,
    attributes = true,
    characterData = true,
    childList = true,
    debounce: debounceMs,
    throttle: throttleMs,
    once = false,
    signal
  } = options;

  let callback = onChange;
  if (debounceMs) {
    callback = debounce(onChange, debounceMs) as typeof onChange;
  } else if (throttleMs) {
    callback = throttle(onChange, throttleMs) as typeof onChange;
  }

  const observer = new MutationObserver((records) => {
    const changes = new Map<Element, ElementChangeInfo>();

    for (const record of records) {
      const mutationTarget = record.target;
      if (!(mutationTarget instanceof Element)) continue;

      // Check if the target itself matches
      if (matchesTarget(mutationTarget, target)) {
        processChange(mutationTarget);
      }

      // Check subtree elements if enabled
      if (subtree && typeof target === 'string') {
        mutationTarget.querySelectorAll(target).forEach(processChange);
      }

      function processChange(element: Element) {
        let change = changes.get(element) || { records: [] };
        change.records.push(record);

        if (record.type === 'attributes') {
          change.attrs = change.attrs || new Set();
          change.attrs.add(record.attributeName!);
        } else if (record.type === 'characterData') {
          change.text = true;
        } else if (record.type === 'childList') {
          change.childList = true;
        }

        changes.set(element, change);
      }


    }

    changes.forEach((change, element) => {
      callback(element, change);
      if (once) observer.disconnect();
    });
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: Array.isArray(attributes) ? attributes : undefined,
    characterData,
    childList,
    subtree
  });

  signal?.addEventListener('abort', () => observer.disconnect());

  return () => observer.disconnect();
}

/**
 * A high-level function that combines watchAdded, watchRemoved, and watchModified into a single observer.
 * This is useful when you need to track multiple types of changes to elements matching a selector.
 * 
 * @param target - A selector string, Element, or predicate function to match elements against
 * @param handlers - Object containing callback functions for different types of changes
 * @param handlers.onEnter - Optional callback for when elements are added
 * @param handlers.onExit - Optional callback for when elements are removed
 * @param handlers.onChange - Optional callback for when elements are modified
 * @param options - Configuration options passed to all observers
 * @returns A function to dispose of all observers
 * 
 * @example
 * ```typescript
 * const dispose = watchSelector('.my-class', {
 *   onEnter: (element) => console.log('Element added:', element),
 *   onExit: (element) => console.log('Element removed:', element),
 *   onChange: (element, change) => console.log('Element modified:', element, change)
 * }, {
 *   debounce: 100,
 *   attributes: ['class', 'data-status']
 * });
 * 
 * // Later: stop all observers
 * dispose();
 * ```
 */
export function watchSelector(
  target: ElementTarget,
  handlers: SelectorHandlers,
  options: ObserverOptions = {}
): Dispose {
  const disposers: Dispose[] = [];

  if (handlers.onEnter) {
    disposers.push(watchAdded(target, handlers.onEnter, options));
  }

  if (handlers.onExit) {
    disposers.push(watchRemoved(target, handlers.onExit, options));
  }

  if (handlers.onChange) {
    disposers.push(watchModified(target, handlers.onChange, options));
  }

  return () => disposers.forEach(dispose => dispose());
}