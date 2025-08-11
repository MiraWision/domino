import { watchAdded, watchRemoved, watchModified, watchSelector } from '../src/observer';
import { ElementChangeInfo } from '../src/types';

function verifyChange(change: ElementChangeInfo, expected: { attrs?: string[], text?: boolean, childList?: boolean }): void {
  // Only verify the properties that are expected
  if (expected.attrs) {
    expect(change.attrs).toBeDefined();
    for (const attr of expected.attrs) {
      expect(change.attrs!.has(attr)).toBe(true);
    }
  }
  if (expected.text !== undefined) {
    expect(change.text).toBe(expected.text);
  }
  if (expected.childList !== undefined) {
    expect(change.childList).toBe(expected.childList);
  }
}

describe('Observer Utilities', () => {
  // Increase timeout for all tests
  jest.setTimeout(30000);
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('watchAdded', () => {
    it('should support function predicate', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      el.setAttribute('data-special', 'true');

      watchAdded(
        (element) => element.hasAttribute('data-special'),
        (matchedEl) => {
          expect(matchedEl.tagName).toBe(el.tagName);
          done();
        }
      );

      document.body.appendChild(el);
    });

    it('should support Element target', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      
      watchAdded(el, (matchedEl) => {
        expect(matchedEl).toStrictEqual(el);
        done();
      });

      document.body.appendChild(el);
    });

    it('should handle root option', (done) => {
      const root = document.createElement('div');
      document.body.appendChild(root);
      
      const el = document.createElement('div');
      el.className = 'test-element';

      watchAdded('.test-element', (matchedEl) => {
        expect(matchedEl).toStrictEqual(el);
        done();
      }, { root });

      root.appendChild(el);
    });
    it('should call callback when matching element is added', (done) => {
      watchAdded('.test-element', (el) => {
        expect(el.className).toBe('test-element');
        done();
      });

      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);
    });

    it('should support once option', (done) => {
      let callCount = 0;
      watchAdded('.test-element', () => {
        callCount++;
        if (callCount > 1) {
          throw new Error('Should only be called once');
        }
        setTimeout(() => {
          expect(callCount).toBe(1);
          done();
        }, 100);
      }, { once: true });

      const el1 = document.createElement('div');
      el1.className = 'test-element';
      document.body.appendChild(el1);

      const el2 = document.createElement('div');
      el2.className = 'test-element';
      document.body.appendChild(el2);
    });
  });

  describe('watchRemoved', () => {
    it('should call callback when matching element is removed', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      watchRemoved('.test-element', (removedEl) => {
        expect(removedEl.tagName).toBe(el.tagName);
        done();
      });

      el.remove();
    });
  });

  describe('watchModified', () => {
    it('should detect attribute changes', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      watchModified('.test-element', (modifiedEl, change) => {
        expect(change.attrs).toBeDefined();
        expect(change.attrs!.has('data-test')).toBe(true);
        done();
      });

      el.setAttribute('data-test', 'value');
    });

    it('should detect text changes', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      watchModified('.test-element', (modifiedEl, change) => {
        expect(change.text).toBe(true);
        done();
      });

      el.textContent = 'new text';
    });
  });

  describe('watchModified', () => {
    it('should handle attribute filter option', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      let triggered = false;
      watchModified('.test-element', (modifiedEl, change) => {
        if (triggered) return; // Prevent multiple callbacks
        triggered = true;
        
        expect(change.attrs).toBeDefined();
        expect(change.attrs!.has('data-test')).toBe(true);
        done();
      }, {
        attributes: ['data-test']
      });

      // First set the class (should not trigger)
      el.setAttribute('class', 'new-class');
      
      // Then set data-test (should trigger)
      setTimeout(() => {
        el.setAttribute('data-test', 'value');
      }, 10);
    });

    it('should handle childList changes', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      let triggered = false;
      watchModified('.test-element', (modifiedEl, change) => {
        if (triggered) return; // Prevent multiple callbacks
        triggered = true;
        
        verifyChange(change, { childList: true });
        done();
      });

      // Add a child element
      setTimeout(() => {
        const child = document.createElement('span');
        el.appendChild(child);
      }, 10);
    });

    it('should support signal for cleanup', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);
      
      const controller = new AbortController();
      let callCount = 0;

      watchModified('.test-element', (modifiedEl, change) => {
        callCount++;
        expect(change.attrs).toBeDefined();
        expect(change.attrs!.has('data-test')).toBe(true);
      }, {
        signal: controller.signal
      });

      // First modification
      el.setAttribute('data-test', 'first');
      
      // Wait for first modification to be processed
      setTimeout(() => {
        // Abort after first modification
        controller.abort();
        
        // Second modification (should not trigger callback)
        el.setAttribute('data-test', 'second');
        
        // Wait for potential callback
        setTimeout(() => {
          expect(callCount).toBe(1);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('watchSelector', () => {
    it('should combine multiple observers', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      
      let addCalled = false;
      let changeCalled = false;
      let removeCalled = false;

      watchSelector('.test-element', {
        onEnter: () => {
          addCalled = true;
          // After element is added, trigger the attribute change
          setTimeout(() => {
            el.setAttribute('data-test', 'value');
          }, 10);
        },
        onChange: (modifiedEl, change) => {
          changeCalled = true;
          expect(change.attrs).toBeDefined();
        expect(change.attrs!.has('data-test')).toBe(true);
          // After attribute is changed, remove the element
          setTimeout(() => {
            el.remove();
          }, 10);
        },
        onExit: () => {
          removeCalled = true;
          expect(addCalled).toBe(true);
          expect(changeCalled).toBe(true);
          expect(removeCalled).toBe(true);
          done();
        }
      });

      // Start the sequence by adding the element
      document.body.appendChild(el);
    });
  });
});