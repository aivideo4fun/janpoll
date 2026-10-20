export function accountRequiredForVote(poll: { requiresLogin: boolean }) {
  // Production defaults to account-based voting. Guest creation remains available.
  const strict = process.env.REQUIRE_LOGIN_FOR_ALL_VOTES === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.REQUIRE_LOGIN_FOR_ALL_VOTES !== 'false');
  return poll.requiresLogin || strict;
}
