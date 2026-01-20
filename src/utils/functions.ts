import { Role, UserAsBA } from "@/types/models";

export function getUserRole(currentUser: UserAsBA | null): {
  role: Role | null;
} {
  if (!currentUser) {
    return { role: null };
  }

  return {
    role: currentUser.role as Role,
  };
}

