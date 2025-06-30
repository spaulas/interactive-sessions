import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { SessionsCollection } from '../../imports/api/sessions';

Meteor.methods({
  async 'sessions.insert'(session: Session) {
    console.log('Inserting session:', session);

    if (!session.title || session.questions.length === 0) {
      throw new Meteor.Error(
        'invalid-data',
        'Title and at least one question required'
      );
    }

    try {
      const insertedId = await SessionsCollection.insertAsync(session);
      console.log('Session inserted with ID:', insertedId);
      return insertedId;
    } catch (error: any) {
      console.error('Error inserting session:', error);
      throw new Meteor.Error('session-insert-failed', error.message);
    }
  },

  'sessions.update'(sessionId: string, updates: Partial<Session>) {
    check(sessionId, String);
    check(updates, Object);

    const session = SessionsCollection.findOne(sessionId);
    if (!session) {
      throw new Meteor.Error('Session not found');
    }

    return SessionsCollection.update(sessionId, { $set: updates });
  },

  async 'sessions.nextQuestion'(sessionId: string) {
    check(sessionId, String);
    await SessionsCollection.updateAsync(
      { id: sessionId },
      { $inc: { currentQuestionIndex: 1 } }
    );
  },

  async 'sessions.prevQuestion'(sessionId: string) {
    check(sessionId, String);
    await SessionsCollection.updateAsync(
      { id: sessionId },
      { $inc: { currentQuestionIndex: -1 } }
    );
  },

  async 'sessions.toggleActive'(sessionId: string, newState: boolean) {
    try {
      check(sessionId, String);
      check(newState, Boolean);

      await SessionsCollection.updateAsync(
        { _id: sessionId },
        { $set: { isActive: newState } }
      );
    } catch (e) {
      console.error('toggle active = ', e);
    }
  },

  async 'sessions.submitAnswer'(sessionId, questionIndex, answer) {
    check(sessionId, String);
    check(questionIndex, Number);
    check(answer, Match.Any);

    // Use rawCollection().findOne for async findOne
    const session = await SessionsCollection.rawCollection().findOne({
      id: sessionId,
    });

    if (!session) {
      throw new Meteor.Error('not-found', 'Session not found');
    }

    // Modify the session in-memory
    session.questions[questionIndex].answers.push(answer);

    // Use rawCollection().updateOne for async update
    await SessionsCollection.rawCollection().updateOne(
      { id: sessionId },
      { $set: { questions: session.questions } }
    );

    return true;
  },

  async 'sessions.addParticipant'(
    sessionId: string,
    user: { id: string; name: string }
  ) {
    check(sessionId, String);
    check(user, Object);

    // Find session by _id (Mongo document id)
    /* const session = await SessionsCollection.rawCollection().findOne({
      id: sessionId,
    });

    if (!session) {
      throw new Meteor.Error('not-found', 'Session not found');
    }
 */
    // Check if participant already exists in the participants array
    /* const exists = (session.participants || []).some((p) => p.id === user.id);
    if (exists) {
      // Participant already joined, no update needed
      return 0;
    }
 */
    // Add participant with async updateOne
    const result = await SessionsCollection.rawCollection().updateOne(
      { id: sessionId },
      { $push: { participants: { id: user.id, name: user.name } } }
    );

    // result.modifiedCount === 1 means update success
    return result.modifiedCount;
  },

  async 'sessions.removeParticipant'(sessionId: string, userId: string) {
    check(sessionId, String);
    check(userId, String);

    try {
      const result = await SessionsCollection.rawCollection().updateOne(
        { id: sessionId },
        { $pull: { participants: { id: userId } } }
      );
    } catch (e) {
      console.error('remove participant = ', e);
      throw new Meteor.Error('remove-participant-failed', e.message);
    }
  },

  async 'sessions.resetAnswers'(sessionId: string, questionIndex: number) {
    check(sessionId, String);
    check(questionIndex, Number);

    const session = await SessionsCollection.rawCollection().findOne({
      id: sessionId,
    });
    if (!session) {
      throw new Meteor.Error('not-found', 'Session not found');
    }

    if (!session.questions || !session.questions[questionIndex]) {
      throw new Meteor.Error('invalid-question', 'Question index invalid');
    }

    // Reset answers for that question
    await SessionsCollection.rawCollection().updateOne(
      { id: sessionId },
      { $set: { [`questions.${questionIndex}.answers`]: [] } }
    );

    return true;
  },
});
