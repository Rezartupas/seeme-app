export interface Profile {
  id: string;
  email: string | null;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  telegram_chat_id: string | null;
  telegram_link_code: string | null;
  telegram_link_code_expires_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  isImportant: boolean;
  isUrgent: boolean;
  status: "pending" | "completed";
  reminderAt?: string; // ISO datetime
  reminderSent: boolean;
  categoryIds: string[];
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex
}

export type QuadrantKey = "q1" | "q2" | "q3" | "q4";

export interface Quadrant {
  key: QuadrantKey;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
  tagRotation: string;
  tagPosition: string;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  name: string | null;
  email?: string | null;
  avatar_url: string | null;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted";
  createdAt: string;
  respondedAt: string | null;
  friendProfile?: PublicProfile;
}

export interface Activity {
  id: string;
  userId: string;
  taskId: string;
  type: "task_created" | "task_completed" | "task_shared";
  title: string;
  status: "pending" | "completed";
  startTime: string | null;
  endTime: string | null;
  sharedAt: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  activityId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: "friend_request" | "friend_accepted" | "comment" | "reaction";
  activityId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
}
