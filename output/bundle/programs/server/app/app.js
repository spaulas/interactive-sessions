Package["core-runtime"].queue("null",function () {/* Imports for global scope */

MongoInternals = Package.mongo.MongoInternals;
Mongo = Package.mongo.Mongo;
ReactiveVar = Package['reactive-var'].ReactiveVar;
ECMAScript = Package.ecmascript.ECMAScript;
Accounts = Package['accounts-base'].Accounts;
Meteor = Package.meteor.Meteor;
global = Package.meteor.global;
meteorEnv = Package.meteor.meteorEnv;
EmitterPromise = Package.meteor.EmitterPromise;
WebApp = Package.webapp.WebApp;
WebAppInternals = Package.webapp.WebAppInternals;
main = Package.webapp.main;
DDP = Package['ddp-client'].DDP;
DDPServer = Package['ddp-server'].DDPServer;
LaunchScreen = Package['launch-screen'].LaunchScreen;
meteorInstall = Package.modules.meteorInstall;
Promise = Package.promise.Promise;
Autoupdate = Package.autoupdate.Autoupdate;

var require = meteorInstall({"imports":{"api":{"links.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// imports/api/links.js                                                                       //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    module.export({
      LinksCollection: () => LinksCollection
    });
    let Mongo;
    module.link("meteor/mongo", {
      Mongo(v) {
        Mongo = v;
      }
    }, 0);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    const LinksCollection = new Mongo.Collection('links');
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
////////////////////////////////////////////////////////////////////////////////////////////////

},"sessions.ts":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// imports/api/sessions.ts                                                                    //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    module.export({
      SessionsCollection: () => SessionsCollection
    });
    let Mongo;
    module.link("meteor/mongo", {
      Mongo(v) {
        Mongo = v;
      }
    }, 0);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    const SessionsCollection = new Mongo.Collection('sessions');
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"methods":{"sessions.ts":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// server/methods/sessions.ts                                                                 //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let Meteor;
    module.link("meteor/meteor", {
      Meteor(v) {
        Meteor = v;
      }
    }, 0);
    let check, Match;
    module.link("meteor/check", {
      check(v) {
        check = v;
      },
      Match(v) {
        Match = v;
      }
    }, 1);
    let SessionsCollection;
    module.link("../../imports/api/sessions", {
      SessionsCollection(v) {
        SessionsCollection = v;
      }
    }, 2);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    Meteor.methods({
      async 'sessions.insert'(session) {
        console.log('Inserting session:', session);
        if (!session.title || session.questions.length === 0) {
          throw new Meteor.Error('invalid-data', 'Title and at least one question required');
        }
        try {
          const insertedId = await SessionsCollection.insertAsync(session);
          console.log('Session inserted with ID:', insertedId);
          return insertedId;
        } catch (error) {
          console.error('Error inserting session:', error);
          throw new Meteor.Error('session-insert-failed', error.message);
        }
      },
      'sessions.update'(sessionId, updates) {
        check(sessionId, String);
        check(updates, Object);
        const session = SessionsCollection.findOne(sessionId);
        if (!session) {
          throw new Meteor.Error('Session not found');
        }
        return SessionsCollection.update(sessionId, {
          $set: updates
        });
      },
      async 'sessions.nextQuestion'(sessionId) {
        check(sessionId, String);
        await SessionsCollection.updateAsync({
          id: sessionId
        }, {
          $inc: {
            currentQuestionIndex: 1
          }
        });
      },
      async 'sessions.prevQuestion'(sessionId) {
        check(sessionId, String);
        await SessionsCollection.updateAsync({
          id: sessionId
        }, {
          $inc: {
            currentQuestionIndex: -1
          }
        });
      },
      async 'sessions.toggleActive'(sessionId, newState) {
        try {
          check(sessionId, String);
          check(newState, Boolean);
          await SessionsCollection.updateAsync({
            _id: sessionId
          }, {
            $set: {
              isActive: newState
            }
          });
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
          id: sessionId
        });
        if (!session) {
          throw new Meteor.Error('not-found', 'Session not found');
        }
        // Modify the session in-memory
        session.questions[questionIndex].answers.push(answer);
        // Use rawCollection().updateOne for async update
        await SessionsCollection.rawCollection().updateOne({
          id: sessionId
        }, {
          $set: {
            questions: session.questions
          }
        });
        return true;
      },
      async 'sessions.addParticipant'(sessionId, user) {
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
        const result = await SessionsCollection.rawCollection().updateOne({
          id: sessionId
        }, {
          $push: {
            participants: {
              id: user.id,
              name: user.name
            }
          }
        });
        // result.modifiedCount === 1 means update success
        return result.modifiedCount;
      },
      async 'sessions.removeParticipant'(sessionId, userId) {
        check(sessionId, String);
        check(userId, String);
        try {
          const result = await SessionsCollection.rawCollection().updateOne({
            id: sessionId
          }, {
            $pull: {
              participants: {
                id: userId
              }
            }
          });
        } catch (e) {
          console.error('remove participant = ', e);
          throw new Meteor.Error('remove-participant-failed', e.message);
        }
      },
      async 'sessions.resetAnswers'(sessionId, questionIndex) {
        check(sessionId, String);
        check(questionIndex, Number);
        const session = await SessionsCollection.rawCollection().findOne({
          id: sessionId
        });
        if (!session) {
          throw new Meteor.Error('not-found', 'Session not found');
        }
        if (!session.questions || !session.questions[questionIndex]) {
          throw new Meteor.Error('invalid-question', 'Question index invalid');
        }
        // Reset answers for that question
        await SessionsCollection.rawCollection().updateOne({
          id: sessionId
        }, {
          $set: {
            ["questions.".concat(questionIndex, ".answers")]: []
          }
        });
        return true;
      }
    });
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"sessions.ts":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// server/publications/sessions.ts                                                            //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let Meteor;
    module.link("meteor/meteor", {
      Meteor(v) {
        Meteor = v;
      }
    }, 0);
    let check;
    module.link("meteor/check", {
      check(v) {
        check = v;
      }
    }, 1);
    let SessionsCollection;
    module.link("../../imports/api/sessions", {
      SessionsCollection(v) {
        SessionsCollection = v;
      }
    }, 2);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    Meteor.publish('sessions.byCode', function (code) {
      const found = SessionsCollection.find({
        code
      }).fetch();
      console.log('Publishing session with code:', code, found);
      return SessionsCollection.find({
        code
      });
    });
    Meteor.publish('sessions.byAdminId', function (adminId) {
      console.log('Publishing sessions for adminId:', adminId);
      check(adminId, String); // optional but recommended for validation
      return SessionsCollection.find({
        adminId
      });
    });
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
////////////////////////////////////////////////////////////////////////////////////////////////

}},"main.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// server/main.js                                                                             //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let Meteor;
    module.link("meteor/meteor", {
      Meteor(v) {
        Meteor = v;
      }
    }, 0);
    let LinksCollection;
    module.link("/imports/api/links", {
      LinksCollection(v) {
        LinksCollection = v;
      }
    }, 1);
    module.link("./methods/sessions");
    module.link("./publications/sessions");
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    async function insertLink(_ref) {
      let {
        title,
        url
      } = _ref;
      await LinksCollection.insertAsync({
        title,
        url,
        createdAt: new Date()
      });
    }
    Meteor.startup(async () => {
      // If the Links collection is empty, add some data.
      if ((await LinksCollection.find().countAsync()) === 0) {
        await insertLink({
          title: 'Do the Tutorial',
          url: 'https://www.meteor.com/tutorials/react/creating-an-app'
        });
        await insertLink({
          title: 'Follow the Guide',
          url: 'https://guide.meteor.com'
        });
        await insertLink({
          title: 'Read the Docs',
          url: 'https://docs.meteor.com'
        });
        await insertLink({
          title: 'Discussions',
          url: 'https://forums.meteor.com'
        });
      }

      // We publish the entire Links collection to all clients.
      // In order to be fetched in real-time to the clients
      Meteor.publish('links', function () {
        return LinksCollection.find();
      });
    });
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: false
});
////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".ts",
    ".mjs",
    ".tsx"
  ]
});


/* Exports */
return {
  require: require,
  eagerModulePaths: [
    "/server/main.js"
  ]
}});

//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvbGlua3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3Nlc3Npb25zLnRzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWV0aG9kcy9zZXNzaW9ucy50cyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3B1YmxpY2F0aW9ucy9zZXNzaW9ucy50cyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21haW4uanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiTGlua3NDb2xsZWN0aW9uIiwiTW9uZ28iLCJsaW5rIiwidiIsIl9fcmVpZnlXYWl0Rm9yRGVwc19fIiwiQ29sbGVjdGlvbiIsIl9fcmVpZnlfYXN5bmNfcmVzdWx0X18iLCJfcmVpZnlFcnJvciIsInNlbGYiLCJhc3luYyIsIlNlc3Npb25zQ29sbGVjdGlvbiIsIk1ldGVvciIsImNoZWNrIiwiTWF0Y2giLCJtZXRob2RzIiwic2Vzc2lvbnMuaW5zZXJ0Iiwic2Vzc2lvbiIsImNvbnNvbGUiLCJsb2ciLCJ0aXRsZSIsInF1ZXN0aW9ucyIsImxlbmd0aCIsIkVycm9yIiwiaW5zZXJ0ZWRJZCIsImluc2VydEFzeW5jIiwiZXJyb3IiLCJtZXNzYWdlIiwic2Vzc2lvbnMudXBkYXRlIiwic2Vzc2lvbklkIiwidXBkYXRlcyIsIlN0cmluZyIsIk9iamVjdCIsImZpbmRPbmUiLCJ1cGRhdGUiLCIkc2V0Iiwic2Vzc2lvbnMubmV4dFF1ZXN0aW9uIiwidXBkYXRlQXN5bmMiLCJpZCIsIiRpbmMiLCJjdXJyZW50UXVlc3Rpb25JbmRleCIsInNlc3Npb25zLnByZXZRdWVzdGlvbiIsInNlc3Npb25zLnRvZ2dsZUFjdGl2ZSIsIm5ld1N0YXRlIiwiQm9vbGVhbiIsIl9pZCIsImlzQWN0aXZlIiwiZSIsInNlc3Npb25zLnN1Ym1pdEFuc3dlciIsInF1ZXN0aW9uSW5kZXgiLCJhbnN3ZXIiLCJOdW1iZXIiLCJBbnkiLCJyYXdDb2xsZWN0aW9uIiwiYW5zd2VycyIsInB1c2giLCJ1cGRhdGVPbmUiLCJzZXNzaW9ucy5hZGRQYXJ0aWNpcGFudCIsInVzZXIiLCJyZXN1bHQiLCIkcHVzaCIsInBhcnRpY2lwYW50cyIsIm5hbWUiLCJtb2RpZmllZENvdW50Iiwic2Vzc2lvbnMucmVtb3ZlUGFydGljaXBhbnQiLCJ1c2VySWQiLCIkcHVsbCIsInNlc3Npb25zLnJlc2V0QW5zd2VycyIsImNvbmNhdCIsInB1Ymxpc2giLCJjb2RlIiwiZm91bmQiLCJmaW5kIiwiZmV0Y2giLCJhZG1pbklkIiwiaW5zZXJ0TGluayIsIl9yZWYiLCJ1cmwiLCJjcmVhdGVkQXQiLCJEYXRlIiwic3RhcnR1cCIsImNvdW50QXN5bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQUFBLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDO01BQUNDLGVBQWUsRUFBQ0EsQ0FBQSxLQUFJQTtJQUFlLENBQUMsQ0FBQztJQUFDLElBQUlDLEtBQUs7SUFBQ0gsTUFBTSxDQUFDSSxJQUFJLENBQUMsY0FBYyxFQUFDO01BQUNELEtBQUtBLENBQUNFLENBQUMsRUFBQztRQUFDRixLQUFLLEdBQUNFLENBQUM7TUFBQTtJQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFBQyxJQUFJQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNQSxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUV0SyxNQUFNSixlQUFlLEdBQUcsSUFBSUMsS0FBSyxDQUFDSSxVQUFVLENBQUMsT0FBTyxDQUFDO0lBQUNDLHNCQUFBO0VBQUEsU0FBQUMsV0FBQTtJQUFBLE9BQUFELHNCQUFBLENBQUFDLFdBQUE7RUFBQTtFQUFBRCxzQkFBQTtBQUFBO0VBQUFFLElBQUE7RUFBQUMsS0FBQTtBQUFBLEc7Ozs7Ozs7Ozs7Ozs7O0lDRjdEWCxNQUFBLENBQU9DLE1BQUUsQ0FBSztNQUFBVyxrQkFBUSxFQUFBQSxDQUFBLEtBQWVBO0lBQUE7SUFBQSxJQUFBVCxLQUFBO0lBQUFILE1B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TS9FLGVBQWUsQ0FBQ3VFLElBQUksQ0FBQyxDQUFDLENBQUNTLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3JELE1BQU1OLFVBQVUsQ0FBQztVQUNmdkQsS0FBSyxFQUFFLGlCQUFpQjtVQUN4QnlELEdBQUcsRUFBRTtRQUNQLENBQUMsQ0FBQztRQUVGLE1BQU1GLFVBQVUsQ0FBQztVQUNmdkQsS0FBSyxFQUFFLGtCQUFrQjtVQUN6QnlELEdBQUcsRUFBRTtRQUNQLENBQUMsQ0FBQztRQUVGLE1BQU1GLFVBQVUsQ0FBQztVQUNmdkQsS0FBSyxFQUFFLGVBQWU7VUFDdEJ5RCxHQUFHLEVBQUU7UUFDUCxDQUFDLENBQUM7UUFFRixNQUFNRixVQUFVLENBQUM7VUFDZnZELEtBQUssRUFBRSxhQUFhO1VBQ3BCeUQsR0FBRyxFQUFFO1FBQ1AsQ0FBQyxDQUFDO01BQ0o7O01BRUE7TUFDQTtNQUNBakUsTUFBTSxDQUFDeUQsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZO1FBQ2xDLE9BQU9wRSxlQUFlLENBQUN1RSxJQUFJLENBQUMsQ0FBQztNQUMvQixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFBQ2pFLHNCQUFBO0VBQUEsU0FBQUMsV0FBQTtJQUFBLE9BQUFELHNCQUFBLENBQUFDLFdBQUE7RUFBQTtFQUFBRCxzQkFBQTtBQUFBO0VBQUFFLElBQUE7RUFBQUMsS0FBQTtBQUFBLEciLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcblxuZXhwb3J0IGNvbnN0IExpbmtzQ29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdsaW5rcycpO1xuIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuXG5leHBvcnQgY29uc3QgU2Vzc2lvbnNDb2xsZWN0aW9uID0gbmV3IE1vbmdvLkNvbGxlY3Rpb248U2Vzc2lvbj4oJ3Nlc3Npb25zJyk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IGNoZWNrLCBNYXRjaCB9IGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQgeyBTZXNzaW9uc0NvbGxlY3Rpb24gfSBmcm9tICcuLi8uLi9pbXBvcnRzL2FwaS9zZXNzaW9ucyc7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgYXN5bmMgJ3Nlc3Npb25zLmluc2VydCcoc2Vzc2lvbjogU2Vzc2lvbikge1xuICAgIGNvbnNvbGUubG9nKCdJbnNlcnRpbmcgc2Vzc2lvbjonLCBzZXNzaW9uKTtcblxuICAgIGlmICghc2Vzc2lvbi50aXRsZSB8fCBzZXNzaW9uLnF1ZXN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAgICdpbnZhbGlkLWRhdGEnLFxuICAgICAgICAnVGl0bGUgYW5kIGF0IGxlYXN0IG9uZSBxdWVzdGlvbiByZXF1aXJlZCdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGluc2VydGVkSWQgPSBhd2FpdCBTZXNzaW9uc0NvbGxlY3Rpb24uaW5zZXJ0QXN5bmMoc2Vzc2lvbik7XG4gICAgICBjb25zb2xlLmxvZygnU2Vzc2lvbiBpbnNlcnRlZCB3aXRoIElEOicsIGluc2VydGVkSWQpO1xuICAgICAgcmV0dXJuIGluc2VydGVkSWQ7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW5zZXJ0aW5nIHNlc3Npb246JywgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignc2Vzc2lvbi1pbnNlcnQtZmFpbGVkJywgZXJyb3IubWVzc2FnZSk7XG4gICAgfVxuICB9LFxuXG4gICdzZXNzaW9ucy51cGRhdGUnKHNlc3Npb25JZDogc3RyaW5nLCB1cGRhdGVzOiBQYXJ0aWFsPFNlc3Npb24+KSB7XG4gICAgY2hlY2soc2Vzc2lvbklkLCBTdHJpbmcpO1xuICAgIGNoZWNrKHVwZGF0ZXMsIE9iamVjdCk7XG5cbiAgICBjb25zdCBzZXNzaW9uID0gU2Vzc2lvbnNDb2xsZWN0aW9uLmZpbmRPbmUoc2Vzc2lvbklkKTtcbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ1Nlc3Npb24gbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNlc3Npb25zQ29sbGVjdGlvbi51cGRhdGUoc2Vzc2lvbklkLCB7ICRzZXQ6IHVwZGF0ZXMgfSk7XG4gIH0sXG5cbiAgYXN5bmMgJ3Nlc3Npb25zLm5leHRRdWVzdGlvbicoc2Vzc2lvbklkOiBzdHJpbmcpIHtcbiAgICBjaGVjayhzZXNzaW9uSWQsIFN0cmluZyk7XG4gICAgYXdhaXQgU2Vzc2lvbnNDb2xsZWN0aW9uLnVwZGF0ZUFzeW5jKFxuICAgICAgeyBpZDogc2Vzc2lvbklkIH0sXG4gICAgICB7ICRpbmM6IHsgY3VycmVudFF1ZXN0aW9uSW5kZXg6IDEgfSB9XG4gICAgKTtcbiAgfSxcblxuICBhc3luYyAnc2Vzc2lvbnMucHJldlF1ZXN0aW9uJyhzZXNzaW9uSWQ6IHN0cmluZykge1xuICAgIGNoZWNrKHNlc3Npb25JZCwgU3RyaW5nKTtcbiAgICBhd2FpdCBTZXNzaW9uc0NvbGxlY3Rpb24udXBkYXRlQXN5bmMoXG4gICAgICB7IGlkOiBzZXNzaW9uSWQgfSxcbiAgICAgIHsgJGluYzogeyBjdXJyZW50UXVlc3Rpb25JbmRleDogLTEgfSB9XG4gICAgKTtcbiAgfSxcblxuICBhc3luYyAnc2Vzc2lvbnMudG9nZ2xlQWN0aXZlJyhzZXNzaW9uSWQ6IHN0cmluZywgbmV3U3RhdGU6IGJvb2xlYW4pIHtcbiAgICB0cnkge1xuICAgICAgY2hlY2soc2Vzc2lvbklkLCBTdHJpbmcpO1xuICAgICAgY2hlY2sobmV3U3RhdGUsIEJvb2xlYW4pO1xuXG4gICAgICBhd2FpdCBTZXNzaW9uc0NvbGxlY3Rpb24udXBkYXRlQXN5bmMoXG4gICAgICAgIHsgX2lkOiBzZXNzaW9uSWQgfSxcbiAgICAgICAgeyAkc2V0OiB7IGlzQWN0aXZlOiBuZXdTdGF0ZSB9IH1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcigndG9nZ2xlIGFjdGl2ZSA9ICcsIGUpO1xuICAgIH1cbiAgfSxcblxuICBhc3luYyAnc2Vzc2lvbnMuc3VibWl0QW5zd2VyJyhzZXNzaW9uSWQsIHF1ZXN0aW9uSW5kZXgsIGFuc3dlcikge1xuICAgIGNoZWNrKHNlc3Npb25JZCwgU3RyaW5nKTtcbiAgICBjaGVjayhxdWVzdGlvbkluZGV4LCBOdW1iZXIpO1xuICAgIGNoZWNrKGFuc3dlciwgTWF0Y2guQW55KTtcblxuICAgIC8vIFVzZSByYXdDb2xsZWN0aW9uKCkuZmluZE9uZSBmb3IgYXN5bmMgZmluZE9uZVxuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBTZXNzaW9uc0NvbGxlY3Rpb24ucmF3Q29sbGVjdGlvbigpLmZpbmRPbmUoe1xuICAgICAgaWQ6IHNlc3Npb25JZCxcbiAgICB9KTtcblxuICAgIGlmICghc2Vzc2lvbikge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90LWZvdW5kJywgJ1Nlc3Npb24gbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgLy8gTW9kaWZ5IHRoZSBzZXNzaW9uIGluLW1lbW9yeVxuICAgIHNlc3Npb24ucXVlc3Rpb25zW3F1ZXN0aW9uSW5kZXhdLmFuc3dlcnMucHVzaChhbnN3ZXIpO1xuXG4gICAgLy8gVXNlIHJhd0NvbGxlY3Rpb24oKS51cGRhdGVPbmUgZm9yIGFzeW5jIHVwZGF0ZVxuICAgIGF3YWl0IFNlc3Npb25zQ29sbGVjdGlvbi5yYXdDb2xsZWN0aW9uKCkudXBkYXRlT25lKFxuICAgICAgeyBpZDogc2Vzc2lvbklkIH0sXG4gICAgICB7ICRzZXQ6IHsgcXVlc3Rpb25zOiBzZXNzaW9uLnF1ZXN0aW9ucyB9IH1cbiAgICApO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgYXN5bmMgJ3Nlc3Npb25zLmFkZFBhcnRpY2lwYW50JyhcbiAgICBzZXNzaW9uSWQ6IHN0cmluZyxcbiAgICB1c2VyOiB7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9XG4gICkge1xuICAgIGNoZWNrKHNlc3Npb25JZCwgU3RyaW5nKTtcbiAgICBjaGVjayh1c2VyLCBPYmplY3QpO1xuXG4gICAgLy8gRmluZCBzZXNzaW9uIGJ5IF9pZCAoTW9uZ28gZG9jdW1lbnQgaWQpXG4gICAgLyogY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IFNlc3Npb25zQ29sbGVjdGlvbi5yYXdDb2xsZWN0aW9uKCkuZmluZE9uZSh7XG4gICAgICBpZDogc2Vzc2lvbklkLFxuICAgIH0pO1xuXG4gICAgaWYgKCFzZXNzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtZm91bmQnLCAnU2Vzc2lvbiBub3QgZm91bmQnKTtcbiAgICB9XG4gKi9cbiAgICAvLyBDaGVjayBpZiBwYXJ0aWNpcGFudCBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgcGFydGljaXBhbnRzIGFycmF5XG4gICAgLyogY29uc3QgZXhpc3RzID0gKHNlc3Npb24ucGFydGljaXBhbnRzIHx8IFtdKS5zb21lKChwKSA9PiBwLmlkID09PSB1c2VyLmlkKTtcbiAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAvLyBQYXJ0aWNpcGFudCBhbHJlYWR5IGpvaW5lZCwgbm8gdXBkYXRlIG5lZWRlZFxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICovXG4gICAgLy8gQWRkIHBhcnRpY2lwYW50IHdpdGggYXN5bmMgdXBkYXRlT25lXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgU2Vzc2lvbnNDb2xsZWN0aW9uLnJhd0NvbGxlY3Rpb24oKS51cGRhdGVPbmUoXG4gICAgICB7IGlkOiBzZXNzaW9uSWQgfSxcbiAgICAgIHsgJHB1c2g6IHsgcGFydGljaXBhbnRzOiB7IGlkOiB1c2VyLmlkLCBuYW1lOiB1c2VyLm5hbWUgfSB9IH1cbiAgICApO1xuXG4gICAgLy8gcmVzdWx0Lm1vZGlmaWVkQ291bnQgPT09IDEgbWVhbnMgdXBkYXRlIHN1Y2Nlc3NcbiAgICByZXR1cm4gcmVzdWx0Lm1vZGlmaWVkQ291bnQ7XG4gIH0sXG5cbiAgYXN5bmMgJ3Nlc3Npb25zLnJlbW92ZVBhcnRpY2lwYW50JyhzZXNzaW9uSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpIHtcbiAgICBjaGVjayhzZXNzaW9uSWQsIFN0cmluZyk7XG4gICAgY2hlY2sodXNlcklkLCBTdHJpbmcpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFNlc3Npb25zQ29sbGVjdGlvbi5yYXdDb2xsZWN0aW9uKCkudXBkYXRlT25lKFxuICAgICAgICB7IGlkOiBzZXNzaW9uSWQgfSxcbiAgICAgICAgeyAkcHVsbDogeyBwYXJ0aWNpcGFudHM6IHsgaWQ6IHVzZXJJZCB9IH0gfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdyZW1vdmUgcGFydGljaXBhbnQgPSAnLCBlKTtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3JlbW92ZS1wYXJ0aWNpcGFudC1mYWlsZWQnLCBlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcblxuICBhc3luYyAnc2Vzc2lvbnMucmVzZXRBbnN3ZXJzJyhzZXNzaW9uSWQ6IHN0cmluZywgcXVlc3Rpb25JbmRleDogbnVtYmVyKSB7XG4gICAgY2hlY2soc2Vzc2lvbklkLCBTdHJpbmcpO1xuICAgIGNoZWNrKHF1ZXN0aW9uSW5kZXgsIE51bWJlcik7XG5cbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgU2Vzc2lvbnNDb2xsZWN0aW9uLnJhd0NvbGxlY3Rpb24oKS5maW5kT25lKHtcbiAgICAgIGlkOiBzZXNzaW9uSWQsXG4gICAgfSk7XG4gICAgaWYgKCFzZXNzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtZm91bmQnLCAnU2Vzc2lvbiBub3QgZm91bmQnKTtcbiAgICB9XG5cbiAgICBpZiAoIXNlc3Npb24ucXVlc3Rpb25zIHx8ICFzZXNzaW9uLnF1ZXN0aW9uc1txdWVzdGlvbkluZGV4XSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1xdWVzdGlvbicsICdRdWVzdGlvbiBpbmRleCBpbnZhbGlkJyk7XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgYW5zd2VycyBmb3IgdGhhdCBxdWVzdGlvblxuICAgIGF3YWl0IFNlc3Npb25zQ29sbGVjdGlvbi5yYXdDb2xsZWN0aW9uKCkudXBkYXRlT25lKFxuICAgICAgeyBpZDogc2Vzc2lvbklkIH0sXG4gICAgICB7ICRzZXQ6IHsgW2BxdWVzdGlvbnMuJHtxdWVzdGlvbkluZGV4fS5hbnN3ZXJzYF06IFtdIH0gfVxuICAgICk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbn0pO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBjaGVjayB9IGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQgeyBTZXNzaW9uc0NvbGxlY3Rpb24gfSBmcm9tICcuLi8uLi9pbXBvcnRzL2FwaS9zZXNzaW9ucyc7XG5cbk1ldGVvci5wdWJsaXNoKCdzZXNzaW9ucy5ieUNvZGUnLCBmdW5jdGlvbiAoY29kZTogc3RyaW5nKSB7XG4gIGNvbnN0IGZvdW5kID0gU2Vzc2lvbnNDb2xsZWN0aW9uLmZpbmQoeyBjb2RlIH0pLmZldGNoKCk7XG4gIGNvbnNvbGUubG9nKCdQdWJsaXNoaW5nIHNlc3Npb24gd2l0aCBjb2RlOicsIGNvZGUsIGZvdW5kKTtcbiAgcmV0dXJuIFNlc3Npb25zQ29sbGVjdGlvbi5maW5kKHsgY29kZSB9KTtcbn0pO1xuXG5NZXRlb3IucHVibGlzaCgnc2Vzc2lvbnMuYnlBZG1pbklkJywgZnVuY3Rpb24gKGFkbWluSWQ6IHN0cmluZykge1xuICBjb25zb2xlLmxvZygnUHVibGlzaGluZyBzZXNzaW9ucyBmb3IgYWRtaW5JZDonLCBhZG1pbklkKTtcbiAgY2hlY2soYWRtaW5JZCwgU3RyaW5nKTsgLy8gb3B0aW9uYWwgYnV0IHJlY29tbWVuZGVkIGZvciB2YWxpZGF0aW9uXG4gIHJldHVybiBTZXNzaW9uc0NvbGxlY3Rpb24uZmluZCh7IGFkbWluSWQgfSk7XG59KTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgTGlua3NDb2xsZWN0aW9uIH0gZnJvbSAnL2ltcG9ydHMvYXBpL2xpbmtzJztcbmltcG9ydCAnLi9tZXRob2RzL3Nlc3Npb25zJztcbmltcG9ydCAnLi9wdWJsaWNhdGlvbnMvc2Vzc2lvbnMnO1xuXG5hc3luYyBmdW5jdGlvbiBpbnNlcnRMaW5rKHsgdGl0bGUsIHVybCB9KSB7XG4gIGF3YWl0IExpbmtzQ29sbGVjdGlvbi5pbnNlcnRBc3luYyh7IHRpdGxlLCB1cmwsIGNyZWF0ZWRBdDogbmV3IERhdGUoKSB9KTtcbn1cblxuTWV0ZW9yLnN0YXJ0dXAoYXN5bmMgKCkgPT4ge1xuICAvLyBJZiB0aGUgTGlua3MgY29sbGVjdGlvbiBpcyBlbXB0eSwgYWRkIHNvbWUgZGF0YS5cbiAgaWYgKChhd2FpdCBMaW5rc0NvbGxlY3Rpb24uZmluZCgpLmNvdW50QXN5bmMoKSkgPT09IDApIHtcbiAgICBhd2FpdCBpbnNlcnRMaW5rKHtcbiAgICAgIHRpdGxlOiAnRG8gdGhlIFR1dG9yaWFsJyxcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3Lm1ldGVvci5jb20vdHV0b3JpYWxzL3JlYWN0L2NyZWF0aW5nLWFuLWFwcCcsXG4gICAgfSk7XG5cbiAgICBhd2FpdCBpbnNlcnRMaW5rKHtcbiAgICAgIHRpdGxlOiAnRm9sbG93IHRoZSBHdWlkZScsXG4gICAgICB1cmw6ICdodHRwczovL2d1aWRlLm1ldGVvci5jb20nLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgaW5zZXJ0TGluayh7XG4gICAgICB0aXRsZTogJ1JlYWQgdGhlIERvY3MnLFxuICAgICAgdXJsOiAnaHR0cHM6Ly9kb2NzLm1ldGVvci5jb20nLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgaW5zZXJ0TGluayh7XG4gICAgICB0aXRsZTogJ0Rpc2N1c3Npb25zJyxcbiAgICAgIHVybDogJ2h0dHBzOi8vZm9ydW1zLm1ldGVvci5jb20nLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gV2UgcHVibGlzaCB0aGUgZW50aXJlIExpbmtzIGNvbGxlY3Rpb24gdG8gYWxsIGNsaWVudHMuXG4gIC8vIEluIG9yZGVyIHRvIGJlIGZldGNoZWQgaW4gcmVhbC10aW1lIHRvIHRoZSBjbGllbnRzXG4gIE1ldGVvci5wdWJsaXNoKCdsaW5rcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gTGlua3NDb2xsZWN0aW9uLmZpbmQoKTtcbiAgfSk7XG59KTtcbiJdfQ==
