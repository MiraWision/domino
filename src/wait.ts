import { ElementTarget, WaitOptions } from './types';

const DefaultTimeout = 10000;

function isElementTarget(target: ElementTarget): target is string | Element {
  return typeof target === 'string' || target instanceof Element;
}

function matchesTarget(el: Element, target: ElementTarget): boolean {
  if (typeof target === 'string') {
    return el.matches(target);
  } else if (target instanceof Element) {
    return el === target;
  } else {
    return target(el);
  }
}

function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

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