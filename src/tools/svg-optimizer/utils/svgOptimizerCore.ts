export interface SvgOptimizerOptions {
  xmlDecl: boolean;      // Remove XML declaration and DOCTYPE
  metadata: boolean;     // Remove metadata and comments
  namespaces: boolean;   // Strip editor attributes and namespaces
  unusedIds: boolean;    // Remove unused IDs
  emptyGroups: boolean;  // Remove unused/empty groups and paths
  precision: number | null; // Coordinate rounding (null = keep raw, otherwise number of decimals)
  minifyPath: boolean;   // Minify path spacing
  responsive: boolean;   // Responsive SVG (remove width/height, ensure viewBox)
  styleToAttrs: boolean; // Convert style attribute to presentation attributes
}

/**
 * Optimizes an SVG code string based on custom settings.
 * Runs entirely on the client side using DOMParser.
 */
export function optimizeSvg(svgContent: string, options: SvgOptimizerOptions): string {
  let content = svgContent.trim();

  // 1. Pre-parse cleanups
  if (options.xmlDecl) {
    content = content.replace(/<\?xml[^>]*\?>/gi, '');
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  }

  if (options.metadata) {
    content = content.replace(/<!--[\s\S]*?-->/g, '');
  }

  // 2. DOM parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(parserError.textContent || 'Failed to parse SVG XML structure');
  }

  const svgElement = doc.documentElement;
  if (svgElement.tagName.toLowerCase() !== 'svg') {
    throw new Error('Root element is not an <svg> tag');
  }

  // 3. Remove metadata nodes
  if (options.metadata) {
    svgElement.querySelectorAll('metadata').forEach(el => el.remove());
  }

  // 4. Editor Namespaces & Tags Cleanup
  const allElements = Array.from(doc.getElementsByTagName('*'));
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    
    // Remove tags with colons (Inkscape / sodipodi metadata tags)
    if (options.namespaces && el.tagName.includes(':')) {
      el.remove();
      continue;
    }

    // Clean attributes
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name;
      if (options.namespaces) {
        if (name.includes(':') || name.startsWith('xmlns:') || name.startsWith('sketch:') || name.startsWith('illustrator:')) {
          // Keep standard xmlns & xlink namespace decs
          if (name !== 'xmlns' && name !== 'xmlns:xlink' && name !== 'xml:space') {
            el.removeAttribute(name);
          }
        }
      }
    }
  }

  // 5. Convert styles to attributes
  if (options.styleToAttrs) {
    const elementsWithStyle = doc.querySelectorAll('[style]');
    elementsWithStyle.forEach(el => {
      const styleVal = el.getAttribute('style') || '';
      const declarations = styleVal.split(';');
      const remainingStyles: string[] = [];

      declarations.forEach(decl => {
        const parts = decl.split(':');
        if (parts.length === 2) {
          const key = parts[0].trim();
          const val = parts[1].trim();
          const presentationAttrs = [
            'fill', 'fill-opacity', 'fill-rule',
            'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
            'opacity', 'display', 'visibility', 'clip-path', 'mask', 'filter', 'font-family', 'font-size', 'font-weight', 'font-style'
          ];
          if (presentationAttrs.includes(key)) {
            el.setAttribute(key, val);
          } else {
            remainingStyles.push(`${key}: ${val}`);
          }
        }
      });

      if (remainingStyles.length > 0) {
        el.setAttribute('style', remainingStyles.join('; '));
      } else {
        el.removeAttribute('style');
      }
    });
  }

  // 6. Coordinate precision and path minification
  if (options.precision !== null) {
    const precisionVal = options.precision;
    const elements = Array.from(doc.getElementsByTagName('*'));
    
    elements.forEach(el => {
      // Optimize path data
      if (el.tagName.toLowerCase() === 'path') {
        const d = el.getAttribute('d');
        if (d) {
          el.setAttribute('d', optimizePathData(d, precisionVal, options.minifyPath));
        }
      }

      // Optimize shape attributes
      const numericAttrs = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity'];
      numericAttrs.forEach(attrName => {
        const val = el.getAttribute(attrName);
        if (val) {
          const numMatch = val.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(px|%)?$/i);
          if (numMatch) {
            const numVal = parseFloat(numMatch[1]);
            const unit = numMatch[2] || '';
            if (!isNaN(numVal)) {
              const factor = Math.pow(10, precisionVal);
              const rounded = Math.round(numVal * factor) / factor;
              el.setAttribute(attrName, rounded.toString() + unit);
            }
          }
        }
      });
    });
  } else if (options.minifyPath) {
    // If precision is off, but minifyPath spacing is enabled
    const elements = Array.from(doc.getElementsByTagName('path'));
    elements.forEach(el => {
      const d = el.getAttribute('d');
      if (d) {
        el.setAttribute('d', optimizePathData(d, null, true));
      }
    });
  }

  // 7. Remove empty and unwrap redundant groups
  if (options.emptyGroups) {
    const cleanEmptyAndGroups = (element: Element) => {
      const children = Array.from(element.children);
      children.forEach(cleanEmptyAndGroups);

      const tagName = element.tagName.toLowerCase();
      const isEmpty = element.children.length === 0 && !element.textContent?.trim();
      const isCollapsibleTag = ['g', 'defs', 'metadata', 'style'].includes(tagName) || 
                              (tagName === 'path' && !element.getAttribute('d'));

      if (isEmpty && isCollapsibleTag) {
        element.remove();
        return;
      }

      // Unwrap group that has no layout/fill attributes and only contains children
      if (tagName === 'g' && element.children.length > 0) {
        const attrs = Array.from(element.attributes);
        const hasOnlyIdOrNoAttrs = attrs.length === 0 || (attrs.length === 1 && attrs[0].name === 'id');
        
        if (hasOnlyIdOrNoAttrs) {
          const parent = element.parentNode;
          if (parent) {
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element);
            }
            element.remove();
          }
        }
      }
    };

    Array.from(svgElement.children).forEach(cleanEmptyAndGroups);
  }

  // 8. Remove unused IDs
  if (options.unusedIds) {
    const elementsWithId = Array.from(doc.querySelectorAll('[id]'));
    const ids = elementsWithId.map(el => el.getAttribute('id') || '');

    // Temporarily serialize to check references
    const serialized = new XMLSerializer().serializeToString(doc);

    for (const id of ids) {
      if (!id) continue;
      const escapedId = id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const refRegex = new RegExp(`[#]${escapedId}\\b`);
      
      // If the ID is not referenced anywhere in the SVG as `#id` or `url(#id)`
      if (!refRegex.test(serialized)) {
        const element = doc.getElementById(id);
        if (element) {
          element.removeAttribute('id');
        }
      }
    }
  }

  // 9. Responsive viewbox layout
  if (options.responsive) {
    const widthVal = svgElement.getAttribute('width');
    const heightVal = svgElement.getAttribute('height');
    const viewBoxVal = svgElement.getAttribute('viewBox');

    if (widthVal && heightVal && !viewBoxVal) {
      const w = parseFloat(widthVal);
      const h = parseFloat(heightVal);
      if (!isNaN(w) && !isNaN(h)) {
        svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    }

    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
  }

  // 10. Final XML Serialization
  let optimizedSvg = new XMLSerializer().serializeToString(doc);

  // Minify whitespace between nodes
  optimizedSvg = optimizedSvg.replace(/>\s+</g, '><');

  // Strip XML wrapper if selected and serializer prepended it
  if (options.xmlDecl) {
    optimizedSvg = optimizedSvg.replace(/<\?xml[^>]*\?>/gi, '');
  }

  return optimizedSvg.trim();
}

