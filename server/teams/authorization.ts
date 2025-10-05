import { storage } from "../storage";

export type TeamMemberRole = 'viewer' | 'editor' | 'admin' | 'owner';

const roleHierarchy: Record<TeamMemberRole, number> = {
  'viewer': 1,
  'editor': 2,
  'admin': 3,
  'owner': 4
};

export async function getUserEnterpriseRole(userId: string, enterpriseId: string): Promise<TeamMemberRole | null> {
  const teamMember = await storage.getTeamMemberByUserAndEnterprise(userId, enterpriseId);
  
  if (!teamMember || teamMember.status !== 'active') {
    return null;
  }
  
  return teamMember.role as TeamMemberRole;
}

export function canManageTeam(role: TeamMemberRole): boolean {
  return roleHierarchy[role] >= roleHierarchy['admin'];
}

export function canEditEnterprise(role: TeamMemberRole): boolean {
  return roleHierarchy[role] >= roleHierarchy['editor'];
}

export function canViewEnterprise(role: TeamMemberRole): boolean {
  return roleHierarchy[role] >= roleHierarchy['viewer'];
}

export function canInviteMembers(role: TeamMemberRole): boolean {
  return roleHierarchy[role] >= roleHierarchy['admin'];
}

export function canRemoveMembers(role: TeamMemberRole): boolean {
  return roleHierarchy[role] >= roleHierarchy['admin'];
}

export function canChangeRole(currentRole: TeamMemberRole, targetRole: TeamMemberRole): boolean {
  const currentLevel = roleHierarchy[currentRole];
  const targetLevel = roleHierarchy[targetRole];
  
  return currentLevel >= targetLevel;
}
