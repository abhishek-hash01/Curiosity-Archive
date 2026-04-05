import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Goal, LearningEntry, Project, Week, Tag } from '../types';

interface StoreState extends AppState {
  // Actions
  addGoal: (weekId: string, text: string, daySelected?: string) => void;
  addConditionalGoal: (weekId: string, text: string, daySelected: string | undefined, branches: { label: string; tasks: string[] }[]) => void;
  selectBranch: (weekId: string, goalId: string, branchId: string) => void;
  toggleNestedGoal: (weekId: string, goalId: string, branchId: string, nestedGoalId: string) => void;
  updateDayTitle: (weekId: string, dayLabel: string, title: string) => void;
  toggleGoal: (weekId: string, goalId: string) => void;
  addSubGoal: (weekId: string, parentGoalId: string, text: string) => void;
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
  updateGoalNote: (weekId: string, goalId: string, note: string) => void;
  updateReflectionSections: (weekId: string, sections: { wentWell: string; surprised: string; different: string }) => void;
}

// Helper for recursive completion toggle
const toggleGoalRecursive = (goals: Goal[], targetId: string, newState?: boolean): { goals: Goal[], found: boolean } => {
  let found = false;
  const newGoals = goals.map(g => {
    if (g.id === targetId) {
      found = true;
      const updatedCompleted = newState !== undefined ? newState : !g.completed;
      // If we found the target, toggle it and all its children to the same state
      return {
        ...g,
        completed: updatedCompleted,
        completedAt: updatedCompleted ? (g.completedAt || Date.now()) : undefined,
        subGoals: g.subGoals ? toggleAllChildren(g.subGoals, updatedCompleted) : undefined
      };
    }
    if (g.subGoals) {
      const result = toggleGoalRecursive(g.subGoals, targetId, newState);
      if (result.found) {
        found = true;
        const updatedSubGoals = result.goals;
        // If child was toggled, parent auto-completes only if all children are done
        const allChildrenDone = updatedSubGoals.every(sub => sub.completed);
        return {
          ...g,
          completed: allChildrenDone,
          completedAt: allChildrenDone ? (g.completedAt || Date.now()) : undefined,
          subGoals: updatedSubGoals
        };
      }
    }
    return g;
  });
  return { goals: newGoals, found };
};

const toggleAllChildren = (goals: Goal[], completed: boolean): Goal[] => {
  return goals.map(g => ({
    ...g,
    completed,
    completedAt: completed ? (g.completedAt || Date.now()) : undefined,
    subGoals: g.subGoals ? toggleAllChildren(g.subGoals, completed) : undefined
  }));
};

// Helper for recursive removal
const removeGoalRecursive = (goals: Goal[], targetId: string): Goal[] => {
  return goals
    .filter(g => g.id !== targetId)
    .map(g => ({
      ...g,
      subGoals: g.subGoals ? removeGoalRecursive(g.subGoals, targetId) : undefined
    }));
};

// Helper for recursive day update
const setGoalDayRecursive = (goals: Goal[], targetId: string, daySelected: string | undefined): Goal[] => {
  return goals.map(g => {
    if (g.id === targetId) {
      return { ...g, daySelected };
    }
    if (g.subGoals) {
      return { ...g, subGoals: setGoalDayRecursive(g.subGoals, targetId, daySelected) };
    }
    return g;
  });
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      weeks: {},
      projects: {},

      initializeWeek: (weekId, startDate) =>
        set((state) => {
          if (state.weeks[weekId]) return state; // Already exists

          // Find the most recent previous week to carry over backlog tasks
          const pastWeekIds = Object.keys(state.weeks)
            .filter(id => id < weekId)
            .sort();
          
          let carriedOverGoals: Goal[] = [];
          
          if (pastWeekIds.length > 0) {
            const mostRecentPastId = pastWeekIds[pastWeekIds.length - 1];
            const pastWeek = state.weeks[mostRecentPastId];
            
            // Carry over incomplete "Anytime" goals
            carriedOverGoals = pastWeek.goals
              .filter(g => !g.completed && (!g.daySelected || g.daySelected === 'Sunday'))
              .map(g => ({
                ...g,
                id: uuidv4(), // Give it a new ID for the new week
                createdAt: Date.now(),
              }));
          }

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                id: weekId,
                startDate,
                goals: carriedOverGoals,
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

      addConditionalGoal: (weekId, text, daySelected, branches) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const newGoal: Goal = {
            id: uuidv4(),
            text,
            completed: false,
            createdAt: Date.now(),
            daySelected,
            type: 'conditional',
            branches: branches.map(b => ({
              id: uuidv4(),
              label: b.label,
              goals: b.tasks.filter(t => t.trim() !== '').map(t => ({
                id: uuidv4(),
                text: t,
                completed: false,
                createdAt: Date.now()
              }))
            }))
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

      selectBranch: (weekId, goalId, branchId) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: week.goals.map((g) =>
                  g.id === goalId ? { ...g, selectedBranchId: branchId } : g
                ),
              },
            },
          };
        }),

      toggleNestedGoal: (weekId, goalId, branchId, nestedGoalId) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: week.goals.map((g) => {
                  if (g.id === goalId && g.branches) {
                    return {
                      ...g,
                      branches: g.branches.map(b => {
                        if (b.id === branchId) {
                          return {
                            ...b,
                            goals: b.goals.map(ng => {
                              if (ng.id === nestedGoalId) {
                                const isNowCompleted = !ng.completed;
                                return {
                                  ...ng,
                                  completed: isNowCompleted,
                                  completedAt: isNowCompleted ? Date.now() : undefined
                                };
                              }
                              return ng;
                            })
                          };
                        }
                        return b;
                      })
                    };
                  }
                  return g;
                }),
              },
            },
          };
        }),

      updateDayTitle: (weekId, dayLabel, title) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;
          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                dayTitles: {
                  ...week.dayTitles,
                  [dayLabel]: title,
                },
              },
            },
          };
        }),

      toggleGoal: (weekId, goalId) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const { goals } = toggleGoalRecursive(week.goals, goalId);

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals,
              },
            },
          };
        }),

      addSubGoal: (weekId, parentGoalId, text) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const addSubGoalRecursive = (goals: Goal[]): Goal[] => {
            return goals.map(g => {
              if (g.id === parentGoalId) {
                const newSubGoal: Goal = {
                  id: uuidv4(),
                  text,
                  completed: false, // Start as incomplete
                  createdAt: Date.now(),
                };
                return {
                  ...g,
                  completed: false, // If adding a sub-goal, parent should probably be incomplete?
                  subGoals: [...(g.subGoals || []), newSubGoal]
                };
              }
              if (g.subGoals) {
                return { ...g, subGoals: addSubGoalRecursive(g.subGoals) };
              }
              return g;
            });
          };

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: addSubGoalRecursive(week.goals),
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
                goals: removeGoalRecursive(week.goals, goalId),
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
                goals: setGoalDayRecursive(week.goals, goalId, daySelected),
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

      updateGoalNote: (weekId, goalId, note) =>
        set((state) => {
          const week = state.weeks[weekId];
          if (!week) return state;

          const updateNoteRecursive = (goals: Goal[]): Goal[] => {
            return goals.map(g => {
              if (g.id === goalId) {
                return { ...g, note };
              }
              if (g.subGoals) {
                return { ...g, subGoals: updateNoteRecursive(g.subGoals) };
              }
              return g;
            });
          };

          return {
            weeks: {
              ...state.weeks,
              [weekId]: {
                ...week,
                goals: updateNoteRecursive(week.goals),
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
