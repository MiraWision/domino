export type ElementTarget = string | Element | ((el: Element) => boolean);

export interface BaseOptions {
  root?: Element | Document;
  timeout?: number;
  signal?: AbortSignal;
  subtree?: boolean;
}

export interface WaitOptions extends BaseOptions {}

export interface ObserverOptions extends BaseOptions {
  attributes?: boolean | string[];
  characterData?: boolean;
  childList?: boolean;
  debounce?: number;
  throttle?: number;
  once?: boolean;
}

export interface ElementChangeInfo {
  attrs?: Set<string>;
  text?: boolean;
  childList?: boolean;
  records: MutationRecord[];
}

export interface SelectorHandlers {
  onEnter?: (el: Element) => void;
  onExit?: (el: Element) => void;
  onChange?: (el: Element, change: ElementChangeInfo) => void;
}

export type Dispose = () => void;

export interface HTMLOptions {
  sanitize?: (html: string) => string;
}