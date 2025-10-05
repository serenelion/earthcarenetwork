import { Router, type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { storage } from "../storage";
import { nanoid } from "nanoid";
import { z } from "zod";
import { insertEnterpriseInvitationSchema, enterpriseTeamMembers } from "@shared/schema";
import { getUserEnterpriseRole, type TeamMemberRole } from "./authorization";
import { db } from "../db";
import { and, eq, gt, lt } from "drizzle-orm";

const enterpriseRouter = Router();
const teamRouter = Router();

function requireEnterpriseRole(minRole: TeamMemberRole): RequestHandler {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const enterpriseId = req.params.id;
      if (!enterpriseId) {
        return res.status(400).json({ error: "Enterprise ID is required" });
      }

      const roleHierarchy: Record<TeamMemberRole, number> = {
        'viewer': 1,
        'editor': 2,
        'admin': 3,
        'owner': 4
      };

      const userRole = await getUserEnterpriseRole(userId, enterpriseId);
      
      if (!userRole) {
        return res.status(403).json({ 
          error: "Forbidden - not a member of this enterprise" 
        });
      }

      const userRoleLevel = roleHierarchy[userRole];
      const requiredRoleLevel = roleHierarchy[minRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          error: "Forbidden - insufficient permissions",
          message: `This action requires ${minRole} role or higher`,
          requiredRole: minRole,
          currentRole: userRole
        });
      }

      req.enterpriseRole = userRole;

      next();
    } catch (error) {
      console.error("Error checking enterprise role:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

const invitationBodySchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(['viewer', 'editor', 'admin'], {
    errorMap: () => ({ message: "Role must be viewer, editor, or admin" })
  })
});

enterpriseRouter.post('/:id/team/invitations', requireEnterpriseRole('admin'), async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const enterpriseId = req.params.id;

    const validationResult = invitationBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validationResult.error.errors 
      });
    }

    const { email, role } = validationResult.data;

    const enterprise = await storage.getEnterprise(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ error: "Enterprise not found" });
    }

    const user = await storage.getUserByEmail(email);

    if (user) {
      const existingMember = await storage.getTeamMemberByUserAndEnterprise(user.id, enterpriseId);
      
      if (existingMember && existingMember.status === 'active') {
        return res.status(409).json({ 
          error: "User is already a team member" 
        });
      }
    }

    const existingInvitations = await storage.getEnterpriseInvitations(enterpriseId);
    const pendingInvitation = existingInvitations.find(
      inv => inv.email === email && inv.status === 'pending'
    );

    if (pendingInvitation) {
      return res.status(409).json({ 
        error: "Invitation already exists for this email" 
      });
    }

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await storage.createInvitation({
      enterpriseId,
      email,
      role,
      inviterId: userId,
      token,
      expiresAt,
      status: 'pending',
      acceptedBy: null,
      acceptedAt: null
    });

    const acceptUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/team/invitations/accept/${token}`;
    
    console.log('=== INVITATION EMAIL (STUB) ===');
    console.log(`To: ${email}`);
    console.log(`Subject: You've been invited to join ${enterprise.name}`);
    console.log(`
Dear User,

You have been invited to join ${enterprise.name} as a ${role}.

To accept this invitation, please click the link below:
${acceptUrl}

This invitation will expire on ${expiresAt.toLocaleString()}.

Best regards,
The Team
    `);
    console.log('=== END EMAIL ===');

    res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to create invitation", message: errorMessage });
  }
});

