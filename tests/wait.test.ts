import { waitFor, waitForRemoved, waitForChange } from '../wait';

describe('Wait Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('waitFor', () => {
    it('should resolve when element is added', async () => {
      const promise = waitFor('.test-element');
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);
      const result = await promise;
      expect(result).toBe(el);
    });

    it('should resolve immediately if element exists', async () => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);
      const result = await waitFor('.test-element');
      expect(result).toBe(el);
    });

    it('should reject on timeout', async () => {
      await expect(waitFor('.test-element', { timeout: 100 }))
        .rejects
        .toThrow('Operation timed out after 100ms');
    });
  });

  describe('waitForRemoved', () => {
    it('should resolve when element is removed', async () => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);
      
      const promise = waitForRemoved('.test-element');
      el.remove();
      await promise;
      expect(document.querySelector('.test-element')).toBeNull();
    });

    it('should reject on timeout', async () => {
      await expect(waitForRemoved('.test-element', { timeout: 100 }))
        .rejects
        .toThrow('Operation timed out after 100ms');
    });
  });

  describe('waitForChange', () => {
    it('should resolve when element changes according to predicate', async () => {
      const el = document.createElement('div');
      el.className = 'test-element';
      document.body.appendChild(el);

      const promise = waitForChange('.test-element', (records) => {
        return records.some(r => r.type === 'attributes' && r.attributeName === 'data-test');
      });

      el.setAttribute('data-test', 'value');
      const records = await promise;
      expect(records[0].type).toBe('attributes');
      expect(records[0].attributeName).toBe('data-test');
    });

    it('should reject on timeout', async () => {
      await expect(waitForChange('.test-element', () => true, { timeout: 100 }))
        .rejects
        .toThrow('Operation timed out after 100ms');
    });
  });
});