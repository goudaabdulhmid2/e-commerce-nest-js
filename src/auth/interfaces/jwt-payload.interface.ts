export interface JwtPayload {
  // Store the authenticated user's ID.
  sub: string;

  // Store the user's role for authorization decisions.
  role: string;

  // Store the authentication session ID.
  sid: string;
}