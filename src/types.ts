/**
 * Represents a target for element matching. Can be:
 * - A CSS selector string
 * - A DOM Element to match exactly
 * - A predicate function that evaluates elements
 */
export type ElementTarget = string | Element | ((el: Element) => boolean);

/**
 * Base configuration options shared by wait and observe operations.
 */
export interface BaseOptions {
  /** Root element to start observing from. Defaults to document. */
  root?: Element | Document;
  /** Maximum time to wait in milliseconds. Defaults to 10000. */
  timeout?: number;
  /** AbortSignal to cancel the operation. */
  signal?: AbortSignal;
  /** Whether to observe the entire subtree. Defaults to true. */
  subtree?: boolean;
}

/**
 * Options for wait operations. Currently same as BaseOptions.
 */
export interface WaitOptions extends BaseOptions {}

/**
 * Extended options for observer operations.
 */
export interface ObserverOptions extends BaseOptions {
  /** Whether to observe attribute changes. Can be boolean or array of specific attributes. */
  attributes?: boolean | string[];
  /** Whether to observe text content changes. */
  characterData?: boolean;
  /** Whether to observe child element changes. */
  childList?: boolean;
  /** Debounce time in milliseconds for the callback. */
  debounce?: number;
  /** Throttle time in milliseconds for the callback. */
  throttle?: number;
  /** Whether to stop observing after first match. */
  once?: boolean;
}

/**
 * Information about changes detected on an element.
 */
export interface ElementChangeInfo {
  /** Set of attribute names that changed. */
  attrs?: Set<string>;
  /** Whether text content changed. */
  text?: boolean;
  /** Whether child elements changed. */
  childList?: boolean;
  /** Raw mutation records that triggered the change. */
  records: MutationRecord[];
}

/**
 * Handlers for different types of element events.
 */
export interface SelectorHandlers {
  /** Called when a matching element is added to the DOM. */
  onEnter?: (el: Element) => void;
  /** Called when a matching element is removed from the DOM. */
  onExit?: (el: Element) => void;
  /** Called when a matching element is modified. */
  onChange?: (el: Element, change: ElementChangeInfo) => void;
}

/**
 * Function to stop observing and clean up resources.
 */
export type Dispose = () => void;

/**
 * Options for HTML content manipulation.
 */
export interface HTMLOptions {
  /** Optional function to sanitize HTML content before setting. */
  sanitize?: (html: string) => string;
}