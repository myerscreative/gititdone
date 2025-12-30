export type Category = string;

export interface Task {
  id: string;
  title: string;
  category: Category;
  description?: string;
  
  // Hormozi Value Equation Factors (1-10)
  outcome: number;   // Dream Outcome
  certainty: number; // Perceived Likelihood of Achievement
  delay: number;     // Time Delay (Lower is better, but equation is typically Outcome * Certainty / Delay * Effort)
                     // In our app, we might want to normalize inputs. 
                     // Standard Equation: Value = (Outcome * Certainty) / (Delay * Effort)
                     // We will treat inputs as "Score" where 10 is best for numerator, and 1 is best for denominator?
                     // actually let's store raw 1-10 user inputs and calculate Value in logic.
  effort: number;    // Effort & Sacrifice
  
  valueScore: number; // Calculated property
  
  createdAt: number;
}

export interface DailyList {
  date: string; // ISO Date YYYY-MM-DD
  taskIds: string[]; // Max 3
}
