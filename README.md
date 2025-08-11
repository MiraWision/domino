# Domino

A lightweight DOM utilities library for Chrome Extension content scripts, focusing on waiting for elements, observing DOM changes, and modifying existing elements with a clean, performant API.

## Features

- 🔍 Wait for elements to appear, disappear, or change
- 👀 Observe DOM mutations with built-in filtering
- 🛠 Modify elements with simple, safe utilities
- ⚡️ Optimized for Chrome Extension content scripts
- 📦 Tiny footprint with zero dependencies
- 🔒 TypeScript support with full type definitions

## Installation

```bash
npm install domino
```

## Usage

### Wait Utilities

```typescript
import { waitFor, waitForRemoved, waitForChange } from 'domino';

// Wait for element to appear
const element = await waitFor('.my-selector');

// Wait for element to be removed
await waitForRemoved('.my-selector');

// Wait for specific change
const changes = await waitForChange('.my-selector', 
  records => records.some(r => r.type === 'attributes')
);
```

### Observer Utilities

```typescript
import { watchAdded, watchRemoved, watchModified, watchSelector } from 'domino';

// Watch for added elements
const dispose = watchAdded('.my-selector', element => {
  console.log('Element added:', element);
});

// Watch for removed elements
watchRemoved('.my-selector', element => {
  console.log('Element removed:', element);
});

// Watch for modifications
watchModified('.my-selector', (element, change) => {
  if (change.attrs) console.log('Attributes changed:', change.attrs);
  if (change.text) console.log('Text changed');
  if (change.childList) console.log('Children changed');
});

// Combined observer
watchSelector('.my-selector', {
  onEnter: element => console.log('Added:', element),
  onExit: element => console.log('Removed:', element),
  onChange: (element, change) => console.log('Changed:', change)
});
```

### Element Utilities

```typescript
import { setClasses, setAttributes, setText, setHTML } from 'domino';

// Modify classes
setClasses(element, {
  add: ['class-1', 'class-2'],
  remove: ['old-class']
});

// Set/remove attributes
setAttributes(element, {
  'data-value': '123',
  'aria-label': 'Description',
  'disabled': undefined // removes attribute
});

// Set text content
setText(element, 'Hello World');

// Set HTML content (with optional sanitization)
setHTML(element, '<span>Content</span>', {
  sanitize: html => sanitizeHtml(html)
});
```

## API Reference

### Wait Utilities

#### `waitFor(target, options?)`
Wait for an element matching the target to appear in the DOM.

#### `waitForRemoved(target, options?)`
Wait for an element matching the target to be removed from the DOM.

#### `waitForChange(target, predicate, options?)`
Wait for a change matching the predicate on the target element.

Common Options:
```typescript
{
  root?: Node;           // Observation root, default: document
  timeout?: number;      // ms, reject if exceeded
  signal?: AbortSignal;  // Cancelable
  subtree?: boolean;     // Observe descendants
}
```

### Observer Utilities

#### `watchAdded(target, onAdd, options?)`
Observe added elements matching the target.

#### `watchRemoved(target, onRemove, options?)`
Observe removed elements matching the target.

#### `watchModified(target, onChange, options?)`
Observe changes to elements matching the target.

#### `watchSelector(target, handlers, options?)`
Combined observer for element entry, exit, and modification.

Common Options:
```typescript
{
  root?: Node;
  subtree?: boolean;        // default: true
  attributes?: true | string[];
  characterData?: boolean;
  childList?: boolean;      // default: true
  debounce?: number;
  throttle?: number;
  once?: boolean;
  signal?: AbortSignal;
}
```

### Element Utilities

#### `setClasses(element, { add?, remove? })`
Add and/or remove CSS classes.

#### `setAttributes(element, attributes)`
Set or remove attributes.

#### `setText(element, text)`
Set text content.

#### `setHTML(element, html, options?)`
Set HTML content with optional sanitization.

## License

MIT