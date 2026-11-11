/** A row of `public.workspace_member_profiles`: a workspace member with their profile fields. */
export type MemberProfileViewRow = {
  workspace_id: string | null;
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
  display_name: string | null;
  email: string | null;
  profile_image: string | null;
};

export type WorkspaceMemberRow = {
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  users: {
    id: string;
    display_name: string | null;
    email: string | null;
    profile_image: string | null;
  };
};

/**
 * The Members list's shape from the view's rows. Generated view columns are all nullable, but the
 * view joins `workspace_members` to `users`, so a row without its ids isn't a member and is dropped.
 */
export function toWorkspaceMemberRows(rows: readonly MemberProfileViewRow[]): WorkspaceMemberRow[] {
  return rows.flatMap((row) => {
    if (!row.workspace_id || !row.user_id) return [];
    return [
      {
        workspace_id: row.workspace_id,
        user_id: row.user_id,
        role: row.role ?? 'member',
        joined_at: row.joined_at ?? '',
        users: {
          id: row.user_id,
          display_name: row.display_name,
          email: row.email,
          profile_image: row.profile_image,
        },
      },
    ];
  });
}

/** A member's name: their display name, else their email, else `unknownLabel`. */
export function getMemberDisplayName(
  member: Pick<WorkspaceMemberRow, 'users'> | { users: WorkspaceMemberRow['users'] | null },
  unknownLabel: string,
): string {
  return member.users?.display_name?.trim() || member.users?.email?.trim() || unknownLabel;
}
