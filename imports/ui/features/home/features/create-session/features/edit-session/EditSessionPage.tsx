import React, { useState } from 'react';
import { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { KawaiiButton } from '../../../../../../common-ui/kawaii-button/KawaiiButton';
import { KawaiiInput } from '../../../../../../common-ui/kawaii-input/KawaiiInput';
import { QuestionEditor } from '../question-editor/QuestionEditor';
import { SessionsCollection } from '../../../../../../../api/sessions';

export const EditSessionPage: FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { session, isLoading } = useTracker(() => {
    const h = Meteor.subscribe('sessions.byId', sessionId);
    return {
      session: SessionsCollection.findOne({ id: sessionId }),
      isLoading: !h.ready(),
    };
  }, [sessionId]);

  const [title, setTitle] = useState(session?.title || '');
  const [questions, setQuestions] = useState<Question[]>(
    session?.questions || []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (isLoading) return <div>Loading…</div>;
  if (!session) {
    return (
      <div className='min-h-screen bg-gradient-to-br ...'>
        <div className='bg-white ...'>
          <h2>❌ Session Not Found</h2>
          <KawaiiButton onClick={() => navigate('/my-sessions')}>
            Back
          </KawaiiButton>
        </div>
      </div>
    );
  }

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Random.id(),
        type: 'multiple-choice',
        question: '',
        options: ['', '', '', ''],
        answers: [],
        showCorrectAnswer: true,
        showWhoVoted: false,
      },
    ]);
    setEditingIndex(questions.length);
  };

  const updateQuestion = (i: number, updated: Question) => {
    setQuestions((prev) => {
      const arr = [...prev];
      arr[i] = updated;
      return arr;
    });
  };

  const deleteQuestion = (i: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
    setEditingIndex(null);
  };

  const saveSession = () => {
    const cleanQuestions = questions.filter((q) => q.question.trim());
    Meteor.call(
      'sessions.update',
      session._id,
      { title, questions: cleanQuestions },
      (err) => {
        if (err) alert(`Save failed: ${err.message}`);
        else navigate('/my-sessions');
      }
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br ...'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white ...'>
          <div className='flex justify-between mb-8'>
            <h1>✏️ Edit Session</h1>
            <KawaiiButton
              variant='secondary'
              onClick={() => navigate('/my-sessions')}
            >
              Back
            </KawaiiButton>
          </div>

          <KawaiiInput
            placeholder='Session title 🎪'
            value={title}
            onChange={setTitle}
          />

          <div className='mt-6'>
            <div className='flex justify-between mb-4'>
              <h2>Questions 📝</h2>
              <KawaiiButton onClick={addQuestion}>➕ Add Question</KawaiiButton>
            </div>
            <div className='space-y-4'>
              {questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={i}
                  isEditing={editingIndex === i}
                  onEdit={() => setEditingIndex(i)}
                  onSave={(updated) => {
                    updateQuestion(i, updated);
                    setEditingIndex(null);
                  }}
                  onDelete={() => deleteQuestion(i)}
                />
              ))}
            </div>
          </div>

          <div className='flex justify-end mt-6'>
            <KawaiiButton onClick={saveSession} disabled={!title.trim()}>
              💾 Save Changes
            </KawaiiButton>
          </div>
        </div>
      </div>
    </div>
  );
};
