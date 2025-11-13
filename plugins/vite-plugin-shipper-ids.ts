import { Plugin } from 'vite';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export function shipperIdsPlugin(): Plugin {
  return {
    name: 'vite-plugin-shipper-ids',
    enforce: 'pre',

    transform(code, id) {
      // Only process in dev mode
      if (process.env.NODE_ENV !== 'development') {
        return null;
      }

      // Only process JSX/TSX files
      if (!/\.[jt]sx$/.test(id)) {
        return null;
      }

      try {
        // Parse and transform
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        let hasChanges = false;

        traverse(ast, {
          JSXElement(path) {
            const { openingElement } = path.node;

            // Only add ID if element has className
            const hasClassName = openingElement.attributes.some(
              (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'className'
            );

            if (!hasClassName) return;

            // Check if already has data-shipper-id
            const hasId = openingElement.attributes.some(
              (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'data-shipper-id'
            );

            if (hasId) return;

            // Generate stable ID based on location
            const loc = openingElement.loc;
            if (!loc) return;

            const filename = id.split('/').pop() || 'unknown';
            const shipperId = `${filename}:${loc.start.line}:${loc.start.column}`;

            // Add attribute
            openingElement.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier('data-shipper-id'),
                t.stringLiteral(shipperId)
              )
            );

            hasChanges = true;
          },
        });

        if (!hasChanges) return null;

        const output = generate(ast, {}, code);
        return {
          code: output.code,
          map: output.map,
        };
      } catch (error) {
        console.error('[shipper-ids-plugin] Error transforming file:', id, error);
        return null;
      }
    },
  };
}
