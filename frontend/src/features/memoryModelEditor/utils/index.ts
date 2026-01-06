/**
 * Master Error List - Public API
 * 
 * This file exports all master error list utilities for easy importing
 */

export {
  createMasterErrorList,
  getTotalErrorCount,
  getElementsWithErrorsCount,
  hasErrors,
  getErrorsForElement,
  getAllErrorEntries,
  getErrorSummaryByType,
  flattenErrorList,
} from './masterErrorList';

export type {
  ElementErrorEntry,
  MasterErrorList,
} from './masterErrorList';
