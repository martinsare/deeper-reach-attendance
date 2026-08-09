// Members sign in with a username; Supabase auth needs an email, so we derive a
// deterministic synthetic address. Email-based password reset is therefore not
// available — admins reset passwords for staff accounts instead.
export const USERNAME_EMAIL_DOMAIN = "dlbc-pontypridd.app";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
}