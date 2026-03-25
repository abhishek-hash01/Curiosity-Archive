import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Goal, LearningEntry, Project, Week, Tag } from '../types';

interface StoreState extends AppState {
  // Actions
  addGoal: (weekId: string, text: string, daySelected?: string) => void;
  toggleGoal: (weekId: string, goalId: string) => void;
  removeGoal: (weekId: string, goalId: string) => void;
  setGoalDay: (weekId: string, goalId: string, daySelected?: string) => void;
  addLearning: (weekId: string, text: string, tags: Tag[], relatesTo?: string[]) => void;
  updateWeekReflection: (weekId: string, reflection: string) => void;
  addProject: (name: string, tags: Tag[]) => void;
  removeProject: (projectId: string) => void;
  importData: (data: AppState) => void;
  initializeWeek: (weekId: string, startDate: string) => void;
  mergeWeekInto: (sourceWeekId: string, targetWeekId: string) => void;
  removeLearning: (weekId: string, learningId: string) => void;
  updateLearning: (weekId: string, learningId: string, newText: string, newTags: string[]) => void;
  updateWeekTitle: (weekId: string, title: string) => void;
  updateReflectionSections: (weekId: string, sections: { wentWell: string; surprised: string; different: string }) => void;
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

      addGoal: (weekId, text, daySelected) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const newGoal: Goal = {
            id: uuidv4(),
            text,
            completed: false,
            createdAt: Date.now(),
            daySelected
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
                goals: week.goals.map((g) => {
                  if (g.id === goalId) {
                    const isNowCompleted = !g.completed;
                    return { 
                      ...g, 
                      completed: isNowCompleted,
                      completedAt: isNowCompleted ? Date.now() : undefined
                    };
                  }
                  return g;
                }),
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

      setGoalDay: (weekId, goalId, daySelected) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: week.goals.map((g) =>
                  g.id === goalId ? { ...g, daySelected } : g
                ),
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

      mergeWeekInto: (sourceWeekId, targetWeekId) =>
        set((state) => {
          const source = state.weeks[sourceWeekId];
          const target = state.weeks[targetWeekId];
          if (!source || !target) return state;

          // Merge goals — skip any already present in target (by id)
          const existingGoalIds = new Set(target.goals.map((g) => g.id));
          const newGoals = source.goals
            .filter((g) => !existingGoalIds.has(g.id))
            .map((g) => ({ ...g, completed: false, completedAt: undefined }));

          // Merge learnings — skip duplicates
          const existingLearningIds = new Set(target.learnings.map((l) => l.id));
          const newLearnings = source.learnings.filter(
            (l) => !existingLearningIds.has(l.id)
          );

          return {
            weeks: {
              ...state.weeks,
              [targetWeekId]: {
                ...target,
                goals: [...target.goals, ...newGoals],
                learnings: [...target.learnings, ...newLearnings],
              },
            },
          };
        }),

      removeLearning: (weekId, learningId) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                learnings: week.learnings.filter((l) => l.id !== learningId),
              },
            },
          };
        }),

      updateWeekTitle: (weekId, title) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          return {
            weeks: {
              ...state.weeks,
              [weekId]: { ...week, weekTitle: title },
            },
          };
        }),

      updateLearning: (weekId, learningId, newText, newTags) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                learnings: week.learnings.map((l) =>
                  l.id === learningId ? { ...l, text: newText, tags: newTags } : l
                ),
              },
            },
          };
        }),

      updateReflectionSections: (weekId, sections) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          return {
            weeks: {
              ...state.weeks,
              [weekId]: { ...week, reflectionSections: sections },
            },
          };
        }),
    }),
    {
      name: 'curiosity-archive-storage', // name of item in the storage (must be unique)
    }
  )
);
