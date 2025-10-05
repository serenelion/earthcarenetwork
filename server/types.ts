import { TeamMemberRole } from "./teams/authorization";
import { Enterprise } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      enterpriseRole?: TeamMemberRole;
      enterprise?: Enterprise;
      userRole?: TeamMemberRole;
    }
  }
}

export {};
