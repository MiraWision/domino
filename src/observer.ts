import { ElementTarget, ObserverOptions, Dispose, SelectorHandlers, ElementChangeInfo } from './types';


function matchesTarget(el: Element, target: ElementTarget): boolean {
  if (typeof target === 'string') {
    return el.matches(target);
  } else if (target instanceof Element) {
    return el === target;
  } else {
    return target(el);
  }
}

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeoutId: number;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
    return undefined as ReturnType<T>;
  } as T;
}

function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let lastRun = 0;
  let timeoutId: number;
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
            if (subtree) {
              node.querySelectorAll(target.toString()).forEach((el) => {
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
            if (subtree) {
              const matches = node.querySelectorAll(target.toString());
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