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
