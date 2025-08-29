import type { DateDisplay } from "./date-display";

export class ExtensionBadge {
  public readonly $element: Element;

  constructor(element: Element) {
    this.$element = element;
  }

  static insert(dateDisplay: DateDisplay): ExtensionBadge {
    const $badge = document.createElement("span");
    dateDisplay.$element.parentElement?.append($badge);
    const self = new ExtensionBadge($badge);
    self.update(dateDisplay);
    return self;
  }

  destroy(): void {
    this.$element.remove();
  }

  update(dateDisplay: DateDisplay): void {
    this.$element.textContent = `🍪 🍪 🌀 ${dateDisplay.getMonth()}`;
  }
}
