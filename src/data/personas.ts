import p_m01 from '../assets/personas/persona-male-01.png';
import p_m02 from '../assets/personas/persona-male-02.png';
import p_m03 from '../assets/personas/persona-male-03.png';
import p_m04 from '../assets/personas/persona-male-04.png';
import p_f01 from '../assets/personas/persona-female-01.png';
import p_f02 from '../assets/personas/persona-female-02.png';
import p_f03 from '../assets/personas/persona-female-03.png';
import p_f04 from '../assets/personas/persona-female-04.png';

export interface Persona {
  id: string;
  image: string;
  name: string;
  age: number;
  occupation: string;
  city: string;
  personality: string;
  thoughts: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'pm',
    image: p_m01,
    name: 'Marcus',
    age: 34,
    occupation: 'Product Manager',
    city: 'San Francisco',
    personality: 'Power User',
    thoughts: [
      "I need this to integrate with my existing workflow.",
      "Where's the export to Notion?",
      "This could replace three tools we use.",
    ],
  },
  {
    id: 'designer',
    image: p_f01,
    name: 'Emily',
    age: 26,
    occupation: 'UX Designer',
    city: 'London',
    personality: 'Early Adopter',
    thoughts: [
      "I don't really understand why I need this.",
      "The interface feels promising but unclear.",
      "I'd share this with my team immediately.",
    ],
  },
  {
    id: 'student',
    image: p_m02,
    name: 'Aiden',
    age: 21,
    occupation: 'Student',
    city: 'Toronto',
    personality: 'First-time User',
    thoughts: [
      "This feels overwhelming at first glance.",
      "I expected something simpler.",
      "Not sure I have the budget for this.",
    ],
  },
  {
    id: 'parent',
    image: p_f02,
    name: 'Sarah',
    age: 38,
    occupation: 'Busy Parent',
    city: 'Austin',
    personality: 'Skeptic',
    thoughts: [
      "I'd probably skip this feature.",
      "This isn't clear to me.",
      "How long does this actually take?",
    ],
  },
  {
    id: 'founder',
    image: p_m03,
    name: 'Daniel',
    age: 42,
    occupation: 'Small Business Owner',
    city: 'Berlin',
    personality: 'Risk-Aware',
    thoughts: [
      "I need to see ROI before committing.",
      "This looks expensive for what it does.",
      "Does this replace a human researcher?",
    ],
  },
  {
    id: 'gamer',
    image: p_m04,
    name: 'Leo',
    age: 24,
    occupation: 'Gamer & Streamer',
    city: 'Seoul',
    personality: 'Efficiency-Oriented',
    thoughts: [
      "I'd use this to test game UX.",
      "Needs dark mode.",
      "This is actually clever.",
    ],
  },
  {
    id: 'researcher',
    image: p_f03,
    name: 'Priya',
    age: 31,
    occupation: 'UX Researcher',
    city: 'Singapore',
    personality: 'Analytical',
    thoughts: [
      "Where's the methodology documentation?",
      "I'm curious about the AI model behind this.",
      "This could augment my research, not replace it.",
    ],
  },
  {
    id: 'executive',
    image: p_f04,
    name: 'Claire',
    age: 45,
    occupation: 'VP of Product',
    city: 'New York',
    personality: 'Decision Maker',
    thoughts: [
      "I need a shareable report for stakeholders.",
      "How accurate is the AI simulation?",
      "This could save weeks of research time.",
    ],
  },
];
