import { ICONS, type IconName } from './icons';

// DOM の小物（TD-0001 §1）。文字は textContent で入れる（innerHTML は使わない）

const SVG_NS = 'http://www.w3.org/2000/svg';

/** アイコンの SVG を作る。装飾なので読み上げない（意味は隣の文字で伝える） */
export function icon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICONS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** index.html の <span data-icon="名前"> を、そのアイコンの SVG に置き換える */
export function renderIcons(root: ParentNode = document): void {
  for (const holder of root.querySelectorAll<HTMLElement>('[data-icon]')) {
    holder.replaceWith(icon(holder.dataset.icon as IconName));
  }
}

/** 要素を作る */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; text?: string; attrs?: Record<string, string> } = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) element.setAttribute(name, value);
  element.append(...children);
  return element;
}
