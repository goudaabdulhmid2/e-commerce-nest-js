export class SessionResponseDto {
  // Return the unique session identifier.
  id!: string;

  // Return when the session was created.
  createdAt!: Date;

  // Return when the session was last used.
  lastUsedAt?: Date;

  // Return when the session expires.
  expiresAt!: Date;
}