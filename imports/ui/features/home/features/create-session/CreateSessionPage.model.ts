interface Session {
  id: string;
  code: string;
  title: string;
  adminId: string;
  questions: Question[];
  isActive: boolean;
  currentQuestionIndex: number;
  participants: User[];
}
