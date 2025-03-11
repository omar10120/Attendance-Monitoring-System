import { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: Role;
  department: string | null;
  position: string | null;
}
