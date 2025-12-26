/**
 * Find the editable comment field within a form
 */
export function findEditableField(form: Element | null): HTMLElement | null {
  return form?.querySelector<HTMLElement>('div[contenteditable="true"]') || null;
}
