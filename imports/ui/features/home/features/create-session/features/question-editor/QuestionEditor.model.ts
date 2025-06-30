interface Answer {
  userId: string;
  userName: string;
  answer: string | number;
  timestamp: number;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'open-text';
  question: string;
  options?: string[];
  correctAnswer?: number;
  answers: Answer[];
  showCorrectAnswer: boolean;
  showWhoVoted: boolean;
}
