# @mirawision/domino

A lightweight DOM utilities library for Chrome Extension content scripts, `@mirawision/domino` provides a comprehensive set of tools for waiting for elements, observing DOM changes, and modifying existing elements with a clean, performant API.

[Demo and advanced Documentation can be found here!](https://mirawision.github.io/domino)

## Features

### Wait Utilities
- **Element Waiting**: Wait for elements to appear, disappear, or change in the DOM
- **Flexible Targeting**: Match elements by selector, reference, or custom predicate
- **Timeout Control**: Built-in timeout handling with customizable durations
- **Cancellation Support**: Abort operations using standard AbortController

### Observer Utilities
- **DOM Mutation Tracking**: Watch for element additions, removals, and modifications
- **Filtered Observation**: Built-in filtering for specific mutation types
- **Performance Controls**: Debounce and throttle support for callbacks
- **Resource Management**: Automatic cleanup and memory management

### Element Utilities
- **Class Management**: Add and remove CSS classes with a clean API
- **Attribute Handling**: Set, update, and remove element attributes
- **Content Updates**: Safe text and HTML content manipulation
- **Sanitization Support**: Optional HTML content sanitization

### Key Benefits
- **Chrome Extension Ready**: Optimized for content script environments
- **Zero Dependencies**: Tiny footprint for fast loading
- **TypeScript Support**: Full type definitions included
- **Memory Efficient**: Automatic resource cleanup

## Installation

```bash
npm install @mirawision/domino
```

or

```bash
yarn add @mirawision/domino
```

## Usage

Here's a quick overview of how to use some of the core functionalities of @mirawision/domino:

### Wait for Elements

```typescript
import { waitFor, waitForRemoved } from '@mirawision/domino';

// Wait for element to appear
const element = await waitFor('.my-selector', {
  timeout: 5000,  // 5 seconds timeout
  subtree: true   // search in descendants
});

// Wait for element to be removed
await waitForRemoved('.my-selector');

// Wait with abort signal
const controller = new AbortController();
const element = await waitFor('.my-selector', {
  signal: controller.signal
});

// Later: abort the wait
controller.abort();
```

### Observe DOM Changes

```typescript
import { watchSelector } from '@mirawision/domino';

// Watch for all types of changes
const dispose = watchSelector('.my-selector', {
  onEnter: element => {
    console.log('Element added:', element);
  },
  onExit: element => {
    console.log('Element removed:', element);
  },
  onChange: (element, change) => {
    if (change.attrs) {
      console.log('Attributes changed:', Array.from(change.attrs));
    }
    if (change.text) {
      console.log('Text content changed');
    }
  }
}, {
  debounce: 100,  // debounce callbacks
  attributes: ['class', 'data-status']  // watch specific attributes
});

// Later: stop observing
dispose();
```

### Modify Elements

```typescript
import { setClasses, setAttributes, setText, setHTML } from '@mirawision/domino';

// Manage CSS classes
setClasses(element, {
  add: ['active', 'visible'],
  remove: ['hidden', 'disabled']
});

// Handle attributes
setAttributes(element, {
  'aria-label': 'Close dialog',
  'data-status': 'ready',
  'disabled': undefined  // remove attribute
});

// Update content safely
setText(element, 'Hello World!');  // escapes HTML
setHTML(element, '<strong>Important</strong>', {
  sanitize: html => DOMPurify.sanitize(html)
});
```

## API Reference

### Wait Functions

#### `waitFor(target, options?)`
```typescript
function waitFor(
  target: string | Element | ((el: Element) => boolean),
  options?: {
    root?: Element | Document;     // Root element to observe
    timeout?: number;              // Timeout in milliseconds
    signal?: AbortSignal;         // For cancellation
    subtree?: boolean;            // Search in descendants
  }
): Promise<Element>
```

#### `waitForRemoved(target, options?)`
```typescript
function waitForRemoved(
  target: string | Element | ((el: Element) => boolean),
  options?: {
    root?: Element | Document;
    timeout?: number;
    signal?: AbortSignal;
    subtree?: boolean;
  }
): Promise<void>
```

#### `waitForChange(target, predicate, options?)`
```typescript
function waitForChange(
  target: string | Element | ((el: Element) => boolean),
  predicate: (records: MutationRecord[]) => boolean,
  options?: {
    root?: Element | Document;
    timeout?: number;
    signal?: AbortSignal;
    subtree?: boolean;
  }
): Promise<MutationRecord[]>
```

### Observer Functions

#### `watchSelector(target, handlers, options?)`
```typescript
function watchSelector(
  target: string | Element | ((el: Element) => boolean),
  handlers: {
    onEnter?: (el: Element) => void;
    onExit?: (el: Element) => void;
    onChange?: (el: Element, change: {
      attrs?: Set<string>;
      text?: boolean;
      childList?: boolean;
      records: MutationRecord[];
    }) => void;
  },
  options?: {
    root?: Element | Document;
    subtree?: boolean;
    attributes?: boolean | string[];
    characterData?: boolean;
    childList?: boolean;
    debounce?: number;
    throttle?: number;
    once?: boolean;
    signal?: AbortSignal;
  }
): () => void
```

### Element Functions

#### `setClasses(element, options)`
```typescript
function setClasses(
  element: Element,
  options: {
    add?: string[];
    remove?: string[];
  }
): void
```

#### `setAttributes(element, attributes)`
```typescript
function setAttributes(
  element: Element,
  attributes: Record<string, string | undefined>
): void
```

#### `setText(element, text)`
```typescript
function setText(
  element: Element,
  text: string
): void
```

#### `setHTML(element, html, options?)`
```typescript
function setHTML(
  element: Element,
  html: string,
  options?: {
    sanitize?: (html: string) => string;
  }
): void
```

## Contributing

Contributions are always welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License.