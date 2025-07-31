/**
 * UI component builders for LinkedIn comment history interface
 */

import {
  applyButtonHoverEffects,
  baseStyles,
  buttonStyles,
  setButtonDisabled,
} from "./ui-styles";

/**
 * Creates the main container for the metrics interface
 */
export function createMainContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = "custom-linkedin-metrics";

  Object.assign(container.style, baseStyles.container);

  return container;
}

/**
 * Creates a row container for buttons and controls
 */
export function createRow(): HTMLDivElement {
  const row = document.createElement("div");
  Object.assign(row.style, baseStyles.row);
  return row;
}

/**
 * Creates a date row container
 */
export function createDateRow(): HTMLDivElement {
  const row = document.createElement("div");
  Object.assign(row.style, baseStyles.dateRow);
  return row;
}

/**
 * Creates a three-column row container
 */
export function createThreeColumnRow(): HTMLDivElement {
  const row = document.createElement("div");
  Object.assign(row.style, baseStyles.threeColumnRow);
  return row;
}

/**
 * Creates a column container for multi-column layout
 */
export function createColumn(): HTMLDivElement {
  const column = document.createElement("div");
  column.style.display = "flex";
  column.style.flexDirection = "column";
  column.style.gap = "8px";
  return column;
}

/**
 * Creates a scroll top column that spans 2 rows
 */
export function createScrollTopColumn(): HTMLDivElement {
  const column = document.createElement("div");
  Object.assign(column.style, baseStyles.scrollTopColumn);
  return column;
}

/**
 * Creates a styled button with hover effects
 */
export function createButton(
  text: string,
  variant: keyof typeof buttonStyles = "primary",
): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  button.tabIndex = 0;

  Object.assign(button.style, buttonStyles[variant]);
  applyButtonHoverEffects(button);

  return button;
}

/**
 * Creates a styled input field
 */
export function createInput(
  type: string = "text",
  placeholder?: string,
  defaultValue?: string,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = type;
  if (placeholder) input.placeholder = placeholder;
  if (defaultValue) input.value = defaultValue;
  input.tabIndex = 0;

  Object.assign(input.style, baseStyles.input);

  return input;
}

/**
 * Creates a styled label
 */
export function createLabel(text: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.textContent = text;

  Object.assign(label.style, baseStyles.label);

  return label;
}

/**
 * Creates a span for displaying text information
 */
export function createSpan(text: string = ""): HTMLSpanElement {
  const span = document.createElement("span");
  span.textContent = text;

  Object.assign(span.style, {
    fontWeight: "600",
    fontSize: "14px",
    color: "#374151",
  });

  return span;
}

/**
 * Creates the metrics info container
 */
export function createMetricsInfo(): HTMLDivElement {
  const container = document.createElement("div");
  Object.assign(container.style, baseStyles.metricsInfo);
  return container;
}

/**
 * Creates the load more button
 */
export function createLoadMoreButton(): HTMLButtonElement {
  return createButton("Load more", "secondary");
}

/**
 * Creates the auto load input with label - fills row
 */
export function createAutoLoadControls(): {
  container: HTMLDivElement;
  input: HTMLInputElement;
  button: HTMLButtonElement;
} {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "8px";

  // Input and button row that fills width
  const inputButtonRow = document.createElement("div");
  Object.assign(inputButtonRow.style, baseStyles.inputButtonRow);

  const input = createInput("number", "", "10");
  input.min = "1";

  const button = createButton("Start", "primary");
  button.style.flex = "1";

  inputButtonRow.appendChild(input);
  inputButtonRow.appendChild(button);

  container.appendChild(inputButtonRow);

  return { container, input, button };
}

/**
 * Creates the countdown display span
 */
export function createCountdownSpan(): HTMLSpanElement {
  const span = createSpan();
  span.style.display = "none";
  span.style.color = "#f59e0b";
  span.style.fontWeight = "700";
  return span;
}

/**
 * Creates the scroll top button
 */
export function createScrollTopButton(): HTMLButtonElement {
  return createButton("Scroll Top", "neutral");
}

/**
 * Creates sort buttons
 */
export function createSortButtons(): {
  impressionsBtn: HTMLButtonElement;
  repliesBtn: HTMLButtonElement;
} {
  const impressionsBtn = createButton("Highest impressions", "warning");
  const repliesBtn = createButton("Has replies", "success");

  return { impressionsBtn, repliesBtn };
}

/**
 * Creates metrics display spans
 */
export function createMetricsSpans(): {
  countSpan: HTMLSpanElement;
  impressionsSpan: HTMLSpanElement;
  rangeSpan: HTMLSpanElement;
} {
  const countSpan = createSpan();
  const impressionsSpan = createSpan();
  const rangeSpan = createSpan();

  return { countSpan, impressionsSpan, rangeSpan };
}

/**
 * Creates a date span for the date row
 */
export function createDateSpan(): HTMLSpanElement {
  const span = createSpan();
  span.style.fontSize = "13px";
  span.style.fontWeight = "600";
  span.style.color = "#6b7280";
  return span;
}

/**
 * Creates a row for labels (Auto Load for / Sort by)
 */
export function createLabelRow(): HTMLDivElement {
  const row = document.createElement("div");
  Object.assign(row.style, baseStyles.labelRow);
  return row;
}

/**
 * Helper function to set button disabled state with proper styling
 */
export function setButtonState(
  button: HTMLButtonElement,
  disabled: boolean,
): void {
  setButtonDisabled(button, disabled);
}
