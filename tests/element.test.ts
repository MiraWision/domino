import { setClasses, setAttributes, setText, setHTML } from '../src/element';

describe('Element Utilities', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  describe('setClasses', () => {
    it('should add and remove classes', () => {
      setClasses(element, {
        add: ['class1', 'class2'],
        remove: []
      });
      expect(element.classList.contains('class1')).toBe(true);
      expect(element.classList.contains('class2')).toBe(true);

      setClasses(element, {
        add: ['class3'],
        remove: ['class1']
      });
      expect(element.classList.contains('class1')).toBe(false);
      expect(element.classList.contains('class2')).toBe(true);
      expect(element.classList.contains('class3')).toBe(true);
    });
  });

  describe('setAttributes', () => {
    it('should set and remove attributes', () => {
      setAttributes(element, {
        'data-test': 'value',
        'aria-label': 'label'
      });
      expect(element.getAttribute('data-test')).toBe('value');
      expect(element.getAttribute('aria-label')).toBe('label');

      setAttributes(element, {
        'data-test': undefined,
        'aria-label': 'new-label'
      });
      expect(element.hasAttribute('data-test')).toBe(false);
      expect(element.getAttribute('aria-label')).toBe('new-label');
    });
  });

  describe('setText', () => {
    it('should set text content', () => {
      setText(element, 'Hello World');
      expect(element.textContent).toBe('Hello World');

      setText(element, '');
      expect(element.textContent).toBe('');
    });
  });

  describe('setHTML', () => {
    it('should set inner HTML', () => {
      setHTML(element, '<span>Hello</span>');
      expect(element.innerHTML).toBe('<span>Hello</span>');
    });

    it('should use sanitizer when provided', () => {
      const sanitize = (html: string) => html.replace(/<script>.*<\/script>/g, '');
      setHTML(
        element,
        '<div>Safe</div><script>alert("unsafe")</script>',
        { sanitize }
      );
      expect(element.innerHTML).toBe('<div>Safe</div>');
    });
  });
});