/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

// CC0
// @ts-check
const td = require('typedoc');

/** @param {td.Application} app */
exports.load = function (app) {
  app.converter.on(
    td.Converter.EVENT_CREATE_DECLARATION,
    expandObjectLikeTypes
  );
};

/**
 * The reflection types affected by this plugin.
 */
const TYPES_TO_EXPAND = ['mapped', 'intersection', 'reference'];

/**
 * @param {td.Context} context
 * @param {td.DeclarationReflection} reflection
 */
function expandObjectLikeTypes(context, reflection) {
  if (
    reflection.kind !== td.ReflectionKind.TypeAlias ||
    !reflection.type?.type ||
    !TYPES_TO_EXPAND.includes(reflection.type.type)
  )
    return;

  const symbol = context.project.getSymbolFromReflection(reflection);
  const declaration = symbol?.declarations?.[0];

  if (!symbol || !declaration) return; // Will probably never happen in practice
  const reflectionType = context.checker.getDeclaredTypeOfSymbol(symbol);

  const typeRefl = context
    .withScope(reflection)
    .createDeclarationReflection(
      td.ReflectionKind.TypeLiteral,
      undefined,
      undefined,
      '__type'
    );
  context.finalizeDeclarationReflection(typeRefl);
  const typeContext = context.withScope(typeRefl);

  for (const propertySymbol of reflectionType.getProperties()) {
    const propertyType =
      propertySymbol &&
      context.checker.getTypeOfSymbolAtLocation(propertySymbol, declaration);
    const resolvedReflection = resolvePropertyReflection(
      context,
      reflectionType,
      propertySymbol
    );

    const element = typeContext.createDeclarationReflection(
      td.ReflectionKind.Property,
      undefined,
      undefined,
      propertySymbol.name
    );

    if (resolvedReflection) {
      element.comment = resolvedReflection.comment;
      element.flags = resolvedReflection.flags;
      element.sources = resolvedReflection.sources;

      if (resolvedReflection instanceof td.DeclarationReflection) {
        element.defaultValue = resolvedReflection.defaultValue;
      }
    }

    element.type = typeContext.converter.convertType(typeContext, propertyType);
    typeContext.finalizeDeclarationReflection(element);
  }

  reflection.type = new td.ReflectionType(typeRefl);
}

/**
 * @param {td.Context} context
 * @param {td.TypeScript.Type} objectType
 * @param {td.TypeScript.Symbol} propertySymbol
 */
function resolvePropertyReflection(context, objectType, propertySymbol) {
  const resolvedType = context.checker.getPropertyOfType(
    objectType,
    propertySymbol.name
  );
  const resolvedDeclaration = resolvedType?.declarations?.[0];
  const resolvedSymbol =
    resolvedDeclaration && context.getSymbolAtLocation(resolvedDeclaration);

  return (
    resolvedSymbol && context.project.getReflectionFromSymbol(resolvedSymbol)
  );
}

/**
 * Die and dump the given value.
 *
 * @param {any} value
 * @internal
 */
function dd(value) {
  dump(value);
  process.exit(1);
}

/**
 * Dump the given value.
 *
 * @param {any} value
 * @internal
 */
function dump(value) {
  clean(value, ['checker', 'converter', 'context'], 3);
  console.log(value);
}

/**
 * Cleans the given value of the given keys recusively
 * for a maximum of the given depth.
 *
 * @param {any} obj
 * @param {string[]} keys
 * @param {number} depth
 * @internal
 */
function clean(obj, keys, depth) {
  if (depth === 0) return;

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      clean(item, keys, depth);
    });
  } else if (typeof obj === 'object' && obj != null) {
    Object.getOwnPropertyNames(obj).forEach((key) => {
      if (keys.indexOf(key) !== -1) delete obj[key];
      else clean(obj[key], keys, depth - 1);
    });
  }
}
