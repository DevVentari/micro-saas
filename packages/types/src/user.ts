export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

import type { Subscription } from "./subscription";

export interface UserProfile extends User {
  subscription?: Subscription;
}
