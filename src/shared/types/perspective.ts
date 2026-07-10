export interface Card {
  perspective: string;   // motivation-based label e.g. "Looking for Simplicity"
  driver: string;        // what the user is trying to achieve
  thought: string;       // first-person reaction
  highlight?: string;
  worry?: string;        // what they're afraid of
  assumption?: string;   // underlying belief driving their behavior
  name?: string;         // humanised persona name e.g. "Marcus"
  age?: number;          // persona age
  occupation?: string;   // persona occupation
  manual?: boolean;      // added by the user, not AI-simulated
}
