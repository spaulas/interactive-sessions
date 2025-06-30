import React from 'react';
import { useContext, useState } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KawaiiInput } from '../../../../common-ui/kawaii-input/KawaiiInput';
import { KawaiiButton } from '../../../../common-ui/kawaii-button/KawaiiButton';
import { AuthContext } from '../../../../auth-context/AuthContext';
import { mockData } from '../../../../auth-context/AuthContext.default';
import { generateId } from '../../../../auth-context/utils/generateId';

export const SuggestionsPage: FC = () => {
  const { user } = useContext(AuthContext);
  const [newSuggestion, setNewSuggestion] = useState({
    question: '',
    type: 'multiple-choice' as 'multiple-choice' | 'open-text',
    options: ['', '', '', ''],
  });
  const [sessionCode, setSessionCode] = useState('');

  const mySuggestions = mockData.suggestions.filter(
    (s) => s.userId === user?.id
  );

  const submitSuggestion = () => {
    if (!newSuggestion.question.trim() || !sessionCode.trim()) return;

    const session = mockData.sessions.find((s) => s.code === sessionCode);
    if (!session) {
      alert('Session not found!');
      return;
    }

    const suggestion: QuestionSuggestion = {
      id: generateId(),
      sessionId: session.id,
      userId: user!.id,
      userName: user!.name,
      question: newSuggestion.question,
      options:
        newSuggestion.type === 'multiple-choice'
          ? newSuggestion.options.filter((o) => o.trim())
          : undefined,
      type: newSuggestion.type,
      status: 'pending',
      timestamp: Date.now(),
    };

    mockData.suggestions.push(suggestion);

    setNewSuggestion({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
    });
    setSessionCode('');
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitSuggestion();
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-3xl shadow-2xl p-8 mb-8'>
          <h1 className='text-3xl font-bold text-purple-600 mb-8'>
            💡 Suggest Questions
          </h1>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <KawaiiInput
              placeholder='Session code 🔑'
              value={sessionCode}
              onChange={setSessionCode}
            />
            <div className='flex bg-gray-100 rounded-full p-1'>
              <button
                className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
                  newSuggestion.type === 'multiple-choice'
                    ? 'bg-white shadow-md text-purple-600'
                    : 'text-gray-500'
                }`}
                onClick={() =>
                  setNewSuggestion({
                    ...newSuggestion,
                    type: 'multiple-choice',
                  })
                }
              >
                Multiple Choice
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
                  newSuggestion.type === 'open-text'
                    ? 'bg-white shadow-md text-purple-600'
                    : 'text-gray-500'
                }`}
                onClick={() =>
                  setNewSuggestion({ ...newSuggestion, type: 'open-text' })
                }
              >
                Open Text
              </button>
            </div>
          </div>

          <div className='mb-6'>
            <KawaiiInput
              placeholder='Your question suggestion 🤔'
              value={newSuggestion.question}
              onChange={(value) =>
                setNewSuggestion({ ...newSuggestion, question: value })
              }
              onKeyPress={(e) => handleKeyPress(e as unknown as KeyboardEvent)}
            />
          </div>

          {newSuggestion.type === 'multiple-choice' && (
            <div className='mb-6'>
              <p className='font-medium text-purple-600 mb-2'>
                Options (optional):
              </p>
              {newSuggestion.options.map((option, index) => (
                <div key={index} className='mb-2'>
                  <KawaiiInput
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(value) => {
                      const newOptions = [...newSuggestion.options];
                      newOptions[index] = value;
                      setNewSuggestion({
                        ...newSuggestion,
                        options: newOptions,
                      });
                    }}
                    onKeyPress={(e) =>
                      handleKeyPress(e as unknown as KeyboardEvent)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <KawaiiButton
            onClick={submitSuggestion}
            disabled={!newSuggestion.question.trim() || !sessionCode.trim()}
            className='w-full'
          >
            🚀 Submit Suggestion
          </KawaiiButton>
        </div>

        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <h2 className='text-2xl font-bold text-purple-600 mb-6'>
            📋 My Suggestions
          </h2>

          {mySuggestions.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <div className='text-4xl mb-2'>💭</div>
              <p>No suggestions yet. Submit your first one above!</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {mySuggestions.map((suggestion) => (
                <div key={suggestion.id} className='bg-gray-50 rounded-xl p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-gray-500'>
                      {new Date(suggestion.timestamp).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        suggestion.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : suggestion.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {suggestion.status.toUpperCase()}
                    </span>
                  </div>
                  <p className='font-medium text-gray-800 mb-1'>
                    {suggestion.question}
                  </p>
                  <p className='text-sm text-gray-600'>
                    Type: {suggestion.type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
