export function accountRequiredForVote(poll: { requiresLogin: boolean }) {
  // The creator-selected mode is authoritative. Emergency global enforcement is explicit only.
  return poll.requiresLogin || process.env.REQUIRE_LOGIN_FOR_ALL_VOTES === 'true';
}
