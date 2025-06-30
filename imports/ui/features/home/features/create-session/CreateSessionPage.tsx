import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { KawaiiButton } from '../../../../common-ui/kawaii-button/KawaiiButton';
import { KawaiiInput } from '../../../../common-ui/kawaii-input/KawaiiInput';
import { QuestionEditor } from './features/question-editor/QuestionEditor';
import { AuthContext } from '../../../../auth-context/AuthContext';
import { generateId } from '../../../../auth-context/utils/generateId';
import { generateCode } from '../../../../auth-context/utils/generateCode';

export const CreateSessionPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: undefined,
      answers: [],
      showCorrectAnswer: true,
      showWhoVoted: false,
    };
    setQuestions([...questions, newQuestion]);
    setEditingIndex(questions.length);
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const saveSession = () => {
    console.log('TITLE = ', title);
    console.log('questions = ', questions);
    if (!title.trim() || questions.length === 0) return;

    const newSession: Session = {
      id: generateId(),
      code: generateCode(),
      title,
      adminId: user!.id,
      questions: questions.filter((q) => q.question.trim()),
      isActive: false,
      currentQuestionIndex: 0,
      participants: [],
    };
    console.log('newSession = ', newSession);

    Meteor.call('sessions.insert', newSession, (err: any) => {
      if (err) {
        console.error('Failed to create session', err);
        return;
      }

      navigate(`/session/${newSession.code}/admin`);
    });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <div className='flex items-center justify-between mb-8'>
            <h1 className='text-3xl font-bold text-purple-600'>
              ✨ Create Session
            </h1>
            <KawaiiButton onClick={() => navigate('/')} variant='secondary'>
              🏠 Back Home
            </KawaiiButton>
          </div>

          <div className='mb-6'>
            <KawaiiInput
              placeholder='Session title 🎪'
              value={title}
              onChange={setTitle}
              autoFocus
            />
          </div>

          <div className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold text-purple-600'>
                Questions 📝
              </h2>
              <KawaiiButton onClick={addQuestion}>➕ Add Question</KawaiiButton>
            </div>

            <div className='space-y-4'>
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  isEditing={editingIndex === index}
                  onEdit={() => setEditingIndex(index)}
                  onSave={(updatedQuestion) => {
                    updateQuestion(index, updatedQuestion);
                    setEditingIndex(null);
                  }}
                  onDelete={() => deleteQuestion(index)}
                />
              ))}
            </div>
          </div>

          <div className='flex justify-end'>
            <KawaiiButton
              onClick={saveSession}
              disabled={!title.trim() || questions.length === 0}
            >
              🚀 Create Session
            </KawaiiButton>
          </div>
        </div>
      </div>
    </div>
  );
};
