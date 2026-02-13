import { TemplateResult } from 'lit';
import { DirectiveResult } from 'lit/directive.js';

export type NestedKeyOf<ObjectType> = ObjectType extends object
  ? {
      [Key in keyof ObjectType & (string | number)]: NonNullable<
        // Use NonNullable to include optional properties
        ObjectType[Key]
      > extends unknown[]
        ? `${Key}`
        : NonNullable<ObjectType[Key]> extends object
          ? // Recurse with the non-nullable type
              `${Key}` | `${Key}.${NestedKeyOf<NonNullable<ObjectType[Key]>>}`
          : `${Key}`;
    }[keyof ObjectType & (string | number)]
  : never;

/**
 * Default type for the table.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnspecifiedRecord = Record<string, any>;

/**
 * Valid types for Row IDs
 */
export type RowId = string | number;

/**
 * Known compareable type
 */
export type Compareable = string | number | boolean | Date;

/**
 * Safe types for render callbacks
 */
export type Renderable =
  | string
  | number
  | boolean
  | null
  | undefined
  | TemplateResult
  | DirectiveResult;
