export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (val: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(val * 255)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : null;
}

/**
 * Checks if an array is a valid Lottie color property k array: [r, g, b] or [r, g, b, a]
 * with each value between 0 and 1.
 */
function isValidLottieColorArray(k: any): boolean {
  if (!Array.isArray(k) || (k.length !== 3 && k.length !== 4)) {
    return false;
  }
  return k.every(val => typeof val === 'number' && val >= 0 && val <= 1);
}

/**
 * Recursively extracts unique colors from a Lottie JSON object.
 */
export function extractUniqueColors(obj: any): string[] {
  const colors = new Set<string>();

  function walk(node: any) {
    if (!node || typeof node !== 'object') return;

    // Check if this is a Lottie color property object
    // Typically it has key 'c' with 'k' as the color array (stroke/fill)
    if (node.c && node.c.k !== undefined) {
      const k = node.c.k;
      if (isValidLottieColorArray(k)) {
        colors.add(rgbToHex(k[0], k[1], k[2]));
      }
    }

    // Direct arrays or nesting
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
    } else {
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          walk(node[key]);
        }
      }
    }
  }

  walk(obj);
  return Array.from(colors).sort();
}

/**
 * Recursively updates colors inside a Lottie JSON object based on a map.
 * Returns a new object with the replaced colors.
 */
export function replaceLottieColors(obj: any, colorMap: Record<string, string>): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Clone node
  let clonedNode: any;
  if (Array.isArray(obj)) {
    clonedNode = [];
    for (let i = 0; i < obj.length; i++) {
      clonedNode.push(replaceLottieColors(obj[i], colorMap));
    }
    return clonedNode;
  } else {
    clonedNode = { ...obj };
  }

  // If this is a color property, perform the replacement
  if (clonedNode.c && clonedNode.c.k !== undefined) {
    const k = clonedNode.c.k;
    if (isValidLottieColorArray(k)) {
      const currentHex = rgbToHex(k[0], k[1], k[2]);
      const newHex = colorMap[currentHex];
      if (newHex) {
        const rgb = hexToRgb(newHex);
        if (rgb) {
          clonedNode.c = {
            ...clonedNode.c,
            // Preserve alpha if it is defined
            k: k.length === 4 ? [rgb[0], rgb[1], rgb[2], k[3]] : [rgb[0], rgb[1], rgb[2]]
          };
        }
      }
    }
  }

  // Recurse into children keys
  for (const key in clonedNode) {
    if (Object.prototype.hasOwnProperty.call(clonedNode, key) && key !== 'c') {
      clonedNode[key] = replaceLottieColors(clonedNode[key], colorMap);
    }
  }

  return clonedNode;
}

/**
 * Counts total layers recursively in the Lottie JSON
 */
export function countLayers(obj: any): number {
  if (!obj || typeof obj !== 'object') return 0;
  let count = 0;
  if (Array.isArray(obj.layers)) {
    count += obj.layers.length;
  }
  
  // Look for nested assets that might have layers (comps)
  if (Array.isArray(obj.assets)) {
    for (const asset of obj.assets) {
      if (Array.isArray(asset.layers)) {
        count += asset.layers.length;
      }
    }
  }
  return count;
}
