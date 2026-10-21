// Rules for a password a person chooses. The server (access-service auth/password.ts) enforces these and also refuses
// very common passwords; keep the two in step.
export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordWho {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PasswordCheck {
  label: string;
  ok: boolean;
}

export function passwordChecks(password: string, who: PasswordWho = {}): PasswordCheck[] {
  const letters = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  const personal = [who.email?.split("@")[0], who.firstName, who.lastName]
    .map((part) => String(part || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((part) => part.length >= 4);
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: "A lowercase and an uppercase letter", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", ok: /[0-9]/.test(password) },
    { label: "Not your name or email", ok: !personal.some((part) => letters.includes(part)) && new Set(password).size >= 5 },
  ];
}

export function passwordIsAcceptable(password: string, who: PasswordWho = {}): boolean {
  return passwordChecks(password, who).every((c) => c.ok);
}
