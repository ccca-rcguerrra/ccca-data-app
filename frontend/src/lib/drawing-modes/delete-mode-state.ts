// ─────────────────────────────────────────────
// Shared delete-mode flag
//
// DeleteModeControl runs its click-to-delete flow on top of `simple_select`,
// relying on draw.selectionchange firing when a feature is clicked. But our
// custom SimpleSelectDirectEdit hijacks a plain click into `direct_select`
// (vertex editing), which would break delete-mode. This flag lets the select
// mode know to fall back to native selection while delete-mode is active.
// ─────────────────────────────────────────────

export const deleteModeState = { active: false };
