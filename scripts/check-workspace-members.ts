/**
 * Checks how the Members list is built from the `workspace_member_profiles` view (utils/workspace-member.ts):
 * - a co-member's view row keeps their name, email and photo (the regression: they used to come back null
 *   through the `users(...)` embed, so everyone but you showed as "Unknown");
 * - the name falls back display name, then email, then the unknown label (also for blank names);
 * - a row without its ids isn't a member and is dropped; a missing role reads as a member.
 *
 * Run: bun scripts/check-workspace-members.ts (exits 1 on any failure).
 */
import {
  getMemberDisplayName,
  toWorkspaceMemberRows,
  type MemberProfileViewRow,
} from '../utils/workspace-member';

let passes = 0;
let failures = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passes += 1;
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
}

const UNKNOWN = 'Unknown';
const owner: MemberProfileViewRow = {
  workspace_id: 'w1',
  user_id: 'u1',
  role: 'owner',
  joined_at: '2026-01-01T00:00:00Z',
  display_name: 'Olivia Owner',
  email: 'olivia@example.com',
  profile_image: 'https://img/o.png',
};
const coMember: MemberProfileViewRow = {
  workspace_id: 'w1',
  user_id: 'u2',
  role: 'member',
  joined_at: '2026-02-01T00:00:00Z',
  display_name: 'Max Member',
  email: 'max@example.com',
  profile_image: null,
};

function user(display_name: string | null, email: string | null) {
  return { users: { id: 'u', display_name, email, profile_image: null } };
}

const rows = toWorkspaceMemberRows([owner, coMember]);
check('keeps every member, in order', rows.map((r) => r.user_id).join() === 'u1,u2');
check('co-member keeps their name', rows[1]?.users.display_name === 'Max Member');
check('co-member keeps their email', rows[1]?.users.email === 'max@example.com');
check('owner keeps their photo', rows[0]?.users.profile_image === 'https://img/o.png');
check('users.id is the member id', rows[1]?.users.id === 'u2');
check(
  'co-member is not shown as unknown',
  getMemberDisplayName(rows[1]!, UNKNOWN) === 'Max Member',
);

check('falls back to email', getMemberDisplayName(user('', 'a@b.c'), UNKNOWN) === 'a@b.c');
check(
  'a blank name falls back to email',
  getMemberDisplayName(user('  ', 'a@b.c'), UNKNOWN) === 'a@b.c',
);
check(
  'falls back to unknown with neither',
  getMemberDisplayName(user(null, null), UNKNOWN) === UNKNOWN,
);
check(
  'a null users object reads as unknown',
  getMemberDisplayName({ users: null }, UNKNOWN) === UNKNOWN,
);

check(
  'drops a row with no user id',
  toWorkspaceMemberRows([{ ...coMember, user_id: null }]).length === 0,
);
check(
  'drops a row with no workspace id',
  toWorkspaceMemberRows([{ ...coMember, workspace_id: null }]).length === 0,
);
check(
  'a missing role reads as member',
  toWorkspaceMemberRows([{ ...coMember, role: null }])[0]?.role === 'member',
);
check('empty in, empty out', toWorkspaceMemberRows([]).length === 0);

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
