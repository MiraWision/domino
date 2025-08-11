import { watchAdded, watchRemoved, watchModified, watchSelector } from '../src/observer';

describe('Observer Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('watchAdded', () => {
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
        expect(removedEl).toBe(el);
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
        expect(modifiedEl).toBe(el);
        expect(change.attrs?.has('data-test')).toBe(true);
        done();
      });

      el.setAttribute('data-test', 'value');
    });

    it('should detect text changes', (done) => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      watchModified('.test-element', (modifiedEl, change) => {
        expect(modifiedEl).toBe(el);
        expect(change.text).toBe(true);
        done();
      });

      el.textContent = 'new text';
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
        },
        onChange: () => {
          changeCalled = true;
        },
        onExit: () => {
          removeCalled = true;
          expect(addCalled).toBe(true);
          expect(changeCalled).toBe(true);
          expect(removeCalled).toBe(true);
          done();
        }
      });

      document.body.appendChild(el);
      el.setAttribute('data-test', 'value');
      el.remove();
    });
  });
});