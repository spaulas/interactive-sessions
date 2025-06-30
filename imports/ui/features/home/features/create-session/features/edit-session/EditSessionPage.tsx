import { useState } from 'react';
import React from 'react';
import type { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KawaiiButton } from '../../../../../../common-ui/kawaii-button/KawaiiButton';
import { KawaiiInput } from '../../../../../../common-ui/kawaii-input/KawaiiInput';
import { QuestionEditor } from '../question-editor/QuestionEditor';
import { mockData } from '../../../../../../auth-context/AuthContext.default';
import { generateId } from '../../../../../../auth-context/utils/generateId';

export const EditSessionPage: FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const session = mockData.sessions.find((s) => s.id === sessionId);

  const [title, setTitle] = useState(session?.title || '');
  const [questions, setQuestions] = useState<Question[]>(
    session?.questions || []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (!session) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4 flex items-center justify-center'>
        <div className='bg-white rounded-3xl shadow-2xl p-8 text-center'>
          <h2 className='text-2xl font-bold text-red-600 mb-4'>
            ❌ Session Not Found
          </h2>
          <KawaiiButton onClick={() => navigate('/my-sessions')}>
            📋 Back to My Sessions
          </KawaiiButton>
        </div>
      </div>
    );
  }

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
    if (!title.trim()) return;

    session.title = title;
    session.questions = questions.filter((q) => q.question.trim());

    navigate('/my-sessions');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <div className='flex items-center justify-between mb-8'>
            <h1 className='text-3xl font-bold text-purple-600'>
              ✏️ Edit Session
            </h1>
            <KawaiiButton
              onClick={() => navigate('/my-sessions')}
              variant='secondary'
            >
              📋 Back to Sessions
            </KawaiiButton>
          </div>

          <div className='mb-6'>
            <KawaiiInput
              placeholder='Session title 🎪'
              value={title}
              onChange={setTitle}
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
            <KawaiiButton onClick={saveSession} disabled={!title.trim()}>
              💾 Save Changes
            </KawaiiButton>
          </div>
        </div>
      </div>
    </div>
  );
};
