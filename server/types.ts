import { TeamMemberRole } from "./teams/authorization";

declare global {
  namespace Express {
    interface Request {
      enterpriseRole?: TeamMemberRole;
    }
  }
}

export {};
