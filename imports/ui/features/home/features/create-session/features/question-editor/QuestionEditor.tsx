import React from 'react';
import { useState } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { KawaiiInput } from '../../../../../../common-ui/kawaii-input/KawaiiInput';
import { KawaiiButton } from '../../../../../../common-ui/kawaii-button/KawaiiButton';

export const QuestionEditor: FC<{
  question: Question;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (question: Question) => void;
  onDelete: () => void;
}> = ({ question, index, isEditing, onEdit, onSave, onDelete }) => {
  const [editedQuestion, setEditedQuestion] = useState(question);

  const handleSave = () => {
    onSave(editedQuestion);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  if (!isEditing) {
    return (
      <div className='bg-gray-50 rounded-2xl p-4 border-2 border-gray-200'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-bold text-gray-800'>Question {index + 1}</h3>
          <div className='flex gap-2'>
            <button
              onClick={onEdit}
              className='text-blue-500 hover:text-blue-700 transition-colors'
            >
              ✏️ Edit
            </button>
            <button
              onClick={onDelete}
              className='text-red-500 hover:text-red-700 transition-colors'
            >
              🗑️ Delete
            </button>
          </div>
        </div>
        <p className='text-gray-600 mb-2'>
          {question.question || 'Untitled question'}
        </p>
        <p className='text-sm text-gray-500'>Type: {question.type}</p>
      </div>
    );
  }

  return (
    <div className='bg-purple-50 rounded-2xl p-6 border-2 border-purple-200'>
      <div className='mb-4'>
        <div className='flex mb-4 bg-white rounded-full p-1'>
          <button
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              editedQuestion.type === 'multiple-choice'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500'
            }`}
            onClick={() =>
              setEditedQuestion({
                ...editedQuestion,
                type: 'multiple-choice',
                options: editedQuestion.options || ['', '', '', ''],
              })
            }
          >
            Multiple Choice
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              editedQuestion.type === 'open-text'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500'
            }`}
            onClick={() =>
              setEditedQuestion({
                ...editedQuestion,
                type: 'open-text',
                options: undefined,
              })
            }
          >
            Open Text
          </button>
        </div>

        <KawaiiInput
          placeholder='Enter your question 🤔'
          value={editedQuestion.question}
          onChange={(value) =>
            setEditedQuestion({ ...editedQuestion, question: value })
          }
          onKeyPress={handleKeyPress}
          autoFocus
        />
      </div>

      {editedQuestion.type === 'multiple-choice' && (
        <div className='mb-4'>
          <p className='font-medium text-purple-600 mb-2'>Options:</p>
          {editedQuestion.options?.map((option, optionIndex) => (
            <div key={optionIndex} className='flex items-center gap-2 mb-2'>
              <input
                type='radio'
                name={`correct-${question.id}`}
                checked={editedQuestion.correctAnswer === optionIndex}
                onChange={() =>
                  setEditedQuestion({
                    ...editedQuestion,
                    correctAnswer: optionIndex,
                  })
                }
                className='text-purple-500'
              />
              <KawaiiInput
                placeholder={`Option ${optionIndex + 1}`}
                value={option}
                onChange={(value) => {
                  const newOptions = [...(editedQuestion.options || [])];
                  newOptions[optionIndex] = value;
                  setEditedQuestion({ ...editedQuestion, options: newOptions });
                }}
                onKeyPress={handleKeyPress}
              />
            </div>
          ))}
        </div>
      )}

      <div className='flex flex-wrap gap-4 mb-4'>
        <label className='flex items-center gap-2'>
          <input
            type='checkbox'
            checked={editedQuestion.showCorrectAnswer}
            onChange={(e) =>
              setEditedQuestion({
                ...editedQuestion,
                showCorrectAnswer: e.target.checked,
              })
            }
            className='text-purple-500'
          />
          <span className='text-sm'>Show correct answer</span>
        </label>
        <label className='flex items-center gap-2'>
          <input
            type='checkbox'
            checked={editedQuestion.showWhoVoted}
            onChange={(e) =>
              setEditedQuestion({
                ...editedQuestion,
                showWhoVoted: e.target.checked,
              })
            }
            className='text-purple-500'
          />
          <span className='text-sm'>Show who voted the same</span>
        </label>
      </div>

      <div className='flex gap-2'>
        <KawaiiButton onClick={handleSave} variant='primary'>
          💾 Save
        </KawaiiButton>
        <KawaiiButton onClick={onDelete} variant='danger'>
          🗑️ Delete
        </KawaiiButton>
      </div>
    </div>
  );
};
