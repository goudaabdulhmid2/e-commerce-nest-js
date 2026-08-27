import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({
  name: 'Match',
  async: false,
})
export class MatchValidator
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const [property] = args.constraints;

    return (
      value ===
      (args.object as Record<string, unknown>)[property]
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const [property] = args.constraints;

    return `${args.property} must match ${property}`;
  }
}