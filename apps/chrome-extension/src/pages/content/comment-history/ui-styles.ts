/**
 * Modern pink Gumroad-style design system for LinkedIn comment history UI
 */

export const baseStyles = {
  container: {
    position: "sticky" as const,
    top: "50px",
    zIndex: "100",
    margin: "16px 0px 12px",
    padding: "16px",
    background: "#fef7f7",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap" as const,
    justifyContent: "space-between",
  },

  threeColumnRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "12px",
    alignItems: "stretch",
    gridTemplateRows: "auto auto",
  },

  scrollTopColumn: {
    gridColumn: "3",
    gridRow: "1 / 3",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
  },

  dateRow: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: "-5px",
    padding: "6px",
    background: "#f9fafb",
    borderRadius: "4px",
    border: "1px solid #e5e7eb",
  },

  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#374151",
    marginRight: "8px",
  },

  input: {
    width: "60%",
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    background: "#fff",
    transition: "all 0.2s ease",
    textAlign: "center",
    marginRight: "8px",
  },

  labelRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    alignItems: "flex-start",
    marginBottom: "2px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    gap: "12px",
  },

  inputButtonRow: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
  },

  startButton: {
    flex: "1",
  },

  metricsInfo: {
    display: "flex",
    gap: "40px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#111827",
    flexWrap: "wrap" as const,
    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid #000",
    boxShadow: "4px 4px 0px #000",
    justifyContent: "center",
    alignItems: "center",
  },
};

export const buttonStyles = {
  // Primary pink button (main actions)
  primary: {
    padding: "6px 12px",
    background: "#ec4899", // pink-500
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "2px 2px 0px #000",
    textTransform: "none" as const,
    fontFamily: "inherit",
    width: "100%",
  },

  // Secondary button (actions)
  secondary: {
    padding: "6px 12px",
    background: "#ec4899", // pink-500 (changed to pink)
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "2px 2px 0px #000",
    textTransform: "none" as const,
    fontFamily: "inherit",
    width: "100%",
  },

  // Success button (positive actions)
  success: {
    padding: "6px 12px",
    background: "#10b981", // emerald-500 (green)
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "2px 2px 0px #000",
    textTransform: "none" as const,
    fontFamily: "inherit",
    width: "100%",
  },

  // Neutral button (utility actions) - spans 2 rows exactly
  neutral: {
    padding: "6px 12px",
    background: "#000", // black
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "2px 2px 0px #000",
    textTransform: "none" as const,
    fontFamily: "inherit",
    width: "auto",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Warning button (attention-needed actions)
  warning: {
    padding: "6px 12px",
    background: "#f59e0b", // amber-500
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "2px 2px 0px #000",
    textTransform: "none" as const,
    fontFamily: "inherit",
    width: "100%",
  },
};

/**
 * Applies hover effect to a button element with Gumroad-style animation
 */
export function applyButtonHoverEffects(button: HTMLButtonElement) {
  button.addEventListener("mouseenter", () => {
    if (!button.disabled) {
      button.style.transform = "translate(1px, 1px)";
      button.style.boxShadow = "none";
    }
  });

  button.addEventListener("mouseleave", () => {
    if (!button.disabled) {
      button.style.transform = "translate(0px, 0px)";
      button.style.boxShadow = "2px 2px 0px #000";
    }
  });

  button.addEventListener("mousedown", () => {
    if (!button.disabled) {
      button.style.transform = "translate(2px, 2px)";
      button.style.boxShadow = "none";
    }
  });

  button.addEventListener("mouseup", () => {
    if (!button.disabled) {
      button.style.transform = "translate(1px, 1px)";
      button.style.boxShadow = "none";
    }
  });
}

/**
 * Sets disabled state styling for buttons
 */
export function setButtonDisabled(
  button: HTMLButtonElement,
  disabled: boolean,
) {
  button.disabled = disabled;
  if (disabled) {
    button.style.opacity = "0.6";
    button.style.cursor = "not-allowed";
    button.style.transform = "translate(0px, 0px)";
    button.style.boxShadow = "1px 1px 0px #00000040";
  } else {
    button.style.opacity = "1";
    button.style.cursor = "pointer";
    button.style.transform = "translate(0px, 0px)";
    button.style.boxShadow = "2px 2px 0px #000";
  }
}
