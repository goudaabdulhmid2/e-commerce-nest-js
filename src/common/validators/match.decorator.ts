import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

import { MatchValidator } from './match.validator';

export function Match(
  property: string,
  options?: ValidationOptions,
) {
  return function (
    object: object,
    propertyName: string,
  ) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [property],
      options,
      validator: MatchValidator,
    });
  };
}