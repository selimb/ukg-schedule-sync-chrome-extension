/** Wraps the date display element. */
export class DateDisplay {
  public readonly $element: Element;

  constructor(element: Element) {
    this.$element = element;
  }

  static find(): DateDisplay | undefined {
    const $elem = document.getElementById("myschedule.dateDisplay");
    return $elem ? new DateDisplay($elem) : undefined;
  }

  getMonth(): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- False positive...
    const text = this.$element.textContent?.trim();
    return text || undefined;
  }
}