/**
 * Parses and tokenizes SVG Path data string, rounding values and minifying format spacing.
 */
function optimizePathData(d: string, precision: number | null, minifySpace: boolean): string {
  // Regex to extract commands and float decimals (handles scientific notation like e-3)
  const tokenRegex = /([a-df-z])|([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let match;
  let result = '';
  let lastWasNumber = false;

  while ((match = tokenRegex.exec(d)) !== null) {
    const [, cmd, num] = match;
    
    if (cmd) {
      result += minifySpace ? cmd : (result ? ' ' + cmd : cmd);
      lastWasNumber = false;
    } else if (num) {
      let formatted = num;
      if (precision !== null) {
        const val = parseFloat(num);
        if (!isNaN(val)) {
          const factor = Math.pow(10, precision);
          const rounded = Math.round(val * factor) / factor;
          formatted = rounded.toString();
          
          // Compact zeros: 0.25 -> .25, -0.5 -> -.5
          if (formatted.startsWith('0.')) {
            formatted = formatted.slice(1);
          } else if (formatted.startsWith('-0.')) {
            formatted = '-' + formatted.slice(2);
          }
        }
      }

      if (lastWasNumber) {
        if (minifySpace) {
          // No space needed if value starts with minus sign or decimal dot
          if (formatted.startsWith('-') || formatted.startsWith('.')) {
            result += formatted;
          } else {
            result += ' ' + formatted;
          }
        } else {
          result += ' ' + formatted;
        }
      } else {
        result += formatted;
      }
      lastWasNumber = true;
    }
  }

  return result;
}
