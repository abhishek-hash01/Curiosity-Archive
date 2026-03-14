export type Tag = string;

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  tags: Tag[];
}

export interface LearningEntry {
  id: string;
  text: string;
  tags: Tag[];
  timestamp: number;
  relatesTo?: string[]; // IDs of other LearningEntries
}

export interface Week {
  id: string; // e.g., "2023-W41"
  startDate: string; // ISO date string
  goals: Goal[];
  learnings: LearningEntry[];
  weekReflection?: string;
}

// Utility type for the overall app state
export interface AppState {
  weeks: Record<string, Week>; // Keyed by Week ID
  projects: Record<string, Project>; // Keyed by Project ID
}
