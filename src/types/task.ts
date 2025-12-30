export type TaskCategory = string;

export interface HormoziScore {
  outcome: number; // 0-10
  certainty: number; // 0-10
  delay: number; // 0-10 (time delay, lower is better?) -> Formula: (Outcome * Certainty) / (Delay * Effort)
                 // Delay: usually 1 is immediate, 10 is years. So higher is worse.
                 // Wait, formula is Value = (Outcome * Certainty) / (Delay * Effort).
                 // So Delay should be "Time to Reward". 
                 // If delay is 0 impossible. So we use scale 1-10 where 1 is fast? Or 1 is slow?
                 // Formula implies Small Delay = Higher Value. So Delay=1 (Immediate), Delay=10 (Forever).
  effort: number; // 0-10
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  isDaily3: boolean; // Is it currently in the Daily 3 list?
  completed: boolean;
  notes?: string;
  scoreVariables: HormoziScore;
  calculatedScore: number;
  peopleInvolved?: string[]; // For Scripting Assistant
  magicWords?: string; // Phil M. Jones Execution Script
  createdAt: number;
}
