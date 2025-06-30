import React from 'react';
import { useState } from 'react';
import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import { KawaiiButton } from '../../../../../../common-ui/kawaii-button/KawaiiButton';
import { QuestionResults } from './features/question-results/QuestionResults';
import { QuestionDisplay } from './features/question-display/QuestionDisplay';
import { useTracker } from 'meteor/react-meteor-data';
import { SessionsCollection } from '../../../../../../../api/sessions';

export const AdminView: FC = () => {
  const { code } = useParams<{ code: string }>();
  const [showResults, setShowResults] = useState(false);

  const { session, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('sessions.byCode', code);
    const loading = !handle.ready();
    const sessionData = SessionsCollection.findOne({ code });
    return {
      session: sessionData,
      isLoading: loading,
    };
  }, [code]);

  if (!session) {
    return <div>Session not found</div>;
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const totalAnswers = currentQuestion?.answers.length || 0;

  const nextQuestion = () => {
    if (session.currentQuestionIndex < session.questions.length - 1) {
      Meteor.call('sessions.nextQuestion', session.id);
      setShowResults(false);
    }
  };

  const prevQuestion = () => {
    if (session.currentQuestionIndex > 0) {
      session.currentQuestionIndex--;
      setShowResults(false);
    }
  };

  const toggleSession = () => {
    console.log('toggle to = ', !session.isActive);
    Meteor.call('sessions.toggleActive', session.id, !session.isActive);
  };

  const resetAnswers = () => {
    Meteor.call(
      'sessions.resetAnswers',
      session.id,
      session.currentQuestionIndex,
      (err) => {
        if (err) {
          console.error('Failed to reset answers:', err);
          alert('Failed to reset answers');
        } else {
          console.log('Answers reset successfully');
          setShowResults(false); // Optionally hide results on reset
        }
      }
    );
  };

  console.log(' session.isactive = ', session.isActive);

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <div className='max-w-6xl mx-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Left Panel - Control */}
          <div className='bg-white rounded-3xl shadow-2xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h1 className='text-2xl font-bold text-purple-600'>
                {session.title}
              </h1>
              <div className='text-sm text-gray-500'>Code: {session.code}</div>
            </div>

            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center justify-between gap-2'>
                  <KawaiiButton
                    onClick={toggleSession}
                    variant={session.isActive ? 'danger' : 'primary'}
                  >
                    {session.isActive ? '⏸️ Pause' : '▶️ Start'}
                  </KawaiiButton>
                  <KawaiiButton onClick={resetAnswers} variant={'primary'}>
                    Reset
                  </KawaiiButton>
                </div>
                <div className='text-sm text-gray-600'>
                  {session.participants.length} participants
                </div>
              </div>

              <div className='flex items-center gap-2 mb-4'>
                <KawaiiButton
                  onClick={prevQuestion}
                  disabled={session.currentQuestionIndex === 0}
                >
                  ⬅️ Prev
                </KawaiiButton>
                <span className='text-sm text-gray-600 px-4'>
                  {session.currentQuestionIndex + 1} /{' '}
                  {session.questions.length}
                </span>
                <KawaiiButton
                  onClick={nextQuestion}
                  disabled={
                    session.currentQuestionIndex >= session.questions.length - 1
                  }
                >
                  Next ➡️
                </KawaiiButton>
              </div>

              <KawaiiButton
                onClick={() => setShowResults(!showResults)}
                variant='secondary'
                className='w-full'
              >
                {showResults ? '📊 Hide Results' : '📊 Show Results'}
              </KawaiiButton>
            </div>

            {currentQuestion && (
              <div className='bg-gray-50 rounded-xl p-4'>
                <h3 className='font-bold text-gray-800 mb-2'>
                  Current Question:
                </h3>
                <p className='text-gray-600'>{currentQuestion.question}</p>
                <p className='text-sm text-gray-500 mt-2'>
                  {totalAnswers} answers received
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Display */}
          <div className='bg-white rounded-3xl shadow-2xl p-6'>
            {currentQuestion && showResults ? (
              <QuestionResults question={currentQuestion} />
            ) : currentQuestion ? (
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={session.currentQuestionIndex + 1}
              />
            ) : (
              <div className='text-center text-gray-500'>
                <h2 className='text-xl font-bold mb-2'>🎉 Session Complete!</h2>
                <p>All questions have been answered.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
