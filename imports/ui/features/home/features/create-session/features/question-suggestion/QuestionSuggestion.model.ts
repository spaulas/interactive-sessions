interface QuestionSuggestion {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  question: string;
  options?: string[];
  type: 'multiple-choice' | 'open-text';
  status: 'pending' | 'approved' | 'used';
  timestamp: number;
}