teamRouter.post('/invitations/:token/accept', async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { token } = req.params;

    const invitation = await storage.getInvitationByToken(token);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: "Invitation already processed", 
        status: invitation.status 
      });
    }

    if (new Date() > invitation.expiresAt) {
      await storage.updateInvitation(invitation.id, { status: 'expired' });
      return res.status(400).json({ error: "Invitation has expired" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.email !== invitation.email) {
      return res.status(403).json({ 
        error: "This invitation is for a different email address" 
      });
    }

    const existingMember = await storage.getTeamMemberByUserAndEnterprise(userId, invitation.enterpriseId);
    if (existingMember) {
      await storage.updateInvitation(invitation.id, { status: 'accepted', acceptedBy: userId, acceptedAt: new Date() });
      return res.status(200).json({ 
        success: true,
        message: "You are already a member of this enterprise",
        teamMember: existingMember
      });
    }

    const teamMember = await storage.createTeamMember({
      enterpriseId: invitation.enterpriseId,
      userId,
      role: invitation.role,
      invitedBy: invitation.inviterId,
      invitedAt: invitation.createdAt || new Date(),
      acceptedAt: new Date(),
      status: 'active'
    });

    await storage.updateInvitation(invitation.id, {
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: new Date()
    });

    const enterprise = await storage.getEnterprise(invitation.enterpriseId);

    res.json({
      success: true,
      message: "Invitation accepted successfully",
      teamMember: {
        id: teamMember.id,
        enterpriseId: teamMember.enterpriseId,
        enterpriseName: enterprise?.name,
        role: teamMember.role,
        status: teamMember.status,
        acceptedAt: teamMember.acceptedAt
      }
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to accept invitation", message: errorMessage });
  }
});

enterpriseRouter.get('/:id/team/invitations', requireEnterpriseRole('admin'), async (req: any, res: Response) => {
  try {
    const enterpriseId = req.params.id;

    const allInvitations = await storage.getEnterpriseInvitations(enterpriseId);
    const pendingInvitations = allInvitations.filter(inv => inv.status === 'pending');

    const invitationsWithInviter = await Promise.all(
      pendingInvitations.map(async (invitation) => {
        const inviter = await storage.getUser(invitation.inviterId);
        return {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          inviter: inviter ? {
            id: inviter.id,
            email: inviter.email,
            firstName: inviter.firstName,
            lastName: inviter.lastName,
            profileImageUrl: inviter.profileImageUrl
          } : null
        };
      })
    );

    res.json({
      success: true,
      invitations: invitationsWithInviter,
      count: invitationsWithInviter.length
    });
  } catch (error) {
    console.error("Error fetching enterprise invitations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch invitations", message: errorMessage });
  }
});

teamRouter.get('/invitations', async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return res.status(401).json({ error: "User not found or email not set" });
    }

    const allInvitations = await storage.getUserInvitations(user.email);
    
    const now = new Date();
    const pendingNotExpiredInvitations = allInvitations.filter(
      inv => inv.status === 'pending' && inv.expiresAt > now
    );

    const invitationsWithDetails = pendingNotExpiredInvitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      token: inv.token,
      enterprise: {
        id: inv.enterprise.id,
        name: inv.enterprise.name,
        description: inv.enterprise.description,
        category: inv.enterprise.category,
        location: inv.enterprise.location,
        imageUrl: inv.enterprise.imageUrl
      }
    }));

    res.json({
      success: true,
      invitations: invitationsWithDetails,
      count: invitationsWithDetails.length
    });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch invitations", message: errorMessage });
  }
});

enterpriseRouter.delete('/:id/team/invitations/:invitationId', requireEnterpriseRole('admin'), async (req: any, res: Response) => {
  try {
    const { id: enterpriseId, invitationId } = req.params;

    const invitation = await storage.getInvitation(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.enterpriseId !== enterpriseId) {
      return res.status(403).json({ 
        error: "This invitation does not belong to this enterprise" 
      });
    }

    await storage.updateInvitation(invitationId, { status: 'cancelled' });

    res.json({
      success: true,
      message: "Invitation cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to cancel invitation", message: errorMessage });
  }
});

enterpriseRouter.get('/:id/team', requireEnterpriseRole('viewer'), async (req: any, res: Response) => {
  try {
    const enterpriseId = req.params.id;

    const allMembers = await storage.getTeamMembers(enterpriseId);
    
    const activeMembers = allMembers.filter(member => member.status === 'active');

    const roleOrder: Record<TeamMemberRole, number> = {
      'owner': 1,
      'admin': 2,
      'editor': 3,
      'viewer': 4
    };

    const membersWithDetails = await Promise.all(
      activeMembers.map(async (member) => {
        const inviter = member.invitedBy ? await storage.getUser(member.invitedBy) : null;
        
        return {
          id: member.id,
          userId: member.userId,
          user: {
            id: member.user.id,
            email: member.user.email,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            profileImageUrl: member.user.profileImageUrl
          },
          role: member.role,
          status: member.status,
          joinDate: member.acceptedAt || member.invitedAt,
          invitedAt: member.invitedAt,
          acceptedAt: member.acceptedAt,
          inviter: inviter ? {
            id: inviter.id,
            email: inviter.email,
            firstName: inviter.firstName,
            lastName: inviter.lastName,
            profileImageUrl: inviter.profileImageUrl
          } : null
        };
      })
    );

    membersWithDetails.sort((a, b) => {
      const roleComparison = roleOrder[a.role as TeamMemberRole] - roleOrder[b.role as TeamMemberRole];
      if (roleComparison !== 0) return roleComparison;
      
      const aName = `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email || '';
      const bName = `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || b.user.email || '';
      return aName.localeCompare(bName);
    });

    res.json({
      success: true,
      members: membersWithDetails,
      count: membersWithDetails.length
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch team members", message: errorMessage });
  }
});

const updateRoleSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin', 'owner'], {
    errorMap: () => ({ message: "Role must be viewer, editor, admin, or owner" })
  })
});

enterpriseRouter.patch('/:id/team/:memberId', requireEnterpriseRole('admin'), async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { id: enterpriseId, memberId } = req.params;

    const validationResult = updateRoleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validationResult.error.errors 
      });
    }

    const { role: newRole } = validationResult.data;

    const teamMember = await storage.getTeamMember(memberId);
    if (!teamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    if (teamMember.enterpriseId !== enterpriseId) {
      return res.status(403).json({ 
        error: "This team member does not belong to this enterprise" 
      });
    }

    if (teamMember.userId === userId) {
      return res.status(403).json({ 
        error: "Forbidden - cannot change your own role" 
      });
    }

    const currentUserRole = await getUserEnterpriseRole(userId, enterpriseId);
    if (!currentUserRole) {
      return res.status(403).json({ error: "Forbidden - not a member of this enterprise" });
    }

    const { canChangeRole } = await import("./authorization");
    if (!canChangeRole(currentUserRole, newRole as TeamMemberRole)) {
      return res.status(403).json({ 
        error: "Forbidden - insufficient permissions to assign this role",
        message: `Your role (${currentUserRole}) cannot promote users to ${newRole}`
      });
    }

    if (newRole === 'owner' && currentUserRole !== 'owner') {
      return res.status(403).json({ 
        error: "Forbidden - only owners can promote to owner role" 
      });
    }

    if (teamMember.role === 'owner') {
      const allMembers = await storage.getTeamMembers(enterpriseId);
      const activeOwners = allMembers.filter(m => m.role === 'owner' && m.status === 'active');
      
      if (activeOwners.length <= 1) {
        return res.status(409).json({ 
          error: "Business rule violation - cannot demote the last owner",
          message: "There must be at least one owner for the enterprise"
        });
      }
    }

    const updatedMember = await storage.updateTeamMember(memberId, { role: newRole });

    const user = await storage.getUser(teamMember.userId);

    res.json({
      success: true,
      message: "Team member role updated successfully",
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        } : null,
        role: updatedMember.role,
        status: updatedMember.status,
        updatedAt: updatedMember.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating team member role:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to update team member role", message: errorMessage });
  }
});

enterpriseRouter.delete('/:id/team/:memberId', requireEnterpriseRole('admin'), async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { id: enterpriseId, memberId } = req.params;

    const teamMember = await storage.getTeamMember(memberId);
    if (!teamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    if (teamMember.enterpriseId !== enterpriseId) {
      return res.status(403).json({ 
        error: "This team member does not belong to this enterprise" 
      });
    }

    if (teamMember.userId === userId) {
      return res.status(403).json({ 
        error: "Forbidden - cannot remove yourself from the team" 
      });
    }

    if (teamMember.role === 'owner') {
      const allMembers = await storage.getTeamMembers(enterpriseId);
      const activeOwners = allMembers.filter(m => m.role === 'owner' && m.status === 'active');
      
      if (activeOwners.length <= 1) {
        return res.status(409).json({ 
          error: "Business rule violation - cannot remove the last owner",
          message: "There must be at least one owner for the enterprise"
        });
      }
    }

    await storage.updateTeamMember(memberId, { status: 'inactive' });

    res.json({
      success: true,
      message: "Team member removed successfully"
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to remove team member", message: errorMessage });
  }
});

teamRouter.get('/team-memberships', async (req: any, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allEnterprises = await storage.getEnterprises();
    
    const membershipsWithDetails = await Promise.all(
      allEnterprises.map(async (enterprise) => {
        const teamMember = await storage.getTeamMemberByUserAndEnterprise(userId, enterprise.id);
        
        if (teamMember && teamMember.status === 'active') {
          return {
            id: teamMember.id,
            role: teamMember.role,
            joinDate: teamMember.acceptedAt || teamMember.invitedAt,
            status: teamMember.status,
            enterprise: {
              id: enterprise.id,
              name: enterprise.name,
              description: enterprise.description,
              category: enterprise.category,
              location: enterprise.location,
              imageUrl: enterprise.imageUrl,
              isVerified: enterprise.isVerified
            }
          };
        }
        
        return null;
      })
    );

    const activeMemberships = membershipsWithDetails.filter(m => m !== null);

    res.json({
      success: true,
      memberships: activeMemberships,
      count: activeMemberships.length
    });
  } catch (error) {
    console.error("Error fetching team memberships:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch team memberships", message: errorMessage });
  }
});

export const enterpriseTeamRouter = enterpriseRouter;
export const teamInvitationRouter = teamRouter;
