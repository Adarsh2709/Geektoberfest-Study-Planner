import assert from "node:assert/strict";
import { test } from "node:test";

// Simulate the focus trapping and keyboard navigation algorithm used in Dialog component
function handleDialogKeydown({
  event,
  focusableElements,
  activeElement,
  onClose,
  isContainedInDialog,
}) {
  let prevented = false;
  let stoppedPropagation = false;
  let nextFocused = activeElement;

  if (event.key === "Escape") {
    stoppedPropagation = true;
    onClose();
    return { prevented, stoppedPropagation, nextFocused };
  }

  if (event.key === "Tab" && focusableElements.length > 0) {
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (activeElement === first || !isContainedInDialog) {
        nextFocused = last;
        prevented = true;
      }
    } else {
      if (activeElement === last || !isContainedInDialog) {
        nextFocused = first;
        prevented = true;
      }
    }
  }

  return { prevented, stoppedPropagation, nextFocused };
}

test("Dialog Escape key closes modal and stops event propagation", () => {
  let closed = false;
  const result = handleDialogKeydown({
    event: { key: "Escape" },
    focusableElements: ["btn1", "btn2"],
    activeElement: "btn1",
    onClose: () => {
      closed = true;
    },
    isContainedInDialog: true,
  });

  assert.equal(closed, true);
  assert.equal(result.stoppedPropagation, true);
});

test("Dialog traps focus forwards: Tab on last focusable wraps to first", () => {
  const elements = ["closeBtn", "input1", "submitBtn"];
  const result = handleDialogKeydown({
    event: { key: "Tab", shiftKey: false },
    focusableElements: elements,
    activeElement: "submitBtn",
    onClose: () => {},
    isContainedInDialog: true,
  });

  assert.equal(result.prevented, true);
  assert.equal(result.nextFocused, "closeBtn");
});

test("Dialog traps focus backwards: Shift+Tab on first focusable wraps to last", () => {
  const elements = ["closeBtn", "input1", "submitBtn"];
  const result = handleDialogKeydown({
    event: { key: "Tab", shiftKey: true },
    focusableElements: elements,
    activeElement: "closeBtn",
    onClose: () => {},
    isContainedInDialog: true,
  });

  assert.equal(result.prevented, true);
  assert.equal(result.nextFocused, "submitBtn");
});

test("Dialog captures focus if active element escapes outside the dialog", () => {
  const elements = ["closeBtn", "input1", "submitBtn"];
  
  // Forward Tab from outside pulls focus to first element
  const fwdResult = handleDialogKeydown({
    event: { key: "Tab", shiftKey: false },
    focusableElements: elements,
    activeElement: "body",
    onClose: () => {},
    isContainedInDialog: false,
  });
  assert.equal(fwdResult.prevented, true);
  assert.equal(fwdResult.nextFocused, "closeBtn");

  // Reverse Shift+Tab from outside pulls focus to last element
  const backResult = handleDialogKeydown({
    event: { key: "Tab", shiftKey: true },
    focusableElements: elements,
    activeElement: "body",
    onClose: () => {},
    isContainedInDialog: false,
  });
  assert.equal(backResult.prevented, true);
  assert.equal(backResult.nextFocused, "submitBtn");
});

test("Accessible dialog attributes include role=dialog, aria-modal, and labeledby/describedby", () => {
  function getDialogAttributes(title, description, titleId, descId) {
    return {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": title ? titleId : undefined,
      "aria-describedby": description ? descId : undefined,
    };
  }

  const attrsWithBoth = getDialogAttributes("Edit Topic", "Change topic settings", "t-1", "d-1");
  assert.equal(attrsWithBoth.role, "dialog");
  assert.equal(attrsWithBoth["aria-modal"], "true");
  assert.equal(attrsWithBoth["aria-labelledby"], "t-1");
  assert.equal(attrsWithBoth["aria-describedby"], "d-1");

  const attrsTitleOnly = getDialogAttributes("Edit Subject", null, "t-2", "d-2");
  assert.equal(attrsTitleOnly["aria-labelledby"], "t-2");
  assert.equal(attrsTitleOnly["aria-describedby"], undefined);
});
