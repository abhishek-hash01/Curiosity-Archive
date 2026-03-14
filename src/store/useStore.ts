import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Goal, LearningEntry, Project, Week, Tag } from '../types';

interface StoreState extends AppState {
  // Actions
  addGoal: (weekId: string, text: string) => void;
  toggleGoal: (weekId: string, goalId: string) => void;
  removeGoal: (weekId: string, goalId: string) => void;
  addLearning: (weekId: string, text: string, tags: Tag[], relatesTo?: string[]) => void;
  updateWeekReflection: (weekId: string, reflection: string) => void;
  addProject: (name: string, tags: Tag[]) => void;
  removeProject: (projectId: string) => void;
  importData: (data: AppState) => void;
  initializeWeek: (weekId: string, startDate: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      weeks: {},
      projects: {},

      initializeWeek: (weekId, startDate) =>
        set((state) => {
          if (state.weeks[weekId]) return state; // Already exists
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                id: weekId,
                startDate,
                goals: [],
                learnings: [],
              },
            },
          };
        }),

      addGoal: (weekId, text) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const newGoal: Goal = {
            id: uuidv4(),
            text,
            completed: false,
            createdAt: Date.now(),
          };

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: [...week.goals, newGoal],
              },
            },
          };
        }),

      toggleGoal: (weekId, goalId) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: week.goals.map((g) =>
                  g.id === goalId ? { ...g, completed: !g.completed } : g
                ),
              },
            },
          };
        }),

      removeGoal: (weekId, goalId) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: week.goals.filter((g) => g.id !== goalId),
              },
            },
          };
        }),

      addLearning: (weekId, text, tags, relatesTo) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const newLearning: LearningEntry = {
            id: uuidv4(),
            text,
            tags: tags.map((t) => t.toLowerCase()), // normalize tags
            timestamp: Date.now(),
            relatesTo: relatesTo || [],
          };

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                learnings: [...week.learnings, newLearning],
              },
            },
          };
        }),

      updateWeekReflection: (weekId, reflection) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                weekReflection: reflection,
              },
            },
          };
        }),

      addProject: (name, tags) =>
        set((state) => {
          const newProject: Project = {
            id: uuidv4(),
            name,
            tags: tags.map((t) => t.toLowerCase()),
          };
          return {
            projects: {
              ...state.projects,
              [newProject.id]: newProject,
            },
          };
        }),

      removeProject: (projectId) =>
        set((state) => {
          const newProjects = { ...state.projects };
          delete newProjects[projectId];
          return { projects: newProjects };
        }),

      importData: (data) =>
        set(() => ({
          weeks: data.weeks || {},
          projects: data.projects || {},
        })),
    }),
    {
      name: 'curiosity-archive-storage', // name of item in the storage (must be unique)
    }
  )
);
