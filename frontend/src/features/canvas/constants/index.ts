/**
 * Centralized constants for canvas rendering, sizing, and layout.
 * All magic numbers and configuration values should be defined here for easy maintenance.
 */

// ============================================================================
// BOX SIZING CONSTANTS
// ============================================================================

/**
 * Default width for boxes in the call stack (in SVG units)
 */
export const DEFAULT_BOX_WIDTH = 180;

/**
 * Fallback height used when actual box dimensions are not yet measured
 */
export const FALLBACK_BOX_HEIGHT = 60;

/**
 * Gap between boxes in the call stack (negative value creates overlap effect)
 */
export const BOX_GAP = -10;

// ============================================================================
// CALLSTACK LAYOUT CONSTANTS
// ============================================================================

/**
 * Height of the call stack header section
 */
export const CALLSTACK_HEADER_HEIGHT = 40;

/**
 * Vertical offset for call stack positioning
 */
export const CALLSTACK_VERTICAL_OFFSET = 30;

/**
 * Default width of the call stack column
 */
export const DEFAULT_CALLSTACK_WIDTH = 225;

/**
 * Default height of the call stack (used as fallback)
 */
export const DEFAULT_CALLSTACK_HEIGHT = 400;

// ============================================================================
// PADDING CONSTANTS
// ============================================================================

/**
 * Free space at the top of the call stack content area
 */
export const TOP_FREE_PADDING = 5;

/**
 * Free space at the bottom of the call stack content area
 */
export const BOTTOM_FREE_PADDING = -12;

/**
 * Additional padding at the top when an item is selected
 */
export const SELECTION_PADDING_TOP = -25;

/**
 * Additional padding at the bottom when an item is selected
 */
export const SELECTION_PADDING_BOTTOM = 20;

/**
 * Computed total top padding (free + selection)
 */
export const TOP_PADDING = TOP_FREE_PADDING + SELECTION_PADDING_TOP;

/**
 * Computed total bottom padding (free + selection + extra spacing)
 */
export const BOTTOM_PADDING = BOTTOM_FREE_PADDING + SELECTION_PADDING_BOTTOM + 25;

// ============================================================================
// SCROLLBAR CONSTANTS
// ============================================================================

/**
 * Width of the scrollbar track and thumb
 */
export const SCROLLBAR_WIDTH = 5;

/**
 * Inset distance of the scrollbar from the edge
 */
export const SCROLLBAR_INSET = 4;

/**
 * Minimum height for the scrollbar thumb
 */
export const SCROLLBAR_THUMB_MIN_HEIGHT = 30;

/**
 * Threshold in pixels before drag is recognized
 */
export const DRAG_THRESHOLD_PX = 6;

// ============================================================================
// UI CONTROL CONSTANTS
// ============================================================================

/**
 * Height reserved for top control elements (buttons, etc.)
 */
export const TOP_CONTROLS_HEIGHT = 120;

/**
 * Space reserved at the bottom for download button
 */
export const DOWNLOAD_BUTTON_BOTTOM = 35;

/**
 * Standard height for UI buttons
 */
export const BUTTON_HEIGHT = 38;

/**
 * Extra spacing applied in height calculations (formerly magic number)
 */
export const ADDITIONAL_HEIGHT_OFFSET = 30;

/**
 * Calculates the effective top padding for the call stack based on selection state.
 * Returns composite padding when an item is selected, otherwise returns free padding only.
 *
 * @param hasSelection - Whether an item is currently selected in the call stack
 * @returns Padding value in SVG units
 */
export const getEffectiveTopPadding = (hasSelection: boolean = true): number => {
  return hasSelection ? TOP_PADDING : TOP_FREE_PADDING;
};

/**
 * Calculates the effective bottom padding for the call stack based on selection state.
 * Returns composite padding when an item is selected, otherwise returns free padding only.
 *
 * @param hasSelection - Whether an item is currently selected in the call stack
 * @returns Padding value in SVG units
 */
export const getEffectiveBottomPadding = (hasSelection: boolean = true): number => {
  return hasSelection ? BOTTOM_PADDING : BOTTOM_FREE_PADDING;
};

/**
 * Calculates the total vertical padding (top + bottom) for the call stack.
 *
 * @param hasSelection - Whether an item is currently selected in the call stack
 * @returns Combined padding value in SVG units
 */
export const getTotalVerticalPadding = (hasSelection: boolean = true): number => {
  return getEffectiveTopPadding(hasSelection) + getEffectiveBottomPadding(hasSelection);
};

/**
 * Calculates the total reserved vertical space including header and padding.
 * Used for determining available space for content in the call stack.
 *
 * @param hasSelection - Whether an item is currently selected in the call stack
 * @returns Total reserved space in SVG units
 */
export const getReservedVerticalSpace = (hasSelection: boolean = true): number => {
  return CALLSTACK_HEADER_HEIGHT + getTotalVerticalPadding(hasSelection);
};
