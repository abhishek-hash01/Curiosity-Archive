export type Tag = string;

export interface Branch {
  id: string;
  label: string;
  goals: Goal[];
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  daySelected?: string; // e.g. "Monday", "Tuesday"
  
  // Conditional planning features
  type?: 'regular' | 'conditional';
  branches?: Branch[];
  selectedBranchId?: string;
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
  weekTitle?: string; // optional theme e.g. "Outreach Heavy"
  dayTitles?: Record<string, string>; // e.g. { "Monday": "Deep Work Day" }
  goals: Goal[];
  learnings: LearningEntry[];
  weekReflection?: string; // legacy single-text
  reflectionSections?: {
    wentWell: string;
    surprised: string;
    different: string;
  };
}

// Utility type for the overall app state
export interface AppState {
  weeks: Record<string, Week>; // Keyed by Week ID
  projects: Record<string, Project>; // Keyed by Project ID
}
