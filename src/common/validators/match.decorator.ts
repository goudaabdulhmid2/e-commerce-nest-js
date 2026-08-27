import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

import { MatchValidator } from './match.validator';

// Create a reusable @Match() decorator that can be
// used to compare one DTO property with another.
export function Match(
  property: string,
  options?: ValidationOptions,
) {
  // Return the actual property decorator function.
  return function (
    object: object,
    propertyName: string,
  ) {
    // Register the custom validator with class-validator.
    registerDecorator({
      // The class that contains the decorated property.
      target: object.constructor,

      // The property where @Match() is applied.
      propertyName,

      // Pass the property that should be matched
      // to the validator.
      constraints: [property],

      // Pass optional validation settings such as
      // a custom error message.
      options,

      // Tell class-validator which validator
      // should handle this validation.
      validator: MatchValidator,
    });
  };
}