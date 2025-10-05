import { RequestHandler } from "express";
import { storage } from "../storage";
import { getUserEnterpriseRole, type TeamMemberRole } from "../teams/authorization";

const roleHierarchy: Record<TeamMemberRole, number> = {
  'viewer': 1,
  'editor': 2,
  'admin': 3,
  'owner': 4
};

export function requireEnterpriseRole(
  minRole: TeamMemberRole | TeamMemberRole[]
): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const enterpriseId = req.params.enterpriseId || req.body?.enterpriseId;
      if (!enterpriseId) {
        return res.status(400).json({ error: "Enterprise ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.role === 'admin') {
        const enterprise = await storage.getEnterprise(enterpriseId);
        if (!enterprise) {
          return res.status(404).json({ error: "Enterprise not found" });
        }
        
        req.enterprise = enterprise;
        req.userRole = 'owner';
        return next();
      }

      const userRole = await getUserEnterpriseRole(userId, enterpriseId);
      
      if (!userRole) {
        return res.status(404).json({ 
          error: "Not found"
        });
      }

      const requiredRoles = Array.isArray(minRole) ? minRole : [minRole];
      const userRoleLevel = roleHierarchy[userRole];
      const hasPermission = requiredRoles.some(role => userRoleLevel >= roleHierarchy[role]);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Forbidden - insufficient permissions",
          message: `This action requires one of: ${requiredRoles.join(', ')}`,
          currentRole: userRole
        });
      }

      const enterprise = await storage.getEnterprise(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      req.enterprise = enterprise;
      req.userRole = userRole;

      next();
    } catch (error) {
      console.error("Error checking enterprise role:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
