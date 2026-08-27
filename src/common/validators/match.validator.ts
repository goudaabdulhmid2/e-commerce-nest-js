import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Define a custom validation constraint that checks
// whether the current property matches another property.
@ValidatorConstraint({
  name: 'Match',
  async: false,
})
export class MatchValidator
  implements ValidatorConstraintInterface
{
  // Validate the current property's value against
  // the value of the related property.
  validate(
    value: unknown,
    args: ValidationArguments,
  ): boolean {
    // Get the name of the property that the current
    // value should match.
    const [property] = args.constraints;

    // Compare the current property's value with
    // the related property's value in the DTO object.
    return (
      value ===
      (args.object as Record<string, unknown>)[property]
    );
  }

  // Define the default error message returned
  // when the validation fails.
  defaultMessage(
    args: ValidationArguments,
  ): string {
    // Get the name of the related property.
    const [property] = args.constraints;

    // Return a descriptive validation error message.
    return `${args.property} must match ${property}`;
  }
}