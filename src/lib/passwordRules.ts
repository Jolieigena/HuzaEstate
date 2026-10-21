// Rules for a password a person chooses. The server (access-service auth/password.ts) enforces these and also refuses
// very common passwords; keep the two in step.
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordCheck {
  label: string;
  ok: boolean;
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: "A letter", ok: /[A-Za-z]/.test(password) },
    { label: "A number", ok: /[0-9]/.test(password) },
  ];
}

export function passwordIsAcceptable(password: string): boolean {
  return passwordChecks(password).every((c) => c.ok);
}
