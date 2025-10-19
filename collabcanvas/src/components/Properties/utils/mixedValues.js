// mixedValues.js - Utility functions for detecting mixed values across multi-select

/**
 * Detect if a property has mixed values across multiple shapes
 * @param {Array} shapes - Array of shape objects
 * @param {String} property - Property key to check (e.g., 'x', 'color', 'fontSize')
 * @returns {Object} { isMixed: boolean, commonValue: any }
 */
export function detectMixedValue(shapes, property) {
  // Handle edge cases
  if (!shapes || shapes.length === 0) {
    return { isMixed: false, commonValue: undefined };
  }
  
  // Single shape is never "mixed"
  if (shapes.length === 1) {
    return { isMixed: false, commonValue: shapes[0][property] };
  }
  
  // Special handling for rotation (normalize to 0-359°)
  if (property === 'rotation') {
    return detectMixedRotation(shapes);
  }
  
  // Normalize null/undefined values (treat as the same)
  const normalize = (val) => (val === null || val === undefined) ? undefined : val;
  
  const firstValue = normalize(shapes[0][property]);
  const allSame = shapes.every(s => normalize(s[property]) === firstValue);
  
  return {
    isMixed: !allSame,
    commonValue: allSame ? firstValue : undefined
  };
}

/**
 * Special handler for rotation values (normalize to 0-359°)
 * @param {Array} shapes - Array of shape objects
 * @returns {Object} { isMixed: boolean, commonValue: number }
 */
function detectMixedRotation(shapes) {
  if (!shapes || shapes.length === 0) {
    return { isMixed: false, commonValue: 0 };
  }
  
  if (shapes.length === 1) {
    return { isMixed: false, commonValue: normalizeRotation(shapes[0].rotation || 0) };
  }
  
  const normalizeRotation = (deg) => {
    const normalized = ((deg % 360) + 360) % 360; // Handle negatives
    return Math.round(normalized); // Round to avoid floating point issues
  };
  
  const firstRotation = normalizeRotation(shapes[0].rotation || 0);
  const allSame = shapes.every(s => normalizeRotation(s.rotation || 0) === firstRotation);
  
  return {
    isMixed: !allSame,
    commonValue: allSame ? firstRotation : undefined
  };
}

/**
 * Get display value for a property (returns "Mixed" string if mixed)
 * @param {Array} shapes - Array of shape objects
 * @param {String} property - Property key
 * @param {Function} formatter - Optional formatter function for the value
 * @returns {String|Number|any} Display value or "Mixed"
 */
export function getDisplayValue(shapes, property, formatter = null) {
  const { isMixed, commonValue } = detectMixedValue(shapes, property);
  
  if (isMixed) {
    return "Mixed";
  }
  
  if (commonValue === undefined || commonValue === null) {
    return "";
  }
  
  return formatter ? formatter(commonValue) : commonValue;
}

/**
 * Check if all shapes have the same value for a property
 * @param {Array} shapes - Array of shape objects
 * @param {String} property - Property key
 * @returns {Boolean} True if all shapes have the same value
 */
export function hasCommonValue(shapes, property) {
  const { isMixed } = detectMixedValue(shapes, property);
  return !isMixed;
}

/**
 * Get the common value if all shapes share it, otherwise return default
 * @param {Array} shapes - Array of shape objects
 * @param {String} property - Property key
 * @param {any} defaultValue - Default value if mixed
 * @returns {any} Common value or default
 */
export function getCommonValue(shapes, property, defaultValue = null) {
  const { isMixed, commonValue } = detectMixedValue(shapes, property);
  
  if (isMixed) {
    return defaultValue;
  }
  
  return commonValue !== undefined ? commonValue : defaultValue;
}

/**
 * Detect mixed boolean values (useful for bold, italic, etc.)
 * @param {Array} shapes - Array of shape objects
 * @param {String} property - Property key
 * @param {any} trueValue - Value that represents "true" (e.g., 'bold' for fontWeight)
 * @returns {Object} { isMixed: boolean, isActive: boolean }
 */
export function detectMixedBoolean(shapes, property, trueValue) {
  if (!shapes || shapes.length === 0) {
    return { isMixed: false, isActive: false };
  }
  
  if (shapes.length === 1) {
    return { 
      isMixed: false, 
      isActive: shapes[0][property] === trueValue 
    };
  }
  
  const firstValue = shapes[0][property];
  const allSame = shapes.every(s => s[property] === firstValue);
  
  return {
    isMixed: !allSame,
    isActive: allSame && firstValue === trueValue
  };
}

/**
 * Normalize rotation to 0-359° range
 * @param {Number} degrees - Rotation in degrees
 * @returns {Number} Normalized rotation (0-359)
 */
export function normalizeRotation(degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  return Math.round(normalized);
}

