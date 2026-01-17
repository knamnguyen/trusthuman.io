/**
 * Block File Picker Script
 *
 * This script runs in the main world to temporarily block file input clicks.
 * It's loaded as a web_accessible_resource to bypass CSP restrictions.
 */
(function () {
  console.log("EngageKit: Injecting file picker block...");

  // Store original methods
  const origClick = HTMLInputElement.prototype.click;
  const origShowPicker = HTMLInputElement.prototype.showPicker;
  const origCreateElement = document.createElement.bind(document);

  // Method 1: Override prototype methods
  HTMLInputElement.prototype.click = function () {
    if (this.type === "file") {
      console.log("EngageKit: Blocked file input click (prototype)");
      return;
    }
    return origClick.call(this);
  };

  if (origShowPicker) {
    HTMLInputElement.prototype.showPicker = function () {
      if (this.type === "file") {
        console.log("EngageKit: Blocked file input showPicker");
        return;
      }
      return origShowPicker.call(this);
    };
  }

  // Method 2: Intercept createElement to override click at instance level
  // This catches cases where LinkedIn cached the native click before our override
  document.createElement = function (tagName, options) {
    const element = origCreateElement(tagName, options);
    if (tagName.toLowerCase() === "input") {
      console.log("EngageKit: Intercepted input creation");
      // Override click directly on this instance
      element.click = function () {
        if (this.type === "file") {
          console.log("EngageKit: Blocked file input click (instance)");
          return;
        }
        return origClick.call(this);
      };
    }
    return element;
  };

  // Method 3: Intercept click events at capture phase
  const blockClickHandler = function (e) {
    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      console.log("EngageKit: Blocked file input click (event)");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };
  document.addEventListener("click", blockClickHandler, true);

  // Method 4: Disable all existing file inputs
  const disabledInputs = [];
  const disableFileInput = (input) => {
    if (input.type === "file" && !input.disabled) {
      input.disabled = true;
      disabledInputs.push(input);
      console.log("EngageKit: Disabled file input");
    }
  };

  document.querySelectorAll('input[type="file"]').forEach(disableFileInput);

  // Method 5: MutationObserver to catch dynamically created file inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLInputElement && node.type === "file") {
          console.log("EngageKit: Caught new file input via observer");
          node.disabled = true;
          disabledInputs.push(node);
        }
        if (node instanceof HTMLElement) {
          node.querySelectorAll?.('input[type="file"]').forEach((input) => {
            console.log("EngageKit: Caught nested file input via observer");
            input.disabled = true;
            disabledInputs.push(input);
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Add CSS to hide/block file inputs
  const style = document.createElement("style");
  style.id = "engagekit-block-file-picker";
  style.textContent =
    'input[type="file"] { pointer-events: none !important; visibility: hidden !important; }';
  document.head.appendChild(style);

  // Restore after 2 seconds
  setTimeout(() => {
    console.log("EngageKit: Restoring file input methods");
    HTMLInputElement.prototype.click = origClick;
    if (origShowPicker) {
      HTMLInputElement.prototype.showPicker = origShowPicker;
    }
    document.createElement = origCreateElement;
    document.removeEventListener("click", blockClickHandler, true);
    observer.disconnect();

    // Re-enable disabled inputs
    disabledInputs.forEach((input) => {
      input.disabled = false;
    });

    // Remove CSS block
    const styleEl = document.getElementById("engagekit-block-file-picker");
    if (styleEl) styleEl.remove();
  }, 2000);
})();
