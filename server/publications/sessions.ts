import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SessionsCollection } from '../../imports/api/sessions';

Meteor.publish('sessions.byCode', function (code: string) {
  const found = SessionsCollection.find({ code }).fetch();
  console.log('Publishing session with code:', code, found);
  return SessionsCollection.find({ code });
});

Meteor.publish('sessions.byAdminId', function (adminId: string) {
  console.log('Publishing sessions for adminId:', adminId);
  check(adminId, String); // optional but recommended for validation
  return SessionsCollection.find({ adminId });
});
