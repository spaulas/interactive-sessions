Package["core-runtime"].queue("accounts-password",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var Accounts = Package['accounts-base'].Accounts;
var SHA256 = Package.sha.SHA256;
var EJSON = Package.ejson.EJSON;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Email = Package.email.Email;
var EmailInternals = Package.email.EmailInternals;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-password":{"email_templates.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-password/email_templates.js                                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let _objectSpread;
    module.link("@babel/runtime/helpers/objectSpread2", {
      default(v) {
        _objectSpread = v;
      }
    }, 0);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    const greet = welcomeMsg => (user, url) => {
      const greeting = user.profile && user.profile.name ? "Hello ".concat(user.profile.name, ",") : 'Hello,';
      return "".concat(greeting, "\n\n").concat(welcomeMsg, ", simply click the link below.\n\n").concat(url, "\n\nThank you.\n");
    };

    /**
     * @summary Options to customize emails sent from the Accounts system.
     * @locus Server
     * @importFromPackage accounts-base
     */
    Accounts.emailTemplates = _objectSpread(_objectSpread({}, Accounts.emailTemplates || {}), {}, {
      from: 'Accounts Example <no-reply@example.com>',
      siteName: Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      resetPassword: {
        subject: () => "How to reset your password on ".concat(Accounts.emailTemplates.siteName),
        text: greet('To reset your password')
      },
      verifyEmail: {
        subject: () => "How to verify email address on ".concat(Accounts.emailTemplates.siteName),
        text: greet('To verify your account email')
      },
      enrollAccount: {
        subject: () => "An account has been created for you on ".concat(Accounts.emailTemplates.siteName),
        text: greet('To start using the service')
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"password_server.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-password/password_server.js                                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {
  "use strict";
  try {
    let _objectSpread;
    module.link("@babel/runtime/helpers/objectSpread2", {
      default(v) {
        _objectSpread = v;
      }
    }, 0);
    let argon2;
    module.link("argon2", {
      default(v) {
        argon2 = v;
      }
    }, 0);
    let bcryptHash, bcryptCompare;
    module.link("bcrypt", {
      hash(v) {
        bcryptHash = v;
      },
      compare(v) {
        bcryptCompare = v;
      }
    }, 1);
    let Accounts;
    module.link("meteor/accounts-base", {
      Accounts(v) {
        Accounts = v;
      }
    }, 2);
    if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
    // Utility for grabbing user
    const getUserById = async (id, options) => await Meteor.users.findOneAsync(id, Accounts._addDefaultFieldSelector(options));

    // User records have two fields that are used for password-based login:
    // - 'services.password.bcrypt', which stores the bcrypt password, which will be deprecated
    // - 'services.password.argon2', which stores the argon2 password
    //
    // When the client sends a password to the server, it can either be a
    // string (the plaintext password) or an object with keys 'digest' and
    // 'algorithm' (must be "sha-256" for now). The Meteor client always sends
    // password objects { digest: *, algorithm: "sha-256" }, but DDP clients
    // that don't have access to SHA can just send plaintext passwords as
    // strings.
    //
    // When the server receives a plaintext password as a string, it always
    // hashes it with SHA256 before passing it into bcrypt / argon2. When the server
    // receives a password as an object, it asserts that the algorithm is
    // "sha-256" and then passes the digest to bcrypt / argon2.

    Accounts._bcryptRounds = () => Accounts._options.bcryptRounds || 10;
    Accounts._argon2Enabled = () => Accounts._options.argon2Enabled || false;
    const ARGON2_TYPES = {
      argon2i: argon2.argon2i,
      argon2d: argon2.argon2d,
      argon2id: argon2.argon2id
    };
    Accounts._argon2Type = () => ARGON2_TYPES[Accounts._options.argon2Type] || argon2.argon2id;
    Accounts._argon2TimeCost = () => Accounts._options.argon2TimeCost || 2;
    Accounts._argon2MemoryCost = () => Accounts._options.argon2MemoryCost || 19456;
    Accounts._argon2Parallelism = () => Accounts._options.argon2Parallelism || 1;

    /**
     * Extracts the string to be encrypted using bcrypt or Argon2 from the given `password`.
     *
     * @param {string|Object} password - The password provided by the client. It can be:
     *  - A plaintext string password.
     *  - An object with the following properties:
     *      @property {string} digest - The hashed password.
     *      @property {string} algorithm - The hashing algorithm used. Must be "sha-256".
     *
     * @returns {string} - The resulting password string to encrypt.
     *
     * @throws {Error} - If the `algorithm` in the password object is not "sha-256".
     */
    const getPasswordString = password => {
      if (typeof password === "string") {
        password = SHA256(password);
      } else {
        // 'password' is an object
        if (password.algorithm !== "sha-256") {
          throw new Error("Invalid password hash algorithm. " + "Only 'sha-256' is allowed.");
        }
        password = password.digest;
      }
      return password;
    };

    /**
     * Encrypt the given `password` using either bcrypt or Argon2.
     * @param password can be a string (in which case it will be run through SHA256 before encryption) or an object with properties `digest` and `algorithm` (in which case we bcrypt or Argon2 `password.digest`).
     * @returns {Promise<string>} The encrypted password.
     */
    const hashPassword = async password => {
      password = getPasswordString(password);
      if (Accounts._argon2Enabled() === true) {
        return await argon2.hash(password, {
          type: Accounts._argon2Type(),
          timeCost: Accounts._argon2TimeCost(),
          memoryCost: Accounts._argon2MemoryCost(),
          parallelism: Accounts._argon2Parallelism()
        });
      } else {
        return await bcryptHash(password, Accounts._bcryptRounds());
      }
    };

    // Extract the number of rounds used in the specified bcrypt hash.
    const getRoundsFromBcryptHash = hash => {
      let rounds;
      if (hash) {
        const hashSegments = hash.split("$");
        if (hashSegments.length > 2) {
          rounds = parseInt(hashSegments[2], 10);
        }
      }
      return rounds;
    };
    Accounts._getRoundsFromBcryptHash = getRoundsFromBcryptHash;

    /**
     * Extract readable parameters from an Argon2 hash string.
     * @param {string} hash - The Argon2 hash string.
     * @returns {object} An object containing the parsed parameters.
     * @throws {Error} If the hash format is invalid.
     */
    function getArgon2Params(hash) {
      const regex = /^\$(argon2(?:i|d|id))\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)/;
      const match = hash.match(regex);
      if (!match) {
        throw new Error("Invalid Argon2 hash format.");
      }
      const [, type, memoryCost, timeCost, parallelism] = match;
      return {
        type: ARGON2_TYPES[type],
        timeCost: parseInt(timeCost, 10),
        memoryCost: parseInt(memoryCost, 10),
        parallelism: parseInt(parallelism, 10)
      };
    }
    Accounts._getArgon2Params = getArgon2Params;
    const getUserPasswordHash = user => {
      var _user$services, _user$services$passwo, _user$services2, _user$services2$passw;
      return ((_user$services = user.services) === null || _user$services === void 0 ? void 0 : (_user$services$passwo = _user$services.password) === null || _user$services$passwo === void 0 ? void 0 : _user$services$passwo.argon2) || ((_user$services2 = user.services) === null || _user$services2 === void 0 ? void 0 : (_user$services2$passw = _user$services2.password) === null || _user$services2$passw === void 0 ? void 0 : _user$services2$passw.bcrypt);
    };
    Accounts._checkPasswordUserFields = {
      _id: 1,
      services: 1
    };
    const isBcrypt = hash => {
      // bcrypt hashes start with $2a$ or $2b$
      return hash.startsWith("$2");
    };
    const isArgon = hash => {
      // argon2 hashes start with $argon2i$, $argon2d$ or $argon2id$
      return hash.startsWith("$argon2");
    };
    const updateUserPasswordDefered = (user, formattedPassword) => {
      Meteor.defer(async () => {
        await updateUserPassword(user, formattedPassword);
      });
    };

    /**
     * Hashes the provided password and returns an object that can be used to update the user's password.
     * @param formattedPassword
     * @returns {Promise<{$set: {"services.password.bcrypt": string}}|{$unset: {"services.password.bcrypt": number}, $set: {"services.password.argon2": string}}>}
     */
    const getUpdatorForUserPassword = async formattedPassword => {
      const encryptedPassword = await hashPassword(formattedPassword);
      if (Accounts._argon2Enabled() === false) {
        return {
          $set: {
            "services.password.bcrypt": encryptedPassword
          },
          $unset: {
            "services.password.argon2": 1
          }
        };
      } else if (Accounts._argon2Enabled() === true) {
        return {
          $set: {
            "services.password.argon2": encryptedPassword
          },
          $unset: {
            "services.password.bcrypt": 1
          }
        };
      }
    };
    const updateUserPassword = async (user, formattedPassword) => {
      const updator = await getUpdatorForUserPassword(formattedPassword);
      await Meteor.users.updateAsync({
        _id: user._id
      }, updator);
    };

    /**
     * Checks whether the provided password matches the hashed password stored in the user's database record.
     *
     * @param {Object} user - The user object containing at least:
     *   @property {string} _id - The user's unique identifier.
     *   @property {Object} services - The user's services data.
     *   @property {Object} services.password - The user's password object.
     *   @property {string} [services.password.argon2] - The Argon2 hashed password.
     *   @property {string} [services.password.bcrypt] - The bcrypt hashed password, deprecated
     *
     * @param {string|Object} password - The password provided by the client. It can be:
     *   - A plaintext string password.
     *   - An object with the following properties:
     *       @property {string} digest - The hashed password.
     *       @property {string} algorithm - The hashing algorithm used. Must be "sha-256".
     *
     * @returns {Promise<Object>} - A result object with the following properties:
     *   @property {string} userId - The user's unique identifier.
     *   @property {Object} [error] - An error object if the password does not match or an error occurs.
     *
     * @throws {Error} - If an unexpected error occurs during the process.
     */
    const checkPasswordAsync = async (user, password) => {
      const result = {
        userId: user._id
      };
      const formattedPassword = getPasswordString(password);
      const hash = getUserPasswordHash(user);
      const argon2Enabled = Accounts._argon2Enabled();
      if (argon2Enabled === false) {
        if (isArgon(hash)) {
          // this is a rollback feature, enabling to switch back from argon2 to bcrypt if needed
          // TODO : deprecate this
          console.warn("User has an argon2 password and argon2 is not enabled, rolling back to bcrypt encryption");
          const match = await argon2.verify(hash, formattedPassword);
          if (!match) {
            result.error = Accounts._handleError("Incorrect password", false);
          } else {
            // The password checks out, but the user's stored password needs to be updated to argon2
            updateUserPasswordDefered(user, {
              digest: formattedPassword,
              algorithm: "sha-256"
            });
          }
        } else {
          const hashRounds = getRoundsFromBcryptHash(hash);
          const match = await bcryptCompare(formattedPassword, hash);
          if (!match) {
            result.error = Accounts._handleError("Incorrect password", false);
          } else if (hash) {
            const paramsChanged = hashRounds !== Accounts._bcryptRounds();
            // The password checks out, but the user's bcrypt hash needs to be updated
            // to match current bcrypt settings
            if (paramsChanged === true) {
              updateUserPasswordDefered(user, {
                digest: formattedPassword,
                algorithm: "sha-256"
              });
            }
          }
        }
      } else if (argon2Enabled === true) {
        if (isBcrypt(hash)) {
          // migration code from bcrypt to argon2
          const match = await bcryptCompare(formattedPassword, hash);
          if (!match) {
            result.error = Accounts._handleError("Incorrect password", false);
          } else {
            // The password checks out, but the user's stored password needs to be updated to argon2
            updateUserPasswordDefered(user, {
              digest: formattedPassword,
              algorithm: "sha-256"
            });
          }
        } else {
          // argon2 password
          const argon2Params = getArgon2Params(hash);
          const match = await argon2.verify(hash, formattedPassword);
          if (!match) {
            result.error = Accounts._handleError("Incorrect password", false);
          } else if (hash) {
            const paramsChanged = argon2Params.memoryCost !== Accounts._argon2MemoryCost() || argon2Params.timeCost !== Accounts._argon2TimeCost() || argon2Params.parallelism !== Accounts._argon2Parallelism() || argon2Params.type !== Accounts._argon2Type();
            if (paramsChanged === true) {
              // The password checks out, but the user's argon2 hash needs to be updated with the right params
              updateUserPasswordDefered(user, {
                digest: formattedPassword,
                algorithm: "sha-256"
              });
            }
          }
        }
      }
      return result;
    };
    Accounts._checkPasswordAsync = checkPasswordAsync;

    ///
    /// LOGIN
    ///

    /**
     * @summary Finds the user asynchronously with the specified username.
     * First tries to match username case sensitively; if that fails, it
     * tries case insensitively; but if more than one user matches the case
     * insensitive search, it returns null.
     * @locus Server
     * @param {String} username The username to look for
     * @param {Object} [options]
     * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
     * @returns {Promise<Object>} A user if found, else null
     * @importFromPackage accounts-base
     */
    Accounts.findUserByUsername = async (username, options) => await Accounts._findUserByQuery({
      username
    }, options);

    /**
     * @summary Finds the user asynchronously with the specified email.
     * First tries to match email case sensitively; if that fails, it
     * tries case insensitively; but if more than one user matches the case
     * insensitive search, it returns null.
     * @locus Server
     * @param {String} email The email address to look for
     * @param {Object} [options]
     * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
     * @returns {Promise<Object>} A user if found, else null
     * @importFromPackage accounts-base
     */
    Accounts.findUserByEmail = async (email, options) => await Accounts._findUserByQuery({
      email
    }, options);

    // XXX maybe this belongs in the check package
    const NonEmptyString = Match.Where(x => {
      check(x, String);
      return x.length > 0;
    });
    const passwordValidator = Match.OneOf(Match.Where(str => {
      var _Meteor$settings, _Meteor$settings$pack, _Meteor$settings$pack2;
      return Match.test(str, String) && str.length <= ((_Meteor$settings = Meteor.settings) === null || _Meteor$settings === void 0 ? void 0 : (_Meteor$settings$pack = _Meteor$settings.packages) === null || _Meteor$settings$pack === void 0 ? void 0 : (_Meteor$settings$pack2 = _Meteor$settings$pack.accounts) === null || _Meteor$settings$pack2 === void 0 ? void 0 : _Meteor$settings$pack2.passwordMaxLength) || 256;
    }), {
      digest: Match.Where(str => Match.test(str, String) && str.length === 64),
      algorithm: Match.OneOf('sha-256')
    });

    // Handler to login with a password.
    //
    // The Meteor client sets options.password to an object with keys
    // 'digest' (set to SHA256(password)) and 'algorithm' ("sha-256").
    //
    // For other DDP clients which don't have access to SHA, the handler
    // also accepts the plaintext password in options.password as a string.
    //
    // (It might be nice if servers could turn the plaintext password
    // option off. Or maybe it should be opt-in, not opt-out?
    // Accounts.config option?)
    //
    // Note that neither password option is secure without SSL.
    //
    Accounts.registerLoginHandler("password", async options => {
      var _Accounts$_check2faEn, _Accounts;
      if (!options.password) return undefined; // don't handle

      check(options, {
        user: Accounts._userQueryValidator,
        password: passwordValidator,
        code: Match.Optional(NonEmptyString)
      });
      const user = await Accounts._findUserByQuery(options.user, {
        fields: _objectSpread({
          services: 1
        }, Accounts._checkPasswordUserFields)
      });
      if (!user) {
        Accounts._handleError("User not found");
      }
      if (!getUserPasswordHash(user)) {
        Accounts._handleError("User has no password set");
      }
      const result = await checkPasswordAsync(user, options.password);
      // This method is added by the package accounts-2fa
      // First the login is validated, then the code situation is checked
      if (!result.error && (_Accounts$_check2faEn = (_Accounts = Accounts)._check2faEnabled) !== null && _Accounts$_check2faEn !== void 0 && _Accounts$_check2faEn.call(_Accounts, user)) {
        if (!options.code) {
          Accounts._handleError('2FA code must be informed', true, 'no-2fa-code');
        }
        if (!Accounts._isTokenValid(user.services.twoFactorAuthentication.secret, options.code)) {
          Accounts._handleError('Invalid 2FA code', true, 'invalid-2fa-code');
        }
      }
      return result;
    });

    ///
    /// CHANGING
    ///

    /**
     * @summary Change a user's username asynchronously. Use this instead of updating the
     * database directly. The operation will fail if there is an existing user
     * with a username only differing in case.
     * @locus Server
     * @param {String} userId The ID of the user to update.
     * @param {String} newUsername A new username for the user.
     * @importFromPackage accounts-base
     */
    Accounts.setUsername = async (userId, newUsername) => {
      check(userId, NonEmptyString);
      check(newUsername, NonEmptyString);
      const user = await getUserById(userId, {
        fields: {
          username: 1
        }
      });
      if (!user) {
        Accounts._handleError("User not found");
      }
      const oldUsername = user.username;

      // Perform a case insensitive check for duplicates before update
      await Accounts._checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
      await Meteor.users.updateAsync({
        _id: user._id
      }, {
        $set: {
          username: newUsername
        }
      });

      // Perform another check after update, in case a matching user has been
      // inserted in the meantime
      try {
        await Accounts._checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
      } catch (ex) {
        // Undo update if the check fails
        await Meteor.users.updateAsync({
          _id: user._id
        }, {
          $set: {
            username: oldUsername
          }
        });
        throw ex;
      }
    };

    // Let the user change their own password if they know the old
    // password. `oldPassword` and `newPassword` should be objects with keys
    // `digest` and `algorithm` (representing the SHA256 of the password).
    Meteor.methods({
      changePassword: async function (oldPassword, newPassword) {
        check(oldPassword, passwordValidator);
        check(newPassword, passwordValidator);
        if (!this.userId) {
          throw new Meteor.Error(401, "Must be logged in");
        }
        const user = await getUserById(this.userId, {
          fields: _objectSpread({
            services: 1
          }, Accounts._checkPasswordUserFields)
        });
        if (!user) {
          Accounts._handleError("User not found");
        }
        if (!getUserPasswordHash(user)) {
          Accounts._handleError("User has no password set");
        }
        const result = await checkPasswordAsync(user, oldPassword);
        if (result.error) {
          throw result.error;
        }

        // It would be better if this removed ALL existing tokens and replaced
        // the token for the current connection with a new one, but that would
        // be tricky, so we'll settle for just replacing all tokens other than
        // the one for the current connection.
        const currentToken = Accounts._getLoginToken(this.connection.id);
        const updator = await getUpdatorForUserPassword(newPassword);
        await Meteor.users.updateAsync({
          _id: this.userId
        }, {
          $set: updator.$set,
          $pull: {
            "services.resume.loginTokens": {
              hashedToken: {
                $ne: currentToken
              }
            }
          },
          $unset: _objectSpread({
            "services.password.reset": 1
          }, updator.$unset)
        });
        return {
          passwordChanged: true
        };
      }
    });

    // Force change the users password.

    /**
     * @summary Forcibly change the password for a user.
     * @locus Server
     * @param {String} userId The id of the user to update.
     * @param {String} newPlaintextPassword A new password for the user.
     * @param {Object} [options]
     * @param {Object} options.logout Logout all current connections with this userId (default: true)
     * @importFromPackage accounts-base
     */
    Accounts.setPasswordAsync = async (userId, newPlaintextPassword, options) => {
      check(userId, String);
      check(newPlaintextPassword, Match.Where(str => {
        var _Meteor$settings2, _Meteor$settings2$pac, _Meteor$settings2$pac2;
        return Match.test(str, String) && str.length <= ((_Meteor$settings2 = Meteor.settings) === null || _Meteor$settings2 === void 0 ? void 0 : (_Meteor$settings2$pac = _Meteor$settings2.packages) === null || _Meteor$settings2$pac === void 0 ? void 0 : (_Meteor$settings2$pac2 = _Meteor$settings2$pac.accounts) === null || _Meteor$settings2$pac2 === void 0 ? void 0 : _Meteor$settings2$pac2.passwordMaxLength) || 256;
      }));
      check(options, Match.Maybe({
        logout: Boolean
      }));
      options = _objectSpread({
        logout: true
      }, options);
      const user = await getUserById(userId, {
        fields: {
          _id: 1
        }
      });
      if (!user) {
        throw new Meteor.Error(403, "User not found");
      }
      let updator = await getUpdatorForUserPassword(newPlaintextPassword);
      updator.$unset = updator.$unset || {};
      updator.$unset["services.password.reset"] = 1;
      if (options.logout) {
        updator.$unset["services.resume.loginTokens"] = 1;
      }
      await Meteor.users.updateAsync({
        _id: user._id
      }, updator);
    };

    ///
    /// RESETTING VIA EMAIL
    ///

    // Utility for plucking addresses from emails
    const pluckAddresses = function () {
      let emails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      return emails.map(email => email.address);
    };

    // Method called by a user to request a password reset email. This is
    // the start of the reset process.
    Meteor.methods({
      forgotPassword: async options => {
        check(options, {
          email: String
        });
        const user = await Accounts.findUserByEmail(options.email, {
          fields: {
            emails: 1
          }
        });
        if (!user) {
          Accounts._handleError("User not found");
        }
        const emails = pluckAddresses(user.emails);
        const caseSensitiveEmail = emails.find(email => email.toLowerCase() === options.email.toLowerCase());
        await Accounts.sendResetPasswordEmail(user._id, caseSensitiveEmail);
      }
    });

    /**
     * @summary Asynchronously generates a reset token and saves it into the database.
     * @locus Server
     * @param {String} userId The id of the user to generate the reset token for.
     * @param {String} email Which address of the user to generate the reset token for. This address must be in the user's `emails` list. If `null`, defaults to the first email in the list.
     * @param {String} reason `resetPassword` or `enrollAccount`.
     * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
     * @returns {Promise<Object>} Promise of an object with {email, user, token} values.
     * @importFromPackage accounts-base
     */
    Accounts.generateResetToken = async (userId, email, reason, extraTokenData) => {
      // Make sure the user exists, and email is one of their addresses.
      // Don't limit the fields in the user object since the user is returned
      // by the function and some other fields might be used elsewhere.
      const user = await getUserById(userId);
      if (!user) {
        Accounts._handleError("Can't find user");
      }

      // pick the first email if we weren't passed an email.
      if (!email && user.emails && user.emails[0]) {
        email = user.emails[0].address;
      }

      // make sure we have a valid email
      if (!email || !pluckAddresses(user.emails).includes(email)) {
        Accounts._handleError("No such email for user.");
      }
      const token = Random.secret();
      const tokenRecord = {
        token,
        email,
        when: new Date()
      };
      if (reason === 'resetPassword') {
        tokenRecord.reason = 'reset';
      } else if (reason === 'enrollAccount') {
        tokenRecord.reason = 'enroll';
      } else if (reason) {
        // fallback so that this function can be used for unknown reasons as well
        tokenRecord.reason = reason;
      }
      if (extraTokenData) {
        Object.assign(tokenRecord, extraTokenData);
      }
      // if this method is called from the enroll account work-flow then
      // store the token record in 'services.password.enroll' db field
      // else store the token record in in 'services.password.reset' db field
      if (reason === "enrollAccount") {
        await Meteor.users.updateAsync({
          _id: user._id
        }, {
          $set: {
            "services.password.enroll": tokenRecord
          }
        });
        // before passing to template, update user object with new token
        Meteor._ensure(user, "services", "password").enroll = tokenRecord;
      } else {
        await Meteor.users.updateAsync({
          _id: user._id
        }, {
          $set: {
            "services.password.reset": tokenRecord
          }
        });
        // before passing to template, update user object with new token
        Meteor._ensure(user, "services", "password").reset = tokenRecord;
      }
      return {
        email,
        user,
        token
      };
    };

    /**
     * @summary Generates asynchronously an e-mail verification token and saves it into the database.
     * @locus Server
     * @param {String} userId The id of the user to generate the  e-mail verification token for.
     * @param {String} email Which address of the user to generate the e-mail verification token for. This address must be in the user's `emails` list. If `null`, defaults to the first unverified email in the list.
     * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
     * @returns {Promise<Object>} Promise of an object with {email, user, token} values.
     * @importFromPackage accounts-base
     */
    Accounts.generateVerificationToken = async (userId, email, extraTokenData) => {
      // Make sure the user exists, and email is one of their addresses.
      // Don't limit the fields in the user object since the user is returned
      // by the function and some other fields might be used elsewhere.
      const user = await getUserById(userId);
      if (!user) {
        Accounts._handleError("Can't find user");
      }

      // pick the first unverified email if we weren't passed an email.
      if (!email) {
        const emailRecord = (user.emails || []).find(e => !e.verified);
        email = (emailRecord || {}).address;
        if (!email) {
          Accounts._handleError("That user has no unverified email addresses.");
        }
      }

      // make sure we have a valid email
      if (!email || !pluckAddresses(user.emails).includes(email)) {
        Accounts._handleError("No such email for user.");
      }
      const token = Random.secret();
      const tokenRecord = {
        token,
        // TODO: This should probably be renamed to "email" to match reset token record.
        address: email,
        when: new Date()
      };
      if (extraTokenData) {
        Object.assign(tokenRecord, extraTokenData);
      }
      await Meteor.users.updateAsync({
        _id: user._id
      }, {
        $push: {
          'services.email.verificationTokens': tokenRecord
        }
      });

      // before passing to template, update user object with new token
      Meteor._ensure(user, 'services', 'email');
      if (!user.services.email.verificationTokens) {
        user.services.email.verificationTokens = [];
      }
      user.services.email.verificationTokens.push(tokenRecord);
      return {
        email,
        user,
        token
      };
    };

    // send the user an email with a link that when opened allows the user
    // to set a new password, without the old password.

    /**
     * @summary Send an email asynchronously with a link the user can use to reset their password.
     * @locus Server
     * @param {String} userId The id of the user to send email to.
     * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
     * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
     * @param {Object} [extraParams] Optional additional params to be added to the reset url.
     * @returns {Promise<Object>} Promise of an object with {email, user, token, url, options} values.
     * @importFromPackage accounts-base
     */
    Accounts.sendResetPasswordEmail = async (userId, email, extraTokenData, extraParams) => {
      const {
        email: realEmail,
        user,
        token
      } = await Accounts.generateResetToken(userId, email, 'resetPassword', extraTokenData);
      const url = Accounts.urls.resetPassword(token, extraParams);
      const options = await Accounts.generateOptionsForEmail(realEmail, user, url, 'resetPassword');
      await Email.sendAsync(options);
      if (Meteor.isDevelopment && !Meteor.isPackageTest) {
        console.log("\nReset password URL: ".concat(url));
      }
      return {
        email: realEmail,
        user,
        token,
        url,
        options
      };
    };

    // send the user an email informing them that their account was created, with
    // a link that when opened both marks their email as verified and forces them
    // to choose their password. The email must be one of the addresses in the
    // user's emails field, or undefined to pick the first email automatically.
    //
    // This is not called automatically. It must be called manually if you
    // want to use enrollment emails.

    /**
     * @summary Send an email asynchronously with a link the user can use to set their initial password.
     * @locus Server
     * @param {String} userId The id of the user to send email to.
     * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
     * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
     * @param {Object} [extraParams] Optional additional params to be added to the enrollment url.
     * @returns {Promise<Object>} Promise of an object {email, user, token, url, options} values.
     * @importFromPackage accounts-base
     */
    Accounts.sendEnrollmentEmail = async (userId, email, extraTokenData, extraParams) => {
      const {
        email: realEmail,
        user,
        token
      } = await Accounts.generateResetToken(userId, email, 'enrollAccount', extraTokenData);
      const url = Accounts.urls.enrollAccount(token, extraParams);
      const options = await Accounts.generateOptionsForEmail(realEmail, user, url, 'enrollAccount');
      await Email.sendAsync(options);
      if (Meteor.isDevelopment && !Meteor.isPackageTest) {
        console.log("\nEnrollment email URL: ".concat(url));
      }
      return {
        email: realEmail,
        user,
        token,
        url,
        options
      };
    };

    // Take token from sendResetPasswordEmail or sendEnrollmentEmail, change
    // the users password, and log them in.
    Meteor.methods({
      resetPassword: async function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        const token = args[0];
        const newPassword = args[1];
        return await Accounts._loginMethod(this, "resetPassword", args, "password", async () => {
          var _Accounts$_check2faEn2, _Accounts2;
          check(token, String);
          check(newPassword, passwordValidator);
          let user = await Meteor.users.findOneAsync({
            "services.password.reset.token": token
          }, {
            fields: {
              services: 1,
              emails: 1
            }
          });
          let isEnroll = false;
          // if token is in services.password.reset db field implies
          // this method is was not called from enroll account workflow
          // else this method is called from enroll account workflow
          if (!user) {
            user = await Meteor.users.findOneAsync({
              "services.password.enroll.token": token
            }, {
              fields: {
                services: 1,
                emails: 1
              }
            });
            isEnroll = true;
          }
          if (!user) {
            throw new Meteor.Error(403, "Token expired");
          }
          let tokenRecord = {};
          if (isEnroll) {
            tokenRecord = user.services.password.enroll;
          } else {
            tokenRecord = user.services.password.reset;
          }
          const {
            when,
            email
          } = tokenRecord;
          let tokenLifetimeMs = Accounts._getPasswordResetTokenLifetimeMs();
          if (isEnroll) {
            tokenLifetimeMs = Accounts._getPasswordEnrollTokenLifetimeMs();
          }
          const currentTimeMs = Date.now();
          if (currentTimeMs - when > tokenLifetimeMs) throw new Meteor.Error(403, "Token expired");
          if (!pluckAddresses(user.emails).includes(email)) return {
            userId: user._id,
            error: new Meteor.Error(403, "Token has invalid email address")
          };

          // NOTE: We're about to invalidate tokens on the user, who we might be
          // logged in as. Make sure to avoid logging ourselves out if this
          // happens. But also make sure not to leave the connection in a state
          // of having a bad token set if things fail.
          const oldToken = Accounts._getLoginToken(this.connection.id);
          Accounts._setLoginToken(user._id, this.connection, null);
          const resetToOldToken = () => Accounts._setLoginToken(user._id, this.connection, oldToken);
          const updator = await getUpdatorForUserPassword(newPassword);
          try {
            // Update the user record by:
            // - Changing the password to the new one
            // - Forgetting about the reset token or enroll token that was just used
            // - Verifying their email, since they got the password reset via email.
            let affectedRecords = {};
            // if reason is enroll then check services.password.enroll.token field for affected records
            if (isEnroll) {
              affectedRecords = await Meteor.users.updateAsync({
                _id: user._id,
                "emails.address": email,
                "services.password.enroll.token": token
              }, {
                $set: _objectSpread({
                  "emails.$.verified": true
                }, updator.$set),
                $unset: _objectSpread({
                  "services.password.enroll": 1
                }, updator.$unset)
              });
            } else {
              affectedRecords = await Meteor.users.updateAsync({
                _id: user._id,
                "emails.address": email,
                "services.password.reset.token": token
              }, {
                $set: _objectSpread({
                  "emails.$.verified": true
                }, updator.$set),
                $unset: _objectSpread({
                  "services.password.reset": 1
                }, updator.$unset)
              });
            }
            if (affectedRecords !== 1) return {
              userId: user._id,
              error: new Meteor.Error(403, "Invalid email")
            };
          } catch (err) {
            resetToOldToken();
            throw err;
          }

          // Replace all valid login tokens with new ones (changing
          // password should invalidate existing sessions).
          await Accounts._clearAllLoginTokens(user._id);
          if ((_Accounts$_check2faEn2 = (_Accounts2 = Accounts)._check2faEnabled) !== null && _Accounts$_check2faEn2 !== void 0 && _Accounts$_check2faEn2.call(_Accounts2, user)) {
            return {
              userId: user._id,
              error: Accounts._handleError('Changed password, but user not logged in because 2FA is enabled', false, '2fa-enabled')
            };
          }
          return {
            userId: user._id
          };
        });
      }
    });

    ///
    /// EMAIL VERIFICATION
    ///

    // send the user an email with a link that when opened marks that
    // address as verified

    /**
     * @summary Send an email asynchronously with a link the user can use verify their email address.
     * @locus Server
     * @param {String} userId The id of the user to send email to.
     * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first unverified email in the list.
     * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
     * @param {Object} [extraParams] Optional additional params to be added to the verification url.
     * @returns {Promise<Object>} Promise of an object with {email, user, token, url, options} values.
     * @importFromPackage accounts-base
     */
    Accounts.sendVerificationEmail = async (userId, email, extraTokenData, extraParams) => {
      // XXX Also generate a link using which someone can delete this
      // account if they own said address but weren't those who created
      // this account.

      const {
        email: realEmail,
        user,
        token
      } = await Accounts.generateVerificationToken(userId, email, extraTokenData);
      const url = Accounts.urls.verifyEmail(token, extraParams);
      const options = await Accounts.generateOptionsForEmail(realEmail, user, url, 'verifyEmail');
      await Email.sendAsync(options);
      if (Meteor.isDevelopment && !Meteor.isPackageTest) {
        console.log("\nVerification email URL: ".concat(url));
      }
      return {
        email: realEmail,
        user,
        token,
        url,
        options
      };
    };

    // Take token from sendVerificationEmail, mark the email as verified,
    // and log them in.
    Meteor.methods({
      verifyEmail: async function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        const token = args[0];
        return await Accounts._loginMethod(this, "verifyEmail", args, "password", async () => {
          var _Accounts$_check2faEn3, _Accounts3;
          check(token, String);
          const user = await Meteor.users.findOneAsync({
            'services.email.verificationTokens.token': token
          }, {
            fields: {
              services: 1,
              emails: 1
            }
          });
          if (!user) throw new Meteor.Error(403, "Verify email link expired");
          const tokenRecord = await user.services.email.verificationTokens.find(t => t.token == token);
          if (!tokenRecord) return {
            userId: user._id,
            error: new Meteor.Error(403, "Verify email link expired")
          };
          const emailsRecord = user.emails.find(e => e.address == tokenRecord.address);
          if (!emailsRecord) return {
            userId: user._id,
            error: new Meteor.Error(403, "Verify email link is for unknown address")
          };

          // By including the address in the query, we can use 'emails.$' in the
          // modifier to get a reference to the specific object in the emails
          // array. See
          // http://www.mongodb.org/display/DOCS/Updating/#Updating-The%24positionaloperator)
          // http://www.mongodb.org/display/DOCS/Updating#Updating-%24pull
          await Meteor.users.updateAsync({
            _id: user._id,
            'emails.address': tokenRecord.address
          }, {
            $set: {
              'emails.$.verified': true
            },
            $pull: {
              'services.email.verificationTokens': {
                address: tokenRecord.address
              }
            }
          });
          if ((_Accounts$_check2faEn3 = (_Accounts3 = Accounts)._check2faEnabled) !== null && _Accounts$_check2faEn3 !== void 0 && _Accounts$_check2faEn3.call(_Accounts3, user)) {
            return {
              userId: user._id,
              error: Accounts._handleError('Email verified, but user not logged in because 2FA is enabled', false, '2fa-enabled')
            };
          }
          return {
            userId: user._id
          };
        });
      }
    });

    /**
     * @summary Asynchronously add an email address for a user. Use this instead of directly
     * updating the database. The operation will fail if there is a different user
     * with an email only differing in case. If the specified user has an existing
     * email only differing in case however, we replace it.
     * @locus Server
     * @param {String} userId The ID of the user to update.
     * @param {String} newEmail A new email address for the user.
     * @param {Boolean} [verified] Optional - whether the new email address should
     * be marked as verified. Defaults to false.
     * @importFromPackage accounts-base
     */
    Accounts.addEmailAsync = async (userId, newEmail, verified) => {
      check(userId, NonEmptyString);
      check(newEmail, NonEmptyString);
      check(verified, Match.Optional(Boolean));
      if (verified === void 0) {
        verified = false;
      }
      const user = await getUserById(userId, {
        fields: {
          emails: 1
        }
      });
      if (!user) throw new Meteor.Error(403, "User not found");

      // Allow users to change their own email to a version with a different case

      // We don't have to call checkForCaseInsensitiveDuplicates to do a case
      // insensitive check across all emails in the database here because: (1) if
      // there is no case-insensitive duplicate between this user and other users,
      // then we are OK and (2) if this would create a conflict with other users
      // then there would already be a case-insensitive duplicate and we can't fix
      // that in this code anyway.
      const caseInsensitiveRegExp = new RegExp("^".concat(Meteor._escapeRegExp(newEmail), "$"), "i");

      // TODO: This is a linear search. If we have a lot of emails.
      //  we should consider using a different data structure.
      const updatedEmail = async function () {
        let emails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        let _id = arguments.length > 1 ? arguments[1] : undefined;
        let updated = false;
        for (const email of emails) {
          if (caseInsensitiveRegExp.test(email.address)) {
            await Meteor.users.updateAsync({
              _id: _id,
              "emails.address": email.address
            }, {
              $set: {
                "emails.$.address": newEmail,
                "emails.$.verified": verified
              }
            });
            updated = true;
          }
        }
        return updated;
      };
      const didUpdateOwnEmail = await updatedEmail(user.emails, user._id);

      // In the other updates below, we have to do another call to
      // checkForCaseInsensitiveDuplicates to make sure that no conflicting values
      // were added to the database in the meantime. We don't have to do this for
      // the case where the user is updating their email address to one that is the
      // same as before, but only different because of capitalization. Read the
      // big comment above to understand why.

      if (didUpdateOwnEmail) {
        return;
      }

      // Perform a case insensitive check for duplicates before update
      await Accounts._checkForCaseInsensitiveDuplicates("emails.address", "Email", newEmail, user._id);
      await Meteor.users.updateAsync({
        _id: user._id
      }, {
        $addToSet: {
          emails: {
            address: newEmail,
            verified: verified
          }
        }
      });

      // Perform another check after update, in case a matching user has been
      // inserted in the meantime
      try {
        await Accounts._checkForCaseInsensitiveDuplicates("emails.address", "Email", newEmail, user._id);
      } catch (ex) {
        // Undo update if the check fails
        await Meteor.users.updateAsync({
          _id: user._id
        }, {
          $pull: {
            emails: {
              address: newEmail
            }
          }
        });
        throw ex;
      }
    };

    /**
     * @summary Remove an email address asynchronously for a user. Use this instead of updating
     * the database directly.
     * @locus Server
     * @param {String} userId The ID of the user to update.
     * @param {String} email The email address to remove.
     * @importFromPackage accounts-base
     */
    Accounts.removeEmail = async (userId, email) => {
      check(userId, NonEmptyString);
      check(email, NonEmptyString);
      const user = await getUserById(userId, {
        fields: {
          _id: 1
        }
      });
      if (!user) throw new Meteor.Error(403, "User not found");
      await Meteor.users.updateAsync({
        _id: user._id
      }, {
        $pull: {
          emails: {
            address: email
          }
        }
      });
    };

    ///
    /// CREATING USERS
    ///

    // Shared createUser function called from the createUser method, both
    // if originates in client or server code. Calls user provided hooks,
    // does the actual user insertion.
    //
    // returns the user id
    const createUser = async options => {
      // Unknown keys allowed, because a onCreateUserHook can take arbitrary
      // options.
      check(options, Match.ObjectIncluding({
        username: Match.Optional(String),
        email: Match.Optional(String),
        password: Match.Optional(passwordValidator)
      }));
      const {
        username,
        email,
        password
      } = options;
      if (!username && !email) throw new Meteor.Error(400, "Need to set a username or email");
      const user = {
        services: {}
      };
      if (password) {
        const hashed = await hashPassword(password);
        const argon2Enabled = Accounts._argon2Enabled();
        if (argon2Enabled === false) {
          user.services.password = {
            bcrypt: hashed
          };
        } else {
          user.services.password = {
            argon2: hashed
          };
        }
      }
      return await Accounts._createUserCheckingDuplicates({
        user,
        email,
        username,
        options
      });
    };

    // method for create user. Requests come from the client.
    Meteor.methods({
      createUser: async function () {
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }
        const options = args[0];
        return await Accounts._loginMethod(this, "createUser", args, "password", async () => {
          // createUser() above does more checking.
          check(options, Object);
          if (Accounts._options.forbidClientAccountCreation) return {
            error: new Meteor.Error(403, "Signups forbidden")
          };
          const userId = await Accounts.createUserVerifyingEmail(options);

          // client gets logged in as the new user afterwards.
          return {
            userId: userId
          };
        });
      }
    });

    /**
     * @summary Creates an user asynchronously and sends an email if `options.email` is informed.
     * Then if the `sendVerificationEmail` option from the `Accounts` package is
     * enabled, you'll send a verification email if `options.password` is informed,
     * otherwise you'll send an enrollment email.
     * @locus Server
     * @param {Object} options The options object to be passed down when creating
     * the user
     * @param {String} options.username A unique name for this user.
     * @param {String} options.email The user's email address.
     * @param {String} options.password The user's password. This is __not__ sent in plain text over the wire.
     * @param {Object} options.profile The user's profile, typically including the `name` field.
     * @importFromPackage accounts-base
     * */
    Accounts.createUserVerifyingEmail = async options => {
      options = _objectSpread({}, options);
      // Create user. result contains id and token.
      const userId = await createUser(options);
      // safety belt. createUser is supposed to throw on error. send 500 error
      // instead of sending a verification email with empty userid.
      if (!userId) throw new Error("createUser failed to insert new user");

      // If `Accounts._options.sendVerificationEmail` is set, register
      // a token to verify the user's primary email, and send it to
      // that address.
      if (options.email && Accounts._options.sendVerificationEmail) {
        if (options.password) {
          await Accounts.sendVerificationEmail(userId, options.email);
        } else {
          await Accounts.sendEnrollmentEmail(userId, options.email);
        }
      }
      return userId;
    };

    // Create user directly on the server.
    //
    // Unlike the client version, this does not log you in as this user
    // after creation.
    //
    // returns Promise<userId> or throws an error if it can't create
    //
    // XXX add another argument ("server options") that gets sent to onCreateUser,
    // which is always empty when called from the createUser method? eg, "admin:
    // true", which we want to prevent the client from setting, but which a custom
    // method calling Accounts.createUser could set?
    //

    Accounts.createUserAsync = createUser;

    // Create user directly on the server.
    //
    // Unlike the client version, this does not log you in as this user
    // after creation.
    //
    // returns userId or throws an error if it can't create
    //
    // XXX add another argument ("server options") that gets sent to onCreateUser,
    // which is always empty when called from the createUser method? eg, "admin:
    // true", which we want to prevent the client from setting, but which a custom
    // method calling Accounts.createUser could set?
    //

    Accounts.createUser = Accounts.createUserAsync;

    ///
    /// PASSWORD-SPECIFIC INDEXES ON USERS
    ///
    await Meteor.users.createIndexAsync('services.email.verificationTokens.token', {
      unique: true,
      sparse: true
    });
    await Meteor.users.createIndexAsync('services.password.reset.token', {
      unique: true,
      sparse: true
    });
    await Meteor.users.createIndexAsync('services.password.enroll.token', {
      unique: true,
      sparse: true
    });
    __reify_async_result__();
  } catch (_reifyError) {
    return __reify_async_result__(_reifyError);
  }
  __reify_async_result__()
}, {
  self: this,
  async: true
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"argon2":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/accounts-password/node_modules/argon2/package.json                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "name": "argon2",
  "version": "0.41.1",
  "main": "argon2.cjs"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"argon2.cjs":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/accounts-password/node_modules/argon2/argon2.cjs                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bcrypt":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/accounts-password/node_modules/bcrypt/package.json                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "name": "bcrypt",
  "version": "5.0.1",
  "main": "./bcrypt"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bcrypt.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/accounts-password/node_modules/bcrypt/bcrypt.js                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/accounts-password/email_templates.js",
    "/node_modules/meteor/accounts-password/password_server.js"
  ]
}});

//# sourceURL=meteor://💻app/packages/accounts-password.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtcGFzc3dvcmQvZW1haWxfdGVtcGxhdGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hY2NvdW50cy1wYXNzd29yZC9wYXNzd29yZF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiX29iamVjdFNwcmVhZCIsIm1vZHVsZSIsImxpbmsiLCJkZWZhdWx0IiwidiIsIl9fcmVpZnlXYWl0Rm9yRGVwc19fIiwiZ3JlZXQiLCJ3ZWxjb21lTXNnIiwidXNlciIsInVybCIsImdyZWV0aW5nIiwicHJvZmlsZSIsIm5hbWUiLCJjb25jYXQiLCJBY2NvdW50cyIsImVtYWlsVGVtcGxhdGVzIiwiZnJvbSIsInNpdGVOYW1lIiwiTWV0ZW9yIiwiYWJzb2x1dGVVcmwiLCJyZXBsYWNlIiwicmVzZXRQYXNzd29yZCIsInN1YmplY3QiLCJ0ZXh0IiwidmVyaWZ5RW1haWwiLCJlbnJvbGxBY2NvdW50IiwiX19yZWlmeV9hc3luY19yZXN1bHRfXyIsIl9yZWlmeUVycm9yIiwic2VsZiIsImFzeW5jIiwiYXJnb24yIiwiYmNyeXB0SGFzaCIsImJjcnlwdENvbXBhcmUiLCJoYXNoIiwiY29tcGFyZSIsImdldFVzZXJCeUlkIiwiaWQiLCJvcHRpb25zIiwidXNlcnMiLCJmaW5kT25lQXN5bmMiLCJfYWRkRGVmYXVsdEZpZWxkU2VsZWN0b3IiLCJfYmNyeXB0Um91bmRzIiwiX29wdGlvbnMiLCJiY3J5cHRSb3VuZHMiLCJfYXJnb24yRW5hYmxlZCIsImFyZ29uMkVuYWJsZWQiLCJBUkdPTjJfVFlQRVMiLCJhcmdvbjJpIiwiYXJnb24yZCIsImFyZ29uMmlkIiwiX2FyZ29uMlR5cGUiLCJhcmdvbjJUeXBlIiwiX2FyZ29uMlRpbWVDb3N0IiwiYXJnb24yVGltZUNvc3QiLCJfYXJnb24yTWVtb3J5Q29zdCIsImFyZ29uMk1lbW9yeUNvc3QiLCJfYXJnb24yUGFyYWxsZWxpc20iLCJhcmdvbjJQYXJhbGxlbGlzbSIsImdldFBhc3N3b3JkU3RyaW5nIiwicGFzc3dvcmQiLCJTSEEyNTYiLCJhbGdvcml0aG0iLCJFcnJvciIsImRpZ2VzdCIsImhhc2hQYXNzd29yZCIsInR5cGUiLCJ0aW1lQ29zdCIsIm1lbW9yeUNvc3QiLCJwYXJhbGxlbGlzbSIsImdldFJvdW5kc0Zyb21CY3J5cHRIYXNoIiwicm91bmRzIiwiaGFzaFNlZ21lbnRzIiwic3BsaXQiLCJsZW5ndGgiLCJwYXJzZUludCIsIl9nZXRSb3VuZHNGcm9tQmNyeXB0SGFzaCIsImdldEFyZ29uMlBhcmFtcyIsInJlZ2V4IiwibWF0Y2giLCJfZ2V0QXJnb24yUGFyYW1zIiwiZ2V0VXNlclBhc3N3b3JkSGFzaCIsIl91c2VyJHNlcnZpY2VzIiwiX3VzZXIkc2VydmljZXMkcGFzc3dvIiwiX3VzZXIkc2VydmljZXMyIiwiX3VzZXIkc2VydmljZXMyJHBhc3N3Iiwic2VydmljZXMiLCJiY3J5cHQiLCJfY2hlY2tQYXNzd29yZFVzZXJGaWVsZHMiLCJfaWQiLCJpc0JjcnlwdCIsInN0YXJ0c1dpdGgiLCJpc0FyZ29uIiwidXBkYXRlVXNlclBhc3N3b3JkRGVmZXJlZCIsImZvcm1hdHRlZFBhc3N3b3JkIiwiZGVmZXIiLCJ1cGRhdGVVc2VyUGFzc3dvcmQiLCJnZXRVcGRhdG9yRm9yVXNlclBhc3N3b3JkIiwiZW5jcnlwdGVkUGFzc3dvcmQiLCIkc2V0IiwiJHVuc2V0IiwidXBkYXRvciIsInVwZGF0ZUFzeW5jIiwiY2hlY2tQYXNzd29yZEFzeW5jIiwicmVzdWx0IiwidXNlcklkIiwiY29uc29sZSIsIndhcm4iLCJ2ZXJpZnkiLCJlcnJvciIsIl9oYW5kbGVFcnJvciIsImhhc2hSb3VuZHMiLCJwYXJhbXNDaGFuZ2VkIiwiYXJnb24yUGFyYW1zIiwiX2NoZWNrUGFzc3dvcmRBc3luYyIsImZpbmRVc2VyQnlVc2VybmFtZSIsInVzZXJuYW1lIiwiX2ZpbmRVc2VyQnlRdWVyeSIsImZpbmRVc2VyQnlFbWFpbCIsImVtYWlsIiwiTm9uRW1wdHlTdHJpbmciLCJNYXRjaCIsIldoZXJlIiwieCIsImNoZWNrIiwiU3RyaW5nIiwicGFzc3dvcmRWYWxpZGF0b3IiLCJPbmVPZiIsInN0ciIsIl9NZXRlb3Ikc2V0dGluZ3MiLCJfTWV0ZW9yJHNldHRpbmdzJHBhY2siLCJfTWV0ZW9yJHNldHRpbmdzJHBhY2syIiwidGVzdCIsInNldHRpbmdzIiwicGFja2FnZXMiLCJhY2NvdW50cyIsInBhc3N3b3JkTWF4TGVuZ3RoIiwicmVnaXN0ZXJMb2dpbkhhbmRsZXIiLCJfQWNjb3VudHMkX2NoZWNrMmZhRW4iLCJfQWNjb3VudHMiLCJ1bmRlZmluZWQiLCJfdXNlclF1ZXJ5VmFsaWRhdG9yIiwiY29kZSIsIk9wdGlvbmFsIiwiZmllbGRzIiwiX2NoZWNrMmZhRW5hYmxlZCIsImNhbGwiLCJfaXNUb2tlblZhbGlkIiwidHdvRmFjdG9yQXV0aGVudGljYXRpb24iLCJzZWNyZXQiLCJzZXRVc2VybmFtZSIsIm5ld1VzZXJuYW1lIiwib2xkVXNlcm5hbWUiLCJfY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzIiwiZXgiLCJtZXRob2RzIiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiY3VycmVudFRva2VuIiwiX2dldExvZ2luVG9rZW4iLCJjb25uZWN0aW9uIiwiJHB1bGwiLCJoYXNoZWRUb2tlbiIsIiRuZSIsInBhc3N3b3JkQ2hhbmdlZCIsInNldFBhc3N3b3JkQXN5bmMiLCJuZXdQbGFpbnRleHRQYXNzd29yZCIsIl9NZXRlb3Ikc2V0dGluZ3MyIiwiX01ldGVvciRzZXR0aW5nczIkcGFjIiwiX01ldGVvciRzZXR0aW5nczIkcGFjMiIsIk1heWJlIiwibG9nb3V0IiwiQm9vbGVhbiIsInBsdWNrQWRkcmVzc2VzIiwiZW1haWxzIiwiYXJndW1lbnRzIiwibWFwIiwiYWRkcmVzcyIsImZvcmdvdFBhc3N3b3JkIiwiY2FzZVNlbnNpdGl2ZUVtYWlsIiwiZmluZCIsInRvTG93ZXJDYXNlIiwic2VuZFJlc2V0UGFzc3dvcmRFbWFpbCIsImdlbmVyYXRlUmVzZXRUb2tlbiIsInJlYXNvbiIsImV4dHJhVG9rZW5EYXRhIiwiaW5jbHVkZXMiLCJ0b2tlbiIsIlJhbmRvbSIsInRva2VuUmVjb3JkIiwid2hlbiIsIkRhdGUiLCJPYmplY3QiLCJhc3NpZ24iLCJfZW5zdXJlIiwiZW5yb2xsIiwicmVzZXQiLCJnZW5lcmF0ZVZlcmlmaWNhdGlvblRva2VuIiwiZW1haWxSZWNvcmQiLCJlIiwidmVyaWZpZWQiLCIkcHVzaCIsInZlcmlmaWNhdGlvblRva2VucyIsInB1c2giLCJleHRyYVBhcmFtcyIsInJlYWxFbWFpbCIsInVybHMiLCJnZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbCIsIkVtYWlsIiwic2VuZEFzeW5jIiwiaXNEZXZlbG9wbWVudCIsImlzUGFja2FnZVRlc3QiLCJsb2ciLCJzZW5kRW5yb2xsbWVudEVtYWlsIiwiX2xlbiIsImFyZ3MiLCJBcnJheSIsIl9rZXkiLCJfbG9naW5NZXRob2QiLCJfQWNjb3VudHMkX2NoZWNrMmZhRW4yIiwiX0FjY291bnRzMiIsImlzRW5yb2xsIiwidG9rZW5MaWZldGltZU1zIiwiX2dldFBhc3N3b3JkUmVzZXRUb2tlbkxpZmV0aW1lTXMiLCJfZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMiLCJjdXJyZW50VGltZU1zIiwibm93Iiwib2xkVG9rZW4iLCJfc2V0TG9naW5Ub2tlbiIsInJlc2V0VG9PbGRUb2tlbiIsImFmZmVjdGVkUmVjb3JkcyIsImVyciIsIl9jbGVhckFsbExvZ2luVG9rZW5zIiwic2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwiX2xlbjIiLCJfa2V5MiIsIl9BY2NvdW50cyRfY2hlY2syZmFFbjMiLCJfQWNjb3VudHMzIiwidCIsImVtYWlsc1JlY29yZCIsImFkZEVtYWlsQXN5bmMiLCJuZXdFbWFpbCIsImNhc2VJbnNlbnNpdGl2ZVJlZ0V4cCIsIlJlZ0V4cCIsIl9lc2NhcGVSZWdFeHAiLCJ1cGRhdGVkRW1haWwiLCJ1cGRhdGVkIiwiZGlkVXBkYXRlT3duRW1haWwiLCIkYWRkVG9TZXQiLCJyZW1vdmVFbWFpbCIsImNyZWF0ZVVzZXIiLCJPYmplY3RJbmNsdWRpbmciLCJoYXNoZWQiLCJfY3JlYXRlVXNlckNoZWNraW5nRHVwbGljYXRlcyIsIl9sZW4zIiwiX2tleTMiLCJmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24iLCJjcmVhdGVVc2VyVmVyaWZ5aW5nRW1haWwiLCJjcmVhdGVVc2VyQXN5bmMiLCJjcmVhdGVJbmRleEFzeW5jIiwidW5pcXVlIiwic3BhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFBQSxJQUFJQSxhQUFhO0lBQUNDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLHNDQUFzQyxFQUFDO01BQUNDLE9BQU9BLENBQUNDLENBQUMsRUFBQztRQUFDSixhQUFhLEdBQUNJLENBQUM7TUFBQTtJQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFBQyxJQUFJQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNQSxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUFsSyxNQUFNQyxLQUFLLEdBQUdDLFVBQVUsSUFBSSxDQUFDQyxJQUFJLEVBQUVDLEdBQUcsS0FBSztNQUN6QyxNQUFNQyxRQUFRLEdBQ1pGLElBQUksQ0FBQ0csT0FBTyxJQUFJSCxJQUFJLENBQUNHLE9BQU8sQ0FBQ0MsSUFBSSxZQUFBQyxNQUFBLENBQ3BCTCxJQUFJLENBQUNHLE9BQU8sQ0FBQ0MsSUFBSSxTQUMxQixRQUFRO01BQ2QsVUFBQUMsTUFBQSxDQUFVSCxRQUFRLFVBQUFHLE1BQUEsQ0FFbEJOLFVBQVUsd0NBQUFNLE1BQUEsQ0FFVkosR0FBRztJQUlMLENBQUM7O0lBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNBSyxRQUFRLENBQUNDLGNBQWMsR0FBQWYsYUFBQSxDQUFBQSxhQUFBLEtBQ2pCYyxRQUFRLENBQUNDLGNBQWMsSUFBSSxDQUFDLENBQUM7TUFDakNDLElBQUksRUFBRSx5Q0FBeUM7TUFDL0NDLFFBQVEsRUFBRUMsTUFBTSxDQUFDQyxXQUFXLENB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QU0sQ0FBQ29CLEtBQUssQ0FBQzZOLGdCQUFnQixDQUFDLCtCQUErQixFQUNqRTtNQUFFQyxNQUFNLEVBQUUsSUFBSTtNQUFFQyxNQUFNLEVBQUU7SUFBSyxDQUFDLENBQUM7SUFDakMsTUFBTW5QLE1BQU0sQ0FBQ29CLEtBQUssQ0FBQzZOLGdCQUFnQixDQUFDLGdDQUFnQyxFQUNsRTtNQUFFQyxNQUFNLEVBQUUsSUFBSTtNQUFFQyxNQUFNLEVBQUU7SUFBSyxDQUFDLENBQUM7SUFBQzNPLHNCQUFBO0VBQUEsU0FBQUMsV0FBQTtJQUFBLE9BQUFELHNCQUFBLENBQUFDLFdBQUE7RUFBQTtFQUFBRCxzQkFBQTtBQUFBO0VBQUFFLElBQUE7RUFBQUMsS0FBQTtBQUFBLEciLCJmaWxlIjoiL3BhY2thZ2VzL2FjY291bnRzLXBhc3N3b3JkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZ3JlZXQgPSB3ZWxjb21lTXNnID0+ICh1c2VyLCB1cmwpID0+IHtcbiAgY29uc3QgZ3JlZXRpbmcgPVxuICAgIHVzZXIucHJvZmlsZSAmJiB1c2VyLnByb2ZpbGUubmFtZVxuICAgICAgPyBgSGVsbG8gJHt1c2VyLnByb2ZpbGUubmFtZX0sYFxuICAgICAgOiAnSGVsbG8sJztcbiAgcmV0dXJuIGAke2dyZWV0aW5nfVxuXG4ke3dlbGNvbWVNc2d9LCBzaW1wbHkgY2xpY2sgdGhlIGxpbmsgYmVsb3cuXG5cbiR7dXJsfVxuXG5UaGFuayB5b3UuXG5gO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBPcHRpb25zIHRvIGN1c3RvbWl6ZSBlbWFpbHMgc2VudCBmcm9tIHRoZSBBY2NvdW50cyBzeXN0ZW0uXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5lbWFpbFRlbXBsYXRlcyA9IHtcbiAgLi4uKEFjY291bnRzLmVtYWlsVGVtcGxhdGVzIHx8IHt9KSxcbiAgZnJvbTogJ0FjY291bnRzIEV4YW1wbGUgPG5vLXJlcGx5QGV4YW1wbGUuY29tPicsXG4gIHNpdGVOYW1lOiBNZXRlb3IuYWJzb2x1dGVVcmwoKVxuICAgIC5yZXBsYWNlKC9eaHR0cHM/OlxcL1xcLy8sICcnKVxuICAgIC5yZXBsYWNlKC9cXC8kLywgJycpLFxuXG4gIHJlc2V0UGFzc3dvcmQ6IHtcbiAgICBzdWJqZWN0OiAoKSA9PlxuICAgICAgYEhvdyB0byByZXNldCB5b3VyIHBhc3N3b3JkIG9uICR7QWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuc2l0ZU5hbWV9YCxcbiAgICB0ZXh0OiBncmVldCgnVG8gcmVzZXQgeW91ciBwYXNzd29yZCcpLFxuICB9LFxuICB2ZXJpZnlFbWFpbDoge1xuICAgIHN1YmplY3Q6ICgpID0+XG4gICAgICBgSG93IHRvIHZlcmlmeSBlbWFpbCBhZGRyZXNzIG9uICR7QWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuc2l0ZU5hbWV9YCxcbiAgICB0ZXh0OiBncmVldCgnVG8gdmVyaWZ5IHlvdXIgYWNjb3VudCBlbWFpbCcpLFxuICB9LFxuICBlbnJvbGxBY2NvdW50OiB7XG4gICAgc3ViamVjdDogKCkgPT5cbiAgICAgIGBBbiBhY2NvdW50IGhhcyBiZWVuIGNyZWF0ZWQgZm9yIHlvdSBvbiAke0FjY291bnRzLmVtYWlsVGVtcGxhdGVzLnNpdGVOYW1lfWAsXG4gICAgdGV4dDogZ3JlZXQoJ1RvIHN0YXJ0IHVzaW5nIHRoZSBzZXJ2aWNlJyksXG4gIH0sXG59O1xuIiwiaW1wb3J0IGFyZ29uMiBmcm9tIFwiYXJnb24yXCI7XG5pbXBvcnQgeyBoYXNoIGFzIGJjcnlwdEhhc2gsIGNvbXBhcmUgYXMgYmNyeXB0Q29tcGFyZSB9IGZyb20gXCJiY3J5cHRcIjtcbmltcG9ydCB7IEFjY291bnRzIH0gZnJvbSBcIm1ldGVvci9hY2NvdW50cy1iYXNlXCI7XG5cbi8vIFV0aWxpdHkgZm9yIGdyYWJiaW5nIHVzZXJcbmNvbnN0IGdldFVzZXJCeUlkID1cbiAgYXN5bmMgKGlkLCBvcHRpb25zKSA9PlxuICAgIGF3YWl0IE1ldGVvci51c2Vycy5maW5kT25lQXN5bmMoaWQsIEFjY291bnRzLl9hZGREZWZhdWx0RmllbGRTZWxlY3RvcihvcHRpb25zKSk7XG5cbi8vIFVzZXIgcmVjb3JkcyBoYXZlIHR3byBmaWVsZHMgdGhhdCBhcmUgdXNlZCBmb3IgcGFzc3dvcmQtYmFzZWQgbG9naW46XG4vLyAtICdzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnLCB3aGljaCBzdG9yZXMgdGhlIGJjcnlwdCBwYXNzd29yZCwgd2hpY2ggd2lsbCBiZSBkZXByZWNhdGVkXG4vLyAtICdzZXJ2aWNlcy5wYXNzd29yZC5hcmdvbjInLCB3aGljaCBzdG9yZXMgdGhlIGFyZ29uMiBwYXNzd29yZFxuLy9cbi8vIFdoZW4gdGhlIGNsaWVudCBzZW5kcyBhIHBhc3N3b3JkIHRvIHRoZSBzZXJ2ZXIsIGl0IGNhbiBlaXRoZXIgYmUgYVxuLy8gc3RyaW5nICh0aGUgcGxhaW50ZXh0IHBhc3N3b3JkKSBvciBhbiBvYmplY3Qgd2l0aCBrZXlzICdkaWdlc3QnIGFuZFxuLy8gJ2FsZ29yaXRobScgKG11c3QgYmUgXCJzaGEtMjU2XCIgZm9yIG5vdykuIFRoZSBNZXRlb3IgY2xpZW50IGFsd2F5cyBzZW5kc1xuLy8gcGFzc3dvcmQgb2JqZWN0cyB7IGRpZ2VzdDogKiwgYWxnb3JpdGhtOiBcInNoYS0yNTZcIiB9LCBidXQgRERQIGNsaWVudHNcbi8vIHRoYXQgZG9uJ3QgaGF2ZSBhY2Nlc3MgdG8gU0hBIGNhbiBqdXN0IHNlbmQgcGxhaW50ZXh0IHBhc3N3b3JkcyBhc1xuLy8gc3RyaW5ncy5cbi8vXG4vLyBXaGVuIHRoZSBzZXJ2ZXIgcmVjZWl2ZXMgYSBwbGFpbnRleHQgcGFzc3dvcmQgYXMgYSBzdHJpbmcsIGl0IGFsd2F5c1xuLy8gaGFzaGVzIGl0IHdpdGggU0hBMjU2IGJlZm9yZSBwYXNzaW5nIGl0IGludG8gYmNyeXB0IC8gYXJnb24yLiBXaGVuIHRoZSBzZXJ2ZXJcbi8vIHJlY2VpdmVzIGEgcGFzc3dvcmQgYXMgYW4gb2JqZWN0LCBpdCBhc3NlcnRzIHRoYXQgdGhlIGFsZ29yaXRobSBpc1xuLy8gXCJzaGEtMjU2XCIgYW5kIHRoZW4gcGFzc2VzIHRoZSBkaWdlc3QgdG8gYmNyeXB0IC8gYXJnb24yLlxuXG5BY2NvdW50cy5fYmNyeXB0Um91bmRzID0gKCkgPT4gQWNjb3VudHMuX29wdGlvbnMuYmNyeXB0Um91bmRzIHx8IDEwO1xuXG5BY2NvdW50cy5fYXJnb24yRW5hYmxlZCA9ICgpID0+IEFjY291bnRzLl9vcHRpb25zLmFyZ29uMkVuYWJsZWQgfHwgZmFsc2U7XG5cbmNvbnN0IEFSR09OMl9UWVBFUyA9IHtcbiAgYXJnb24yaTogYXJnb24yLmFyZ29uMmksXG4gIGFyZ29uMmQ6IGFyZ29uMi5hcmdvbjJkLFxuICBhcmdvbjJpZDogYXJnb24yLmFyZ29uMmlkXG59O1xuXG5BY2NvdW50cy5fYXJnb24yVHlwZSA9ICgpID0+IEFSR09OMl9UWVBFU1tBY2NvdW50cy5fb3B0aW9ucy5hcmdvbjJUeXBlXSB8fCBhcmdvbjIuYXJnb24yaWQ7XG5BY2NvdW50cy5fYXJnb24yVGltZUNvc3QgPSAoKSA9PiBBY2NvdW50cy5fb3B0aW9ucy5hcmdvbjJUaW1lQ29zdCB8fCAyO1xuQWNjb3VudHMuX2FyZ29uMk1lbW9yeUNvc3QgPSAoKSA9PiBBY2NvdW50cy5fb3B0aW9ucy5hcmdvbjJNZW1vcnlDb3N0IHx8IDE5NDU2O1xuQWNjb3VudHMuX2FyZ29uMlBhcmFsbGVsaXNtID0gKCkgPT4gQWNjb3VudHMuX29wdGlvbnMuYXJnb24yUGFyYWxsZWxpc20gfHwgMTtcblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgc3RyaW5nIHRvIGJlIGVuY3J5cHRlZCB1c2luZyBiY3J5cHQgb3IgQXJnb24yIGZyb20gdGhlIGdpdmVuIGBwYXNzd29yZGAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBwYXNzd29yZCAtIFRoZSBwYXNzd29yZCBwcm92aWRlZCBieSB0aGUgY2xpZW50LiBJdCBjYW4gYmU6XG4gKiAgLSBBIHBsYWludGV4dCBzdHJpbmcgcGFzc3dvcmQuXG4gKiAgLSBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKiAgICAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBkaWdlc3QgLSBUaGUgaGFzaGVkIHBhc3N3b3JkLlxuICogICAgICBAcHJvcGVydHkge3N0cmluZ30gYWxnb3JpdGhtIC0gVGhlIGhhc2hpbmcgYWxnb3JpdGhtIHVzZWQuIE11c3QgYmUgXCJzaGEtMjU2XCIuXG4gKlxuICogQHJldHVybnMge3N0cmluZ30gLSBUaGUgcmVzdWx0aW5nIHBhc3N3b3JkIHN0cmluZyB0byBlbmNyeXB0LlxuICpcbiAqIEB0aHJvd3Mge0Vycm9yfSAtIElmIHRoZSBgYWxnb3JpdGhtYCBpbiB0aGUgcGFzc3dvcmQgb2JqZWN0IGlzIG5vdCBcInNoYS0yNTZcIi5cbiAqL1xuY29uc3QgZ2V0UGFzc3dvcmRTdHJpbmcgPSBwYXNzd29yZCA9PiB7XG4gIGlmICh0eXBlb2YgcGFzc3dvcmQgPT09IFwic3RyaW5nXCIpIHtcbiAgICBwYXNzd29yZCA9IFNIQTI1NihwYXNzd29yZCk7XG4gIH1cbiAgZWxzZSB7IC8vICdwYXNzd29yZCcgaXMgYW4gb2JqZWN0XG4gICAgaWYgKHBhc3N3b3JkLmFsZ29yaXRobSAhPT0gXCJzaGEtMjU2XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcGFzc3dvcmQgaGFzaCBhbGdvcml0aG0uIFwiICtcbiAgICAgICAgXCJPbmx5ICdzaGEtMjU2JyBpcyBhbGxvd2VkLlwiKTtcbiAgICB9XG4gICAgcGFzc3dvcmQgPSBwYXNzd29yZC5kaWdlc3Q7XG4gIH1cbiAgcmV0dXJuIHBhc3N3b3JkO1xufTtcblxuLyoqXG4gKiBFbmNyeXB0IHRoZSBnaXZlbiBgcGFzc3dvcmRgIHVzaW5nIGVpdGhlciBiY3J5cHQgb3IgQXJnb24yLlxuICogQHBhcmFtIHBhc3N3b3JkIGNhbiBiZSBhIHN0cmluZyAoaW4gd2hpY2ggY2FzZSBpdCB3aWxsIGJlIHJ1biB0aHJvdWdoIFNIQTI1NiBiZWZvcmUgZW5jcnlwdGlvbikgb3IgYW4gb2JqZWN0IHdpdGggcHJvcGVydGllcyBgZGlnZXN0YCBhbmQgYGFsZ29yaXRobWAgKGluIHdoaWNoIGNhc2Ugd2UgYmNyeXB0IG9yIEFyZ29uMiBgcGFzc3dvcmQuZGlnZXN0YCkuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgZW5jcnlwdGVkIHBhc3N3b3JkLlxuICovXG5jb25zdCBoYXNoUGFzc3dvcmQgPSBhc3luYyAocGFzc3dvcmQpID0+IHtcbiAgcGFzc3dvcmQgPSBnZXRQYXNzd29yZFN0cmluZyhwYXNzd29yZCk7XG4gIGlmIChBY2NvdW50cy5fYXJnb24yRW5hYmxlZCgpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGF3YWl0IGFyZ29uMi5oYXNoKHBhc3N3b3JkLCB7XG4gICAgICB0eXBlOiBBY2NvdW50cy5fYXJnb24yVHlwZSgpLFxuICAgICAgdGltZUNvc3Q6IEFjY291bnRzLl9hcmdvbjJUaW1lQ29zdCgpLFxuICAgICAgbWVtb3J5Q29zdDogQWNjb3VudHMuX2FyZ29uMk1lbW9yeUNvc3QoKSxcbiAgICAgIHBhcmFsbGVsaXNtOiBBY2NvdW50cy5fYXJnb24yUGFyYWxsZWxpc20oKVxuICAgIH0pO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBhd2FpdCBiY3J5cHRIYXNoKHBhc3N3b3JkLCBBY2NvdW50cy5fYmNyeXB0Um91bmRzKCkpO1xuICB9XG59O1xuXG4vLyBFeHRyYWN0IHRoZSBudW1iZXIgb2Ygcm91bmRzIHVzZWQgaW4gdGhlIHNwZWNpZmllZCBiY3J5cHQgaGFzaC5cbmNvbnN0IGdldFJvdW5kc0Zyb21CY3J5cHRIYXNoID0gKGhhc2gpID0+IHtcbiAgbGV0IHJvdW5kcztcbiAgaWYgKGhhc2gpIHtcbiAgICBjb25zdCBoYXNoU2VnbWVudHMgPSBoYXNoLnNwbGl0KFwiJFwiKTtcbiAgICBpZiAoaGFzaFNlZ21lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgIHJvdW5kcyA9IHBhcnNlSW50KGhhc2hTZWdtZW50c1syXSwgMTApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcm91bmRzO1xufTtcbkFjY291bnRzLl9nZXRSb3VuZHNGcm9tQmNyeXB0SGFzaCA9IGdldFJvdW5kc0Zyb21CY3J5cHRIYXNoO1xuXG5cbi8qKlxuICogRXh0cmFjdCByZWFkYWJsZSBwYXJhbWV0ZXJzIGZyb20gYW4gQXJnb24yIGhhc2ggc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggLSBUaGUgQXJnb24yIGhhc2ggc3RyaW5nLlxuICogQHJldHVybnMge29iamVjdH0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcnNlZCBwYXJhbWV0ZXJzLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBoYXNoIGZvcm1hdCBpcyBpbnZhbGlkLlxuICovXG5mdW5jdGlvbiBnZXRBcmdvbjJQYXJhbXMoaGFzaCkge1xuICBjb25zdCByZWdleCA9IC9eXFwkKGFyZ29uMig/Oml8ZHxpZCkpXFwkdj1cXGQrXFwkbT0oXFxkKyksdD0oXFxkKykscD0oXFxkKykvO1xuXG4gIGNvbnN0IG1hdGNoID0gaGFzaC5tYXRjaChyZWdleCk7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgQXJnb24yIGhhc2ggZm9ybWF0LlwiKTtcbiAgfVxuXG4gIGNvbnN0IFssIHR5cGUsIG1lbW9yeUNvc3QsIHRpbWVDb3N0LCBwYXJhbGxlbGlzbV0gPSBtYXRjaDtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IEFSR09OMl9UWVBFU1t0eXBlXSxcbiAgICB0aW1lQ29zdDogcGFyc2VJbnQodGltZUNvc3QsIDEwKSxcbiAgICBtZW1vcnlDb3N0OiBwYXJzZUludChtZW1vcnlDb3N0LCAxMCksXG4gICAgcGFyYWxsZWxpc206IHBhcnNlSW50KHBhcmFsbGVsaXNtLCAxMClcbiAgfTtcbn1cblxuQWNjb3VudHMuX2dldEFyZ29uMlBhcmFtcyA9IGdldEFyZ29uMlBhcmFtcztcblxuY29uc3QgZ2V0VXNlclBhc3N3b3JkSGFzaCA9IHVzZXIgPT4ge1xuICByZXR1cm4gdXNlci5zZXJ2aWNlcz8ucGFzc3dvcmQ/LmFyZ29uMiB8fCB1c2VyLnNlcnZpY2VzPy5wYXNzd29yZD8uYmNyeXB0O1xufTtcblxuQWNjb3VudHMuX2NoZWNrUGFzc3dvcmRVc2VyRmllbGRzID0geyBfaWQ6IDEsIHNlcnZpY2VzOiAxIH07XG5cbmNvbnN0IGlzQmNyeXB0ID0gKGhhc2gpID0+IHtcbiAgLy8gYmNyeXB0IGhhc2hlcyBzdGFydCB3aXRoICQyYSQgb3IgJDJiJFxuICByZXR1cm4gaGFzaC5zdGFydHNXaXRoKFwiJDJcIik7XG59O1xuXG5jb25zdCBpc0FyZ29uID0gKGhhc2gpID0+IHtcbiAgICAvLyBhcmdvbjIgaGFzaGVzIHN0YXJ0IHdpdGggJGFyZ29uMmkkLCAkYXJnb24yZCQgb3IgJGFyZ29uMmlkJFxuICAgIHJldHVybiBoYXNoLnN0YXJ0c1dpdGgoXCIkYXJnb24yXCIpO1xufVxuXG5jb25zdCB1cGRhdGVVc2VyUGFzc3dvcmREZWZlcmVkID0gKHVzZXIsIGZvcm1hdHRlZFBhc3N3b3JkKSA9PiB7XG4gIE1ldGVvci5kZWZlcihhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgdXBkYXRlVXNlclBhc3N3b3JkKHVzZXIsIGZvcm1hdHRlZFBhc3N3b3JkKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIEhhc2hlcyB0aGUgcHJvdmlkZWQgcGFzc3dvcmQgYW5kIHJldHVybnMgYW4gb2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gdXBkYXRlIHRoZSB1c2VyJ3MgcGFzc3dvcmQuXG4gKiBAcGFyYW0gZm9ybWF0dGVkUGFzc3dvcmRcbiAqIEByZXR1cm5zIHtQcm9taXNlPHskc2V0OiB7XCJzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHRcIjogc3RyaW5nfX18eyR1bnNldDoge1wic2VydmljZXMucGFzc3dvcmQuYmNyeXB0XCI6IG51bWJlcn0sICRzZXQ6IHtcInNlcnZpY2VzLnBhc3N3b3JkLmFyZ29uMlwiOiBzdHJpbmd9fT59XG4gKi9cbmNvbnN0IGdldFVwZGF0b3JGb3JVc2VyUGFzc3dvcmQgPSBhc3luYyAoZm9ybWF0dGVkUGFzc3dvcmQpID0+IHtcbiAgY29uc3QgZW5jcnlwdGVkUGFzc3dvcmQgPSBhd2FpdCBoYXNoUGFzc3dvcmQoZm9ybWF0dGVkUGFzc3dvcmQpO1xuICBpZiAoQWNjb3VudHMuX2FyZ29uMkVuYWJsZWQoKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJHNldDoge1xuICAgICAgICBcInNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdFwiOiBlbmNyeXB0ZWRQYXNzd29yZFxuICAgICAgfSxcbiAgICAgICR1bnNldDoge1xuICAgICAgICBcInNlcnZpY2VzLnBhc3N3b3JkLmFyZ29uMlwiOiAxXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBlbHNlIGlmIChBY2NvdW50cy5fYXJnb24yRW5hYmxlZCgpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5hcmdvbjJcIjogZW5jcnlwdGVkUGFzc3dvcmRcbiAgICAgIH0sXG4gICAgICAkdW5zZXQ6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHRcIjogMVxuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbmNvbnN0IHVwZGF0ZVVzZXJQYXNzd29yZCA9IGFzeW5jICh1c2VyLCBmb3JtYXR0ZWRQYXNzd29yZCkgPT4ge1xuICBjb25zdCB1cGRhdG9yID0gYXdhaXQgZ2V0VXBkYXRvckZvclVzZXJQYXNzd29yZChmb3JtYXR0ZWRQYXNzd29yZCk7XG4gIGF3YWl0IE1ldGVvci51c2Vycy51cGRhdGVBc3luYyh7IF9pZDogdXNlci5faWQgfSwgdXBkYXRvcik7XG59O1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBwYXNzd29yZCBtYXRjaGVzIHRoZSBoYXNoZWQgcGFzc3dvcmQgc3RvcmVkIGluIHRoZSB1c2VyJ3MgZGF0YWJhc2UgcmVjb3JkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB1c2VyIC0gVGhlIHVzZXIgb2JqZWN0IGNvbnRhaW5pbmcgYXQgbGVhc3Q6XG4gKiAgIEBwcm9wZXJ0eSB7c3RyaW5nfSBfaWQgLSBUaGUgdXNlcidzIHVuaXF1ZSBpZGVudGlmaWVyLlxuICogICBAcHJvcGVydHkge09iamVjdH0gc2VydmljZXMgLSBUaGUgdXNlcidzIHNlcnZpY2VzIGRhdGEuXG4gKiAgIEBwcm9wZXJ0eSB7T2JqZWN0fSBzZXJ2aWNlcy5wYXNzd29yZCAtIFRoZSB1c2VyJ3MgcGFzc3dvcmQgb2JqZWN0LlxuICogICBAcHJvcGVydHkge3N0cmluZ30gW3NlcnZpY2VzLnBhc3N3b3JkLmFyZ29uMl0gLSBUaGUgQXJnb24yIGhhc2hlZCBwYXNzd29yZC5cbiAqICAgQHByb3BlcnR5IHtzdHJpbmd9IFtzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHRdIC0gVGhlIGJjcnlwdCBoYXNoZWQgcGFzc3dvcmQsIGRlcHJlY2F0ZWRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9IHBhc3N3b3JkIC0gVGhlIHBhc3N3b3JkIHByb3ZpZGVkIGJ5IHRoZSBjbGllbnQuIEl0IGNhbiBiZTpcbiAqICAgLSBBIHBsYWludGV4dCBzdHJpbmcgcGFzc3dvcmQuXG4gKiAgIC0gQW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICogICAgICAgQHByb3BlcnR5IHtzdHJpbmd9IGRpZ2VzdCAtIFRoZSBoYXNoZWQgcGFzc3dvcmQuXG4gKiAgICAgICBAcHJvcGVydHkge3N0cmluZ30gYWxnb3JpdGhtIC0gVGhlIGhhc2hpbmcgYWxnb3JpdGhtIHVzZWQuIE11c3QgYmUgXCJzaGEtMjU2XCIuXG4gKlxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0Pn0gLSBBIHJlc3VsdCBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKiAgIEBwcm9wZXJ0eSB7c3RyaW5nfSB1c2VySWQgLSBUaGUgdXNlcidzIHVuaXF1ZSBpZGVudGlmaWVyLlxuICogICBAcHJvcGVydHkge09iamVjdH0gW2Vycm9yXSAtIEFuIGVycm9yIG9iamVjdCBpZiB0aGUgcGFzc3dvcmQgZG9lcyBub3QgbWF0Y2ggb3IgYW4gZXJyb3Igb2NjdXJzLlxuICpcbiAqIEB0aHJvd3Mge0Vycm9yfSAtIElmIGFuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJzIGR1cmluZyB0aGUgcHJvY2Vzcy5cbiAqL1xuY29uc3QgY2hlY2tQYXNzd29yZEFzeW5jID0gYXN5bmMgKHVzZXIsIHBhc3N3b3JkKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICB1c2VySWQ6IHVzZXIuX2lkXG4gIH07XG5cbiAgY29uc3QgZm9ybWF0dGVkUGFzc3dvcmQgPSBnZXRQYXNzd29yZFN0cmluZyhwYXNzd29yZCk7XG4gIGNvbnN0IGhhc2ggPSBnZXRVc2VyUGFzc3dvcmRIYXNoKHVzZXIpO1xuXG5cbiAgY29uc3QgYXJnb24yRW5hYmxlZCA9IEFjY291bnRzLl9hcmdvbjJFbmFibGVkKCk7XG4gIGlmIChhcmdvbjJFbmFibGVkID09PSBmYWxzZSkge1xuICAgIGlmIChpc0FyZ29uKGhhc2gpKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgcm9sbGJhY2sgZmVhdHVyZSwgZW5hYmxpbmcgdG8gc3dpdGNoIGJhY2sgZnJvbSBhcmdvbjIgdG8gYmNyeXB0IGlmIG5lZWRlZFxuICAgICAgLy8gVE9ETyA6IGRlcHJlY2F0ZSB0aGlzXG4gICAgICBjb25zb2xlLndhcm4oXCJVc2VyIGhhcyBhbiBhcmdvbjIgcGFzc3dvcmQgYW5kIGFyZ29uMiBpcyBub3QgZW5hYmxlZCwgcm9sbGluZyBiYWNrIHRvIGJjcnlwdCBlbmNyeXB0aW9uXCIpO1xuICAgICAgY29uc3QgbWF0Y2ggPSBhd2FpdCBhcmdvbjIudmVyaWZ5KGhhc2gsIGZvcm1hdHRlZFBhc3N3b3JkKTtcbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LmVycm9yID0gQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiSW5jb3JyZWN0IHBhc3N3b3JkXCIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIC8vIFRoZSBwYXNzd29yZCBjaGVja3Mgb3V0LCBidXQgdGhlIHVzZXIncyBzdG9yZWQgcGFzc3dvcmQgbmVlZHMgdG8gYmUgdXBkYXRlZCB0byBhcmdvbjJcbiAgICAgICAgdXBkYXRlVXNlclBhc3N3b3JkRGVmZXJlZCh1c2VyLCB7IGRpZ2VzdDogZm9ybWF0dGVkUGFzc3dvcmQsIGFsZ29yaXRobTogXCJzaGEtMjU2XCIgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgaGFzaFJvdW5kcyA9IGdldFJvdW5kc0Zyb21CY3J5cHRIYXNoKGhhc2gpO1xuICAgICAgY29uc3QgbWF0Y2ggPSBhd2FpdCBiY3J5cHRDb21wYXJlKGZvcm1hdHRlZFBhc3N3b3JkLCBoYXNoKTtcbiAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LmVycm9yID0gQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiSW5jb3JyZWN0IHBhc3N3b3JkXCIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGhhc2gpIHtcbiAgICAgICAgY29uc3QgcGFyYW1zQ2hhbmdlZCA9IGhhc2hSb3VuZHMgIT09IEFjY291bnRzLl9iY3J5cHRSb3VuZHMoKTtcbiAgICAgICAgLy8gVGhlIHBhc3N3b3JkIGNoZWNrcyBvdXQsIGJ1dCB0aGUgdXNlcidzIGJjcnlwdCBoYXNoIG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAgICAgICAgLy8gdG8gbWF0Y2ggY3VycmVudCBiY3J5cHQgc2V0dGluZ3NcbiAgICAgICAgaWYgKHBhcmFtc0NoYW5nZWQgPT09IHRydWUpIHtcbiAgICAgICAgICB1cGRhdGVVc2VyUGFzc3dvcmREZWZlcmVkKHVzZXIsIHsgZGlnZXN0OiBmb3JtYXR0ZWRQYXNzd29yZCwgYWxnb3JpdGhtOiBcInNoYS0yNTZcIiB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmIChhcmdvbjJFbmFibGVkID09PSB0cnVlKSB7XG4gICAgaWYgKGlzQmNyeXB0KGhhc2gpKSB7XG4gICAgICAvLyBtaWdyYXRpb24gY29kZSBmcm9tIGJjcnlwdCB0byBhcmdvbjJcbiAgICAgIGNvbnN0IG1hdGNoID0gYXdhaXQgYmNyeXB0Q29tcGFyZShmb3JtYXR0ZWRQYXNzd29yZCwgaGFzaCk7XG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5lcnJvciA9IEFjY291bnRzLl9oYW5kbGVFcnJvcihcIkluY29ycmVjdCBwYXNzd29yZFwiLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gVGhlIHBhc3N3b3JkIGNoZWNrcyBvdXQsIGJ1dCB0aGUgdXNlcidzIHN0b3JlZCBwYXNzd29yZCBuZWVkcyB0byBiZSB1cGRhdGVkIHRvIGFyZ29uMlxuICAgICAgICB1cGRhdGVVc2VyUGFzc3dvcmREZWZlcmVkKHVzZXIsIHsgZGlnZXN0OiBmb3JtYXR0ZWRQYXNzd29yZCwgYWxnb3JpdGhtOiBcInNoYS0yNTZcIiB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBhcmdvbjIgcGFzc3dvcmRcbiAgICAgIGNvbnN0IGFyZ29uMlBhcmFtcyA9IGdldEFyZ29uMlBhcmFtcyhoYXNoKTtcbiAgICAgIGNvbnN0IG1hdGNoID0gYXdhaXQgYXJnb24yLnZlcmlmeShoYXNoLCBmb3JtYXR0ZWRQYXNzd29yZCk7XG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5lcnJvciA9IEFjY291bnRzLl9oYW5kbGVFcnJvcihcIkluY29ycmVjdCBwYXNzd29yZFwiLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChoYXNoKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtc0NoYW5nZWQgPSBhcmdvbjJQYXJhbXMubWVtb3J5Q29zdCAhPT0gQWNjb3VudHMuX2FyZ29uMk1lbW9yeUNvc3QoKSB8fFxuICAgICAgICAgIGFyZ29uMlBhcmFtcy50aW1lQ29zdCAhPT0gQWNjb3VudHMuX2FyZ29uMlRpbWVDb3N0KCkgfHxcbiAgICAgICAgICBhcmdvbjJQYXJhbXMucGFyYWxsZWxpc20gIT09IEFjY291bnRzLl9hcmdvbjJQYXJhbGxlbGlzbSgpIHx8XG4gICAgICAgICAgYXJnb24yUGFyYW1zLnR5cGUgIT09IEFjY291bnRzLl9hcmdvbjJUeXBlKCk7XG4gICAgICAgIGlmIChwYXJhbXNDaGFuZ2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgLy8gVGhlIHBhc3N3b3JkIGNoZWNrcyBvdXQsIGJ1dCB0aGUgdXNlcidzIGFyZ29uMiBoYXNoIG5lZWRzIHRvIGJlIHVwZGF0ZWQgd2l0aCB0aGUgcmlnaHQgcGFyYW1zXG4gICAgICAgICAgdXBkYXRlVXNlclBhc3N3b3JkRGVmZXJlZCh1c2VyLCB7IGRpZ2VzdDogZm9ybWF0dGVkUGFzc3dvcmQsIGFsZ29yaXRobTogXCJzaGEtMjU2XCIgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5BY2NvdW50cy5fY2hlY2tQYXNzd29yZEFzeW5jID0gY2hlY2tQYXNzd29yZEFzeW5jO1xuXG4vLy9cbi8vLyBMT0dJTlxuLy8vXG5cblxuLyoqXG4gKiBAc3VtbWFyeSBGaW5kcyB0aGUgdXNlciBhc3luY2hyb25vdXNseSB3aXRoIHRoZSBzcGVjaWZpZWQgdXNlcm5hbWUuXG4gKiBGaXJzdCB0cmllcyB0byBtYXRjaCB1c2VybmFtZSBjYXNlIHNlbnNpdGl2ZWx5OyBpZiB0aGF0IGZhaWxzLCBpdFxuICogdHJpZXMgY2FzZSBpbnNlbnNpdGl2ZWx5OyBidXQgaWYgbW9yZSB0aGFuIG9uZSB1c2VyIG1hdGNoZXMgdGhlIGNhc2VcbiAqIGluc2Vuc2l0aXZlIHNlYXJjaCwgaXQgcmV0dXJucyBudWxsLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJuYW1lIFRoZSB1c2VybmFtZSB0byBsb29rIGZvclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtNb25nb0ZpZWxkU3BlY2lmaWVyfSBvcHRpb25zLmZpZWxkcyBEaWN0aW9uYXJ5IG9mIGZpZWxkcyB0byByZXR1cm4gb3IgZXhjbHVkZS5cbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59IEEgdXNlciBpZiBmb3VuZCwgZWxzZSBudWxsXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5maW5kVXNlckJ5VXNlcm5hbWUgPVxuICBhc3luYyAodXNlcm5hbWUsIG9wdGlvbnMpID0+XG4gICAgYXdhaXQgQWNjb3VudHMuX2ZpbmRVc2VyQnlRdWVyeSh7IHVzZXJuYW1lIH0sIG9wdGlvbnMpO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmRzIHRoZSB1c2VyIGFzeW5jaHJvbm91c2x5IHdpdGggdGhlIHNwZWNpZmllZCBlbWFpbC5cbiAqIEZpcnN0IHRyaWVzIHRvIG1hdGNoIGVtYWlsIGNhc2Ugc2Vuc2l0aXZlbHk7IGlmIHRoYXQgZmFpbHMsIGl0XG4gKiB0cmllcyBjYXNlIGluc2Vuc2l0aXZlbHk7IGJ1dCBpZiBtb3JlIHRoYW4gb25lIHVzZXIgbWF0Y2hlcyB0aGUgY2FzZVxuICogaW5zZW5zaXRpdmUgc2VhcmNoLCBpdCByZXR1cm5zIG51bGwuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgVGhlIGVtYWlsIGFkZHJlc3MgdG8gbG9vayBmb3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7TW9uZ29GaWVsZFNwZWNpZmllcn0gb3B0aW9ucy5maWVsZHMgRGljdGlvbmFyeSBvZiBmaWVsZHMgdG8gcmV0dXJuIG9yIGV4Y2x1ZGUuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fSBBIHVzZXIgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuZmluZFVzZXJCeUVtYWlsID1cbiAgYXN5bmMgKGVtYWlsLCBvcHRpb25zKSA9PlxuICAgIGF3YWl0IEFjY291bnRzLl9maW5kVXNlckJ5UXVlcnkoeyBlbWFpbCB9LCBvcHRpb25zKTtcblxuLy8gWFhYIG1heWJlIHRoaXMgYmVsb25ncyBpbiB0aGUgY2hlY2sgcGFja2FnZVxuY29uc3QgTm9uRW1wdHlTdHJpbmcgPSBNYXRjaC5XaGVyZSh4ID0+IHtcbiAgY2hlY2soeCwgU3RyaW5nKTtcbiAgcmV0dXJuIHgubGVuZ3RoID4gMDtcbn0pO1xuXG5jb25zdCBwYXNzd29yZFZhbGlkYXRvciA9IE1hdGNoLk9uZU9mKFxuICBNYXRjaC5XaGVyZShzdHIgPT4gTWF0Y2gudGVzdChzdHIsIFN0cmluZykgJiYgc3RyLmxlbmd0aCA8PSBNZXRlb3Iuc2V0dGluZ3M/LnBhY2thZ2VzPy5hY2NvdW50cz8ucGFzc3dvcmRNYXhMZW5ndGggfHwgMjU2KSwge1xuICAgIGRpZ2VzdDogTWF0Y2guV2hlcmUoc3RyID0+IE1hdGNoLnRlc3Qoc3RyLCBTdHJpbmcpICYmIHN0ci5sZW5ndGggPT09IDY0KSxcbiAgICBhbGdvcml0aG06IE1hdGNoLk9uZU9mKCdzaGEtMjU2JylcbiAgfVxuKTtcblxuLy8gSGFuZGxlciB0byBsb2dpbiB3aXRoIGEgcGFzc3dvcmQuXG4vL1xuLy8gVGhlIE1ldGVvciBjbGllbnQgc2V0cyBvcHRpb25zLnBhc3N3b3JkIHRvIGFuIG9iamVjdCB3aXRoIGtleXNcbi8vICdkaWdlc3QnIChzZXQgdG8gU0hBMjU2KHBhc3N3b3JkKSkgYW5kICdhbGdvcml0aG0nIChcInNoYS0yNTZcIikuXG4vL1xuLy8gRm9yIG90aGVyIEREUCBjbGllbnRzIHdoaWNoIGRvbid0IGhhdmUgYWNjZXNzIHRvIFNIQSwgdGhlIGhhbmRsZXJcbi8vIGFsc28gYWNjZXB0cyB0aGUgcGxhaW50ZXh0IHBhc3N3b3JkIGluIG9wdGlvbnMucGFzc3dvcmQgYXMgYSBzdHJpbmcuXG4vL1xuLy8gKEl0IG1pZ2h0IGJlIG5pY2UgaWYgc2VydmVycyBjb3VsZCB0dXJuIHRoZSBwbGFpbnRleHQgcGFzc3dvcmRcbi8vIG9wdGlvbiBvZmYuIE9yIG1heWJlIGl0IHNob3VsZCBiZSBvcHQtaW4sIG5vdCBvcHQtb3V0P1xuLy8gQWNjb3VudHMuY29uZmlnIG9wdGlvbj8pXG4vL1xuLy8gTm90ZSB0aGF0IG5laXRoZXIgcGFzc3dvcmQgb3B0aW9uIGlzIHNlY3VyZSB3aXRob3V0IFNTTC5cbi8vXG5BY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcihcInBhc3N3b3JkXCIsIGFzeW5jIG9wdGlvbnMgPT4ge1xuICBpZiAoIW9wdGlvbnMucGFzc3dvcmQpXG4gICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gZG9uJ3QgaGFuZGxlXG5cbiAgY2hlY2sob3B0aW9ucywge1xuICAgIHVzZXI6IEFjY291bnRzLl91c2VyUXVlcnlWYWxpZGF0b3IsXG4gICAgcGFzc3dvcmQ6IHBhc3N3b3JkVmFsaWRhdG9yLFxuICAgIGNvZGU6IE1hdGNoLk9wdGlvbmFsKE5vbkVtcHR5U3RyaW5nKSxcbiAgfSk7XG5cblxuICBjb25zdCB1c2VyID0gYXdhaXQgQWNjb3VudHMuX2ZpbmRVc2VyQnlRdWVyeShvcHRpb25zLnVzZXIsIHtmaWVsZHM6IHtcbiAgICBzZXJ2aWNlczogMSxcbiAgICAuLi5BY2NvdW50cy5fY2hlY2tQYXNzd29yZFVzZXJGaWVsZHMsXG4gIH19KTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICBpZiAoIWdldFVzZXJQYXNzd29yZEhhc2godXNlcikpIHtcbiAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJVc2VyIGhhcyBubyBwYXNzd29yZCBzZXRcIik7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBjaGVja1Bhc3N3b3JkQXN5bmModXNlciwgb3B0aW9ucy5wYXNzd29yZCk7XG4gIC8vIFRoaXMgbWV0aG9kIGlzIGFkZGVkIGJ5IHRoZSBwYWNrYWdlIGFjY291bnRzLTJmYVxuICAvLyBGaXJzdCB0aGUgbG9naW4gaXMgdmFsaWRhdGVkLCB0aGVuIHRoZSBjb2RlIHNpdHVhdGlvbiBpcyBjaGVja2VkXG4gIGlmIChcbiAgICAhcmVzdWx0LmVycm9yICYmXG4gICAgQWNjb3VudHMuX2NoZWNrMmZhRW5hYmxlZD8uKHVzZXIpXG4gICkge1xuICAgIGlmICghb3B0aW9ucy5jb2RlKSB7XG4gICAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoJzJGQSBjb2RlIG11c3QgYmUgaW5mb3JtZWQnLCB0cnVlLCAnbm8tMmZhLWNvZGUnKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIUFjY291bnRzLl9pc1Rva2VuVmFsaWQoXG4gICAgICAgIHVzZXIuc2VydmljZXMudHdvRmFjdG9yQXV0aGVudGljYXRpb24uc2VjcmV0LFxuICAgICAgICBvcHRpb25zLmNvZGVcbiAgICAgIClcbiAgICApIHtcbiAgICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcignSW52YWxpZCAyRkEgY29kZScsIHRydWUsICdpbnZhbGlkLTJmYS1jb2RlJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn0pO1xuXG4vLy9cbi8vLyBDSEFOR0lOR1xuLy8vXG5cbi8qKlxuICogQHN1bW1hcnkgQ2hhbmdlIGEgdXNlcidzIHVzZXJuYW1lIGFzeW5jaHJvbm91c2x5LiBVc2UgdGhpcyBpbnN0ZWFkIG9mIHVwZGF0aW5nIHRoZVxuICogZGF0YWJhc2UgZGlyZWN0bHkuIFRoZSBvcGVyYXRpb24gd2lsbCBmYWlsIGlmIHRoZXJlIGlzIGFuIGV4aXN0aW5nIHVzZXJcbiAqIHdpdGggYSB1c2VybmFtZSBvbmx5IGRpZmZlcmluZyBpbiBjYXNlLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gdXBkYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IG5ld1VzZXJuYW1lIEEgbmV3IHVzZXJuYW1lIGZvciB0aGUgdXNlci5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNldFVzZXJuYW1lID1cbiAgYXN5bmMgKHVzZXJJZCwgbmV3VXNlcm5hbWUpID0+IHtcbiAgICBjaGVjayh1c2VySWQsIE5vbkVtcHR5U3RyaW5nKTtcbiAgICBjaGVjayhuZXdVc2VybmFtZSwgTm9uRW1wdHlTdHJpbmcpO1xuXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IGdldFVzZXJCeUlkKHVzZXJJZCwge1xuICAgICAgZmllbGRzOiB7XG4gICAgICAgIHVzZXJuYW1lOiAxLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBvbGRVc2VybmFtZSA9IHVzZXIudXNlcm5hbWU7XG5cbiAgICAvLyBQZXJmb3JtIGEgY2FzZSBpbnNlbnNpdGl2ZSBjaGVjayBmb3IgZHVwbGljYXRlcyBiZWZvcmUgdXBkYXRlXG4gICAgYXdhaXQgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLFxuICAgICAgJ1VzZXJuYW1lJywgbmV3VXNlcm5hbWUsIHVzZXIuX2lkKTtcblxuICAgIGF3YWl0IE1ldGVvci51c2Vycy51cGRhdGVBc3luYyh7IF9pZDogdXNlci5faWQgfSwgeyAkc2V0OiB7IHVzZXJuYW1lOiBuZXdVc2VybmFtZSB9IH0pO1xuXG4gICAgLy8gUGVyZm9ybSBhbm90aGVyIGNoZWNrIGFmdGVyIHVwZGF0ZSwgaW4gY2FzZSBhIG1hdGNoaW5nIHVzZXIgaGFzIGJlZW5cbiAgICAvLyBpbnNlcnRlZCBpbiB0aGUgbWVhbnRpbWVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLFxuICAgICAgICAnVXNlcm5hbWUnLCBuZXdVc2VybmFtZSwgdXNlci5faWQpO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAvLyBVbmRvIHVwZGF0ZSBpZiB0aGUgY2hlY2sgZmFpbHNcbiAgICAgIGF3YWl0IE1ldGVvci51c2Vycy51cGRhdGVBc3luYyh7IF9pZDogdXNlci5faWQgfSwgeyAkc2V0OiB7IHVzZXJuYW1lOiBvbGRVc2VybmFtZSB9IH0pO1xuICAgICAgdGhyb3cgZXg7XG4gICAgfVxuICB9O1xuXG4vLyBMZXQgdGhlIHVzZXIgY2hhbmdlIHRoZWlyIG93biBwYXNzd29yZCBpZiB0aGV5IGtub3cgdGhlIG9sZFxuLy8gcGFzc3dvcmQuIGBvbGRQYXNzd29yZGAgYW5kIGBuZXdQYXNzd29yZGAgc2hvdWxkIGJlIG9iamVjdHMgd2l0aCBrZXlzXG4vLyBgZGlnZXN0YCBhbmQgYGFsZ29yaXRobWAgKHJlcHJlc2VudGluZyB0aGUgU0hBMjU2IG9mIHRoZSBwYXNzd29yZCkuXG5NZXRlb3IubWV0aG9kcyhcbiAge1xuICAgIGNoYW5nZVBhc3N3b3JkOiBhc3luYyBmdW5jdGlvbihvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgICAgIGNoZWNrKG9sZFBhc3N3b3JkLCBwYXNzd29yZFZhbGlkYXRvcik7XG4gICAgICBjaGVjayhuZXdQYXNzd29yZCwgcGFzc3dvcmRWYWxpZGF0b3IpO1xuXG4gICAgICBpZiAoIXRoaXMudXNlcklkKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCBcIk11c3QgYmUgbG9nZ2VkIGluXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1c2VyID0gYXdhaXQgZ2V0VXNlckJ5SWQodGhpcy51c2VySWQsIHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgc2VydmljZXM6IDEsXG4gICAgICAgICAgLi4uQWNjb3VudHMuX2NoZWNrUGFzc3dvcmRVc2VyRmllbGRzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIlVzZXIgbm90IGZvdW5kXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWdldFVzZXJQYXNzd29yZEhhc2godXNlcikpIHtcbiAgICAgICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiVXNlciBoYXMgbm8gcGFzc3dvcmQgc2V0XCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjaGVja1Bhc3N3b3JkQXN5bmModXNlciwgb2xkUGFzc3dvcmQpO1xuICAgICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgICB0aHJvdyByZXN1bHQuZXJyb3I7XG4gICAgICB9XG5cbiAgICAgIC8vIEl0IHdvdWxkIGJlIGJldHRlciBpZiB0aGlzIHJlbW92ZWQgQUxMIGV4aXN0aW5nIHRva2VucyBhbmQgcmVwbGFjZWRcbiAgICAgIC8vIHRoZSB0b2tlbiBmb3IgdGhlIGN1cnJlbnQgY29ubmVjdGlvbiB3aXRoIGEgbmV3IG9uZSwgYnV0IHRoYXQgd291bGRcbiAgICAgIC8vIGJlIHRyaWNreSwgc28gd2UnbGwgc2V0dGxlIGZvciBqdXN0IHJlcGxhY2luZyBhbGwgdG9rZW5zIG90aGVyIHRoYW5cbiAgICAgIC8vIHRoZSBvbmUgZm9yIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24uXG4gICAgICBjb25zdCBjdXJyZW50VG9rZW4gPSBBY2NvdW50cy5fZ2V0TG9naW5Ub2tlbih0aGlzLmNvbm5lY3Rpb24uaWQpO1xuICAgICAgY29uc3QgdXBkYXRvciA9IGF3YWl0IGdldFVwZGF0b3JGb3JVc2VyUGFzc3dvcmQobmV3UGFzc3dvcmQpO1xuXG4gICAgICBhd2FpdCBNZXRlb3IudXNlcnMudXBkYXRlQXN5bmMoXG4gICAgICAgIHsgX2lkOiB0aGlzLnVzZXJJZCB9LFxuICAgICAgICB7XG4gICAgICAgICAgJHNldDogdXBkYXRvci4kc2V0LFxuICAgICAgICAgICRwdWxsOiB7XG4gICAgICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiB7IGhhc2hlZFRva2VuOiB7ICRuZTogY3VycmVudFRva2VuIH0gfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgJHVuc2V0OiB7IFwic2VydmljZXMucGFzc3dvcmQucmVzZXRcIjogMSwgLi4udXBkYXRvci4kdW5zZXQgfVxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICByZXR1cm4geyBwYXNzd29yZENoYW5nZWQ6IHRydWUgfTtcbiAgICB9XG4gIH0pO1xuXG5cbi8vIEZvcmNlIGNoYW5nZSB0aGUgdXNlcnMgcGFzc3dvcmQuXG5cbi8qKlxuICogQHN1bW1hcnkgRm9yY2libHkgY2hhbmdlIHRoZSBwYXNzd29yZCBmb3IgYSB1c2VyLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gdXBkYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IG5ld1BsYWludGV4dFBhc3N3b3JkIEEgbmV3IHBhc3N3b3JkIGZvciB0aGUgdXNlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmxvZ291dCBMb2dvdXQgYWxsIGN1cnJlbnQgY29ubmVjdGlvbnMgd2l0aCB0aGlzIHVzZXJJZCAoZGVmYXVsdDogdHJ1ZSlcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNldFBhc3N3b3JkQXN5bmMgPVxuICBhc3luYyAodXNlcklkLCBuZXdQbGFpbnRleHRQYXNzd29yZCwgb3B0aW9ucykgPT4ge1xuICAgIGNoZWNrKHVzZXJJZCwgU3RyaW5nKTtcbiAgICBjaGVjayhuZXdQbGFpbnRleHRQYXNzd29yZCwgTWF0Y2guV2hlcmUoc3RyID0+IE1hdGNoLnRlc3Qoc3RyLCBTdHJpbmcpICYmIHN0ci5sZW5ndGggPD0gTWV0ZW9yLnNldHRpbmdzPy5wYWNrYWdlcz8uYWNjb3VudHM/LnBhc3N3b3JkTWF4TGVuZ3RoIHx8IDI1NikpO1xuICAgIGNoZWNrKG9wdGlvbnMsIE1hdGNoLk1heWJlKHsgbG9nb3V0OiBCb29sZWFuIH0pKTtcbiAgICBvcHRpb25zID0geyBsb2dvdXQ6IHRydWUsIC4uLm9wdGlvbnMgfTtcblxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBnZXRVc2VyQnlJZCh1c2VySWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuICAgIGlmICghdXNlcikge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG4gICAgfVxuXG4gICAgbGV0IHVwZGF0b3IgPSBhd2FpdCBnZXRVcGRhdG9yRm9yVXNlclBhc3N3b3JkKG5ld1BsYWludGV4dFBhc3N3b3JkKTtcbiAgICB1cGRhdG9yLiR1bnNldCA9IHVwZGF0b3IuJHVuc2V0IHx8IHt9O1xuICAgIHVwZGF0b3IuJHVuc2V0W1wic2VydmljZXMucGFzc3dvcmQucmVzZXRcIl0gPSAxO1xuXG4gICAgaWYgKG9wdGlvbnMubG9nb3V0KSB7XG4gICAgICB1cGRhdG9yLiR1bnNldFtcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiXSA9IDE7XG4gICAgfVxuXG4gICAgYXdhaXQgTWV0ZW9yLnVzZXJzLnVwZGF0ZUFzeW5jKHsgX2lkOiB1c2VyLl9pZCB9LCB1cGRhdG9yKTtcbiAgfTtcblxuLy8vXG4vLy8gUkVTRVRUSU5HIFZJQSBFTUFJTFxuLy8vXG5cbi8vIFV0aWxpdHkgZm9yIHBsdWNraW5nIGFkZHJlc3NlcyBmcm9tIGVtYWlsc1xuY29uc3QgcGx1Y2tBZGRyZXNzZXMgPSAoZW1haWxzID0gW10pID0+IGVtYWlscy5tYXAoZW1haWwgPT4gZW1haWwuYWRkcmVzcyk7XG5cbi8vIE1ldGhvZCBjYWxsZWQgYnkgYSB1c2VyIHRvIHJlcXVlc3QgYSBwYXNzd29yZCByZXNldCBlbWFpbC4gVGhpcyBpc1xuLy8gdGhlIHN0YXJ0IG9mIHRoZSByZXNldCBwcm9jZXNzLlxuTWV0ZW9yLm1ldGhvZHMoe2ZvcmdvdFBhc3N3b3JkOiBhc3luYyBvcHRpb25zID0+IHtcbiAgY2hlY2sob3B0aW9ucywge2VtYWlsOiBTdHJpbmd9KVxuXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBBY2NvdW50cy5maW5kVXNlckJ5RW1haWwob3B0aW9ucy5lbWFpbCwgeyBmaWVsZHM6IHsgZW1haWxzOiAxIH0gfSk7XG5cbiAgaWYgKCF1c2VyKSB7XG4gICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICBjb25zdCBlbWFpbHMgPSBwbHVja0FkZHJlc3Nlcyh1c2VyLmVtYWlscyk7XG4gIGNvbnN0IGNhc2VTZW5zaXRpdmVFbWFpbCA9IGVtYWlscy5maW5kKFxuICAgIGVtYWlsID0+IGVtYWlsLnRvTG93ZXJDYXNlKCkgPT09IG9wdGlvbnMuZW1haWwudG9Mb3dlckNhc2UoKVxuICApO1xuXG4gIGF3YWl0IEFjY291bnRzLnNlbmRSZXNldFBhc3N3b3JkRW1haWwodXNlci5faWQsIGNhc2VTZW5zaXRpdmVFbWFpbCk7XG59fSk7XG5cbi8qKlxuICogQHN1bW1hcnkgQXN5bmNocm9ub3VzbHkgZ2VuZXJhdGVzIGEgcmVzZXQgdG9rZW4gYW5kIHNhdmVzIGl0IGludG8gdGhlIGRhdGFiYXNlLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gZ2VuZXJhdGUgdGhlIHJlc2V0IHRva2VuIGZvci5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbCBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyIHRvIGdlbmVyYXRlIHRoZSByZXNldCB0b2tlbiBmb3IuIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gSWYgYG51bGxgLCBkZWZhdWx0cyB0byB0aGUgZmlyc3QgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge1N0cmluZ30gcmVhc29uIGByZXNldFBhc3N3b3JkYCBvciBgZW5yb2xsQWNjb3VudGAuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0Pn0gUHJvbWlzZSBvZiBhbiBvYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VufSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5nZW5lcmF0ZVJlc2V0VG9rZW4gPVxuICBhc3luYyAodXNlcklkLCBlbWFpbCwgcmVhc29uLCBleHRyYVRva2VuRGF0YSkgPT4ge1xuICAvLyBNYWtlIHN1cmUgdGhlIHVzZXIgZXhpc3RzLCBhbmQgZW1haWwgaXMgb25lIG9mIHRoZWlyIGFkZHJlc3Nlcy5cbiAgLy8gRG9uJ3QgbGltaXQgdGhlIGZpZWxkcyBpbiB0aGUgdXNlciBvYmplY3Qgc2luY2UgdGhlIHVzZXIgaXMgcmV0dXJuZWRcbiAgLy8gYnkgdGhlIGZ1bmN0aW9uIGFuZCBzb21lIG90aGVyIGZpZWxkcyBtaWdodCBiZSB1c2VkIGVsc2V3aGVyZS5cbiAgY29uc3QgdXNlciA9IGF3YWl0IGdldFVzZXJCeUlkKHVzZXJJZCk7XG4gIGlmICghdXNlcikge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIkNhbid0IGZpbmQgdXNlclwiKTtcbiAgfVxuXG4gIC8vIHBpY2sgdGhlIGZpcnN0IGVtYWlsIGlmIHdlIHdlcmVuJ3QgcGFzc2VkIGFuIGVtYWlsLlxuICBpZiAoIWVtYWlsICYmIHVzZXIuZW1haWxzICYmIHVzZXIuZW1haWxzWzBdKSB7XG4gICAgZW1haWwgPSB1c2VyLmVtYWlsc1swXS5hZGRyZXNzO1xuICB9XG5cbiAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYSB2YWxpZCBlbWFpbFxuICBpZiAoIWVtYWlsIHx8XG4gICAgIShwbHVja0FkZHJlc3Nlcyh1c2VyLmVtYWlscykuaW5jbHVkZXMoZW1haWwpKSkge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIk5vIHN1Y2ggZW1haWwgZm9yIHVzZXIuXCIpO1xuICB9XG5cbiAgY29uc3QgdG9rZW4gPSBSYW5kb20uc2VjcmV0KCk7XG4gIGNvbnN0IHRva2VuUmVjb3JkID0ge1xuICAgIHRva2VuLFxuICAgIGVtYWlsLFxuICAgIHdoZW46IG5ldyBEYXRlKClcbiAgfTtcblxuICBpZiAocmVhc29uID09PSAncmVzZXRQYXNzd29yZCcpIHtcbiAgICB0b2tlblJlY29yZC5yZWFzb24gPSAncmVzZXQnO1xuICB9IGVsc2UgaWYgKHJlYXNvbiA9PT0gJ2Vucm9sbEFjY291bnQnKSB7XG4gICAgdG9rZW5SZWNvcmQucmVhc29uID0gJ2Vucm9sbCc7XG4gIH0gZWxzZSBpZiAocmVhc29uKSB7XG4gICAgLy8gZmFsbGJhY2sgc28gdGhhdCB0aGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGZvciB1bmtub3duIHJlYXNvbnMgYXMgd2VsbFxuICAgIHRva2VuUmVjb3JkLnJlYXNvbiA9IHJlYXNvbjtcbiAgfVxuXG4gIGlmIChleHRyYVRva2VuRGF0YSkge1xuICAgIE9iamVjdC5hc3NpZ24odG9rZW5SZWNvcmQsIGV4dHJhVG9rZW5EYXRhKTtcbiAgfVxuICAvLyBpZiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgZnJvbSB0aGUgZW5yb2xsIGFjY291bnQgd29yay1mbG93IHRoZW5cbiAgLy8gc3RvcmUgdGhlIHRva2VuIHJlY29yZCBpbiAnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsJyBkYiBmaWVsZFxuICAvLyBlbHNlIHN0b3JlIHRoZSB0b2tlbiByZWNvcmQgaW4gaW4gJ3NlcnZpY2VzLnBhc3N3b3JkLnJlc2V0JyBkYiBmaWVsZFxuICBpZiAocmVhc29uID09PSBcImVucm9sbEFjY291bnRcIikge1xuICAgIGF3YWl0IE1ldGVvci51c2Vycy51cGRhdGVBc3luYyhcbiAgICAgIHsgX2lkOiB1c2VyLl9pZCB9LFxuICAgICAge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5lbnJvbGxcIjogdG9rZW5SZWNvcmRcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgLy8gYmVmb3JlIHBhc3NpbmcgdG8gdGVtcGxhdGUsIHVwZGF0ZSB1c2VyIG9iamVjdCB3aXRoIG5ldyB0b2tlblxuICAgIE1ldGVvci5fZW5zdXJlKHVzZXIsIFwic2VydmljZXNcIiwgXCJwYXNzd29yZFwiKS5lbnJvbGwgPSB0b2tlblJlY29yZDtcbiAgfVxuICBlbHNlIHtcbiAgICBhd2FpdCBNZXRlb3IudXNlcnMudXBkYXRlQXN5bmMoXG4gICAgICB7IF9pZDogdXNlci5faWQgfSxcbiAgICAgIHtcbiAgICAgICAgJHNldDoge1xuICAgICAgICAgIFwic2VydmljZXMucGFzc3dvcmQucmVzZXRcIjogdG9rZW5SZWNvcmRcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgLy8gYmVmb3JlIHBhc3NpbmcgdG8gdGVtcGxhdGUsIHVwZGF0ZSB1c2VyIG9iamVjdCB3aXRoIG5ldyB0b2tlblxuICAgIE1ldGVvci5fZW5zdXJlKHVzZXIsIFwic2VydmljZXNcIiwgXCJwYXNzd29yZFwiKS5yZXNldCA9IHRva2VuUmVjb3JkO1xuICB9XG5cbiAgcmV0dXJuIHsgZW1haWwsIHVzZXIsIHRva2VuIH07XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEdlbmVyYXRlcyBhc3luY2hyb25vdXNseSBhbiBlLW1haWwgdmVyaWZpY2F0aW9uIHRva2VuIGFuZCBzYXZlcyBpdCBpbnRvIHRoZSBkYXRhYmFzZS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdlbmVyYXRlIHRoZSAgZS1tYWlsIHZlcmlmaWNhdGlvbiB0b2tlbiBmb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgV2hpY2ggYWRkcmVzcyBvZiB0aGUgdXNlciB0byBnZW5lcmF0ZSB0aGUgZS1tYWlsIHZlcmlmaWNhdGlvbiB0b2tlbiBmb3IuIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gSWYgYG51bGxgLCBkZWZhdWx0cyB0byB0aGUgZmlyc3QgdW52ZXJpZmllZCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fSBQcm9taXNlIG9mIGFuIG9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW59IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmdlbmVyYXRlVmVyaWZpY2F0aW9uVG9rZW4gPVxuICBhc3luYyAodXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEpID0+IHtcbiAgLy8gTWFrZSBzdXJlIHRoZSB1c2VyIGV4aXN0cywgYW5kIGVtYWlsIGlzIG9uZSBvZiB0aGVpciBhZGRyZXNzZXMuXG4gIC8vIERvbid0IGxpbWl0IHRoZSBmaWVsZHMgaW4gdGhlIHVzZXIgb2JqZWN0IHNpbmNlIHRoZSB1c2VyIGlzIHJldHVybmVkXG4gIC8vIGJ5IHRoZSBmdW5jdGlvbiBhbmQgc29tZSBvdGhlciBmaWVsZHMgbWlnaHQgYmUgdXNlZCBlbHNld2hlcmUuXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBnZXRVc2VyQnlJZCh1c2VySWQpO1xuICBpZiAoIXVzZXIpIHtcbiAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJDYW4ndCBmaW5kIHVzZXJcIik7XG4gIH1cblxuICAvLyBwaWNrIHRoZSBmaXJzdCB1bnZlcmlmaWVkIGVtYWlsIGlmIHdlIHdlcmVuJ3QgcGFzc2VkIGFuIGVtYWlsLlxuICBpZiAoIWVtYWlsKSB7XG4gICAgY29uc3QgZW1haWxSZWNvcmQgPSAodXNlci5lbWFpbHMgfHwgW10pLmZpbmQoZSA9PiAhZS52ZXJpZmllZCk7XG4gICAgZW1haWwgPSAoZW1haWxSZWNvcmQgfHwge30pLmFkZHJlc3M7XG5cbiAgICBpZiAoIWVtYWlsKSB7XG4gICAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJUaGF0IHVzZXIgaGFzIG5vIHVudmVyaWZpZWQgZW1haWwgYWRkcmVzc2VzLlwiKTtcbiAgICB9XG4gIH1cblxuICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSBhIHZhbGlkIGVtYWlsXG4gIGlmICghZW1haWwgfHxcbiAgICAhKHBsdWNrQWRkcmVzc2VzKHVzZXIuZW1haWxzKS5pbmNsdWRlcyhlbWFpbCkpKSB7XG4gICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiTm8gc3VjaCBlbWFpbCBmb3IgdXNlci5cIik7XG4gIH1cblxuICBjb25zdCB0b2tlbiA9IFJhbmRvbS5zZWNyZXQoKTtcbiAgY29uc3QgdG9rZW5SZWNvcmQgPSB7XG4gICAgdG9rZW4sXG4gICAgLy8gVE9ETzogVGhpcyBzaG91bGQgcHJvYmFibHkgYmUgcmVuYW1lZCB0byBcImVtYWlsXCIgdG8gbWF0Y2ggcmVzZXQgdG9rZW4gcmVjb3JkLlxuICAgIGFkZHJlc3M6IGVtYWlsLFxuICAgIHdoZW46IG5ldyBEYXRlKClcbiAgfTtcblxuICBpZiAoZXh0cmFUb2tlbkRhdGEpIHtcbiAgICBPYmplY3QuYXNzaWduKHRva2VuUmVjb3JkLCBleHRyYVRva2VuRGF0YSk7XG4gIH1cblxuICBhd2FpdCBNZXRlb3IudXNlcnMudXBkYXRlQXN5bmMoe19pZDogdXNlci5faWR9LCB7JHB1c2g6IHtcbiAgICAnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zJzogdG9rZW5SZWNvcmRcbiAgfX0pO1xuXG4gIC8vIGJlZm9yZSBwYXNzaW5nIHRvIHRlbXBsYXRlLCB1cGRhdGUgdXNlciBvYmplY3Qgd2l0aCBuZXcgdG9rZW5cbiAgTWV0ZW9yLl9lbnN1cmUodXNlciwgJ3NlcnZpY2VzJywgJ2VtYWlsJyk7XG4gIGlmICghdXNlci5zZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMpIHtcbiAgICB1c2VyLnNlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2VucyA9IFtdO1xuICB9XG4gIHVzZXIuc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLnB1c2godG9rZW5SZWNvcmQpO1xuXG4gIHJldHVybiB7ZW1haWwsIHVzZXIsIHRva2VufTtcbn07XG5cblxuLy8gc2VuZCB0aGUgdXNlciBhbiBlbWFpbCB3aXRoIGEgbGluayB0aGF0IHdoZW4gb3BlbmVkIGFsbG93cyB0aGUgdXNlclxuLy8gdG8gc2V0IGEgbmV3IHBhc3N3b3JkLCB3aXRob3V0IHRoZSBvbGQgcGFzc3dvcmQuXG5cbi8qKlxuICogQHN1bW1hcnkgU2VuZCBhbiBlbWFpbCBhc3luY2hyb25vdXNseSB3aXRoIGEgbGluayB0aGUgdXNlciBjYW4gdXNlIHRvIHJlc2V0IHRoZWlyIHBhc3N3b3JkLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gc2VuZCBlbWFpbCB0by5cbiAqIEBwYXJhbSB7U3RyaW5nfSBbZW1haWxdIE9wdGlvbmFsLiBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyJ3MgdG8gc2VuZCB0aGUgZW1haWwgdG8uIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gRGVmYXVsdHMgdG8gdGhlIGZpcnN0IGVtYWlsIGluIHRoZSBsaXN0LlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVRva2VuRGF0YV0gT3B0aW9uYWwgYWRkaXRpb25hbCBkYXRhIHRvIGJlIGFkZGVkIGludG8gdGhlIHRva2VuIHJlY29yZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFQYXJhbXNdIE9wdGlvbmFsIGFkZGl0aW9uYWwgcGFyYW1zIHRvIGJlIGFkZGVkIHRvIHRoZSByZXNldCB1cmwuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fSBQcm9taXNlIG9mIGFuIG9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc30gdmFsdWVzLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2VuZFJlc2V0UGFzc3dvcmRFbWFpbCA9XG4gIGFzeW5jICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSwgZXh0cmFQYXJhbXMpID0+IHtcbiAgICBjb25zdCB7IGVtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VuIH0gPVxuICAgICAgYXdhaXQgQWNjb3VudHMuZ2VuZXJhdGVSZXNldFRva2VuKHVzZXJJZCwgZW1haWwsICdyZXNldFBhc3N3b3JkJywgZXh0cmFUb2tlbkRhdGEpO1xuICAgIGNvbnN0IHVybCA9IEFjY291bnRzLnVybHMucmVzZXRQYXNzd29yZCh0b2tlbiwgZXh0cmFQYXJhbXMpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCBBY2NvdW50cy5nZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbChyZWFsRW1haWwsIHVzZXIsIHVybCwgJ3Jlc2V0UGFzc3dvcmQnKTtcbiAgICBhd2FpdCBFbWFpbC5zZW5kQXN5bmMob3B0aW9ucyk7XG5cbiAgICBpZiAoTWV0ZW9yLmlzRGV2ZWxvcG1lbnQgJiYgIU1ldGVvci5pc1BhY2thZ2VUZXN0KSB7XG4gICAgICBjb25zb2xlLmxvZyhgXFxuUmVzZXQgcGFzc3dvcmQgVVJMOiAkeyB1cmwgfWApO1xuICAgIH1cbiAgICByZXR1cm4geyBlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zIH07XG4gIH07XG5cbi8vIHNlbmQgdGhlIHVzZXIgYW4gZW1haWwgaW5mb3JtaW5nIHRoZW0gdGhhdCB0aGVpciBhY2NvdW50IHdhcyBjcmVhdGVkLCB3aXRoXG4vLyBhIGxpbmsgdGhhdCB3aGVuIG9wZW5lZCBib3RoIG1hcmtzIHRoZWlyIGVtYWlsIGFzIHZlcmlmaWVkIGFuZCBmb3JjZXMgdGhlbVxuLy8gdG8gY2hvb3NlIHRoZWlyIHBhc3N3b3JkLiBUaGUgZW1haWwgbXVzdCBiZSBvbmUgb2YgdGhlIGFkZHJlc3NlcyBpbiB0aGVcbi8vIHVzZXIncyBlbWFpbHMgZmllbGQsIG9yIHVuZGVmaW5lZCB0byBwaWNrIHRoZSBmaXJzdCBlbWFpbCBhdXRvbWF0aWNhbGx5LlxuLy9cbi8vIFRoaXMgaXMgbm90IGNhbGxlZCBhdXRvbWF0aWNhbGx5LiBJdCBtdXN0IGJlIGNhbGxlZCBtYW51YWxseSBpZiB5b3Vcbi8vIHdhbnQgdG8gdXNlIGVucm9sbG1lbnQgZW1haWxzLlxuXG4vKipcbiAqIEBzdW1tYXJ5IFNlbmQgYW4gZW1haWwgYXN5bmNocm9ub3VzbHkgd2l0aCBhIGxpbmsgdGhlIHVzZXIgY2FuIHVzZSB0byBzZXQgdGhlaXIgaW5pdGlhbCBwYXNzd29yZC5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIHNlbmQgZW1haWwgdG8uXG4gKiBAcGFyYW0ge1N0cmluZ30gW2VtYWlsXSBPcHRpb25hbC4gV2hpY2ggYWRkcmVzcyBvZiB0aGUgdXNlcidzIHRvIHNlbmQgdGhlIGVtYWlsIHRvLiBUaGlzIGFkZHJlc3MgbXVzdCBiZSBpbiB0aGUgdXNlcidzIGBlbWFpbHNgIGxpc3QuIERlZmF1bHRzIHRvIHRoZSBmaXJzdCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhUGFyYW1zXSBPcHRpb25hbCBhZGRpdGlvbmFsIHBhcmFtcyB0byBiZSBhZGRlZCB0byB0aGUgZW5yb2xsbWVudCB1cmwuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fSBQcm9taXNlIG9mIGFuIG9iamVjdCB7ZW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNlbmRFbnJvbGxtZW50RW1haWwgPVxuICBhc3luYyAodXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEsIGV4dHJhUGFyYW1zKSA9PiB7XG5cbiAgICBjb25zdCB7IGVtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VuIH0gPVxuICAgICAgYXdhaXQgQWNjb3VudHMuZ2VuZXJhdGVSZXNldFRva2VuKHVzZXJJZCwgZW1haWwsICdlbnJvbGxBY2NvdW50JywgZXh0cmFUb2tlbkRhdGEpO1xuXG4gICAgY29uc3QgdXJsID0gQWNjb3VudHMudXJscy5lbnJvbGxBY2NvdW50KHRva2VuLCBleHRyYVBhcmFtcyk7XG5cbiAgICBjb25zdCBvcHRpb25zID1cbiAgICAgIGF3YWl0IEFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsKHJlYWxFbWFpbCwgdXNlciwgdXJsLCAnZW5yb2xsQWNjb3VudCcpO1xuXG4gICAgYXdhaXQgRW1haWwuc2VuZEFzeW5jKG9wdGlvbnMpO1xuICAgIGlmIChNZXRlb3IuaXNEZXZlbG9wbWVudCAmJiAhTWV0ZW9yLmlzUGFja2FnZVRlc3QpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBcXG5FbnJvbGxtZW50IGVtYWlsIFVSTDogJHsgdXJsIH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9ucyB9O1xuICB9O1xuXG5cbi8vIFRha2UgdG9rZW4gZnJvbSBzZW5kUmVzZXRQYXNzd29yZEVtYWlsIG9yIHNlbmRFbnJvbGxtZW50RW1haWwsIGNoYW5nZVxuLy8gdGhlIHVzZXJzIHBhc3N3b3JkLCBhbmQgbG9nIHRoZW0gaW4uXG5NZXRlb3IubWV0aG9kcyhcbiAge1xuICAgIHJlc2V0UGFzc3dvcmQ6XG4gICAgICBhc3luYyBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBjb25zdCB0b2tlbiA9IGFyZ3NbMF07XG4gICAgICAgIGNvbnN0IG5ld1Bhc3N3b3JkID0gYXJnc1sxXTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEFjY291bnRzLl9sb2dpbk1ldGhvZChcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIFwicmVzZXRQYXNzd29yZFwiLFxuICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgXCJwYXNzd29yZFwiLFxuICAgICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuICAgICAgICAgICAgY2hlY2sobmV3UGFzc3dvcmQsIHBhc3N3b3JkVmFsaWRhdG9yKTtcbiAgICAgICAgICAgIGxldCB1c2VyID0gYXdhaXQgTWV0ZW9yLnVzZXJzLmZpbmRPbmVBc3luYyhcbiAgICAgICAgICAgICAgeyBcInNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LnRva2VuXCI6IHRva2VuIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICAgIHNlcnZpY2VzOiAxLFxuICAgICAgICAgICAgICAgICAgZW1haWxzOiAxLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgbGV0IGlzRW5yb2xsID0gZmFsc2U7XG4gICAgICAgICAgICAvLyBpZiB0b2tlbiBpcyBpbiBzZXJ2aWNlcy5wYXNzd29yZC5yZXNldCBkYiBmaWVsZCBpbXBsaWVzXG4gICAgICAgICAgICAvLyB0aGlzIG1ldGhvZCBpcyB3YXMgbm90IGNhbGxlZCBmcm9tIGVucm9sbCBhY2NvdW50IHdvcmtmbG93XG4gICAgICAgICAgICAvLyBlbHNlIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBmcm9tIGVucm9sbCBhY2NvdW50IHdvcmtmbG93XG4gICAgICAgICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgICAgICAgdXNlciA9IGF3YWl0IE1ldGVvci51c2Vycy5maW5kT25lQXN5bmMoXG4gICAgICAgICAgICAgICAgeyBcInNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC50b2tlblwiOiB0b2tlbiB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlczogMSxcbiAgICAgICAgICAgICAgICAgICAgZW1haWxzOiAxLFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaXNFbnJvbGwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGV4cGlyZWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdG9rZW5SZWNvcmQgPSB7fTtcbiAgICAgICAgICAgIGlmIChpc0Vucm9sbCkge1xuICAgICAgICAgICAgICB0b2tlblJlY29yZCA9IHVzZXIuc2VydmljZXMucGFzc3dvcmQuZW5yb2xsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdG9rZW5SZWNvcmQgPSB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyB3aGVuLCBlbWFpbCB9ID0gdG9rZW5SZWNvcmQ7XG4gICAgICAgICAgICBsZXQgdG9rZW5MaWZldGltZU1zID0gQWNjb3VudHMuX2dldFBhc3N3b3JkUmVzZXRUb2tlbkxpZmV0aW1lTXMoKTtcbiAgICAgICAgICAgIGlmIChpc0Vucm9sbCkge1xuICAgICAgICAgICAgICB0b2tlbkxpZmV0aW1lTXMgPSBBY2NvdW50cy5fZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUaW1lTXMgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgaWYgKChjdXJyZW50VGltZU1zIC0gd2hlbikgPiB0b2tlbkxpZmV0aW1lTXMpXG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGV4cGlyZWRcIik7XG4gICAgICAgICAgICBpZiAoIShwbHVja0FkZHJlc3Nlcyh1c2VyLmVtYWlscykuaW5jbHVkZXMoZW1haWwpKSlcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJUb2tlbiBoYXMgaW52YWxpZCBlbWFpbCBhZGRyZXNzXCIpXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIE5PVEU6IFdlJ3JlIGFib3V0IHRvIGludmFsaWRhdGUgdG9rZW5zIG9uIHRoZSB1c2VyLCB3aG8gd2UgbWlnaHQgYmVcbiAgICAgICAgICAgIC8vIGxvZ2dlZCBpbiBhcy4gTWFrZSBzdXJlIHRvIGF2b2lkIGxvZ2dpbmcgb3Vyc2VsdmVzIG91dCBpZiB0aGlzXG4gICAgICAgICAgICAvLyBoYXBwZW5zLiBCdXQgYWxzbyBtYWtlIHN1cmUgbm90IHRvIGxlYXZlIHRoZSBjb25uZWN0aW9uIGluIGEgc3RhdGVcbiAgICAgICAgICAgIC8vIG9mIGhhdmluZyBhIGJhZCB0b2tlbiBzZXQgaWYgdGhpbmdzIGZhaWwuXG4gICAgICAgICAgICBjb25zdCBvbGRUb2tlbiA9IEFjY291bnRzLl9nZXRMb2dpblRva2VuKHRoaXMuY29ubmVjdGlvbi5pZCk7XG4gICAgICAgICAgICBBY2NvdW50cy5fc2V0TG9naW5Ub2tlbih1c2VyLl9pZCwgdGhpcy5jb25uZWN0aW9uLCBudWxsKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc2V0VG9PbGRUb2tlbiA9ICgpID0+XG4gICAgICAgICAgICAgIEFjY291bnRzLl9zZXRMb2dpblRva2VuKHVzZXIuX2lkLCB0aGlzLmNvbm5lY3Rpb24sIG9sZFRva2VuKTtcblxuICAgICAgICAgICAgY29uc3QgdXBkYXRvciA9IGF3YWl0IGdldFVwZGF0b3JGb3JVc2VyUGFzc3dvcmQobmV3UGFzc3dvcmQpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHVzZXIgcmVjb3JkIGJ5OlxuICAgICAgICAgICAgICAvLyAtIENoYW5naW5nIHRoZSBwYXNzd29yZCB0byB0aGUgbmV3IG9uZVxuICAgICAgICAgICAgICAvLyAtIEZvcmdldHRpbmcgYWJvdXQgdGhlIHJlc2V0IHRva2VuIG9yIGVucm9sbCB0b2tlbiB0aGF0IHdhcyBqdXN0IHVzZWRcbiAgICAgICAgICAgICAgLy8gLSBWZXJpZnlpbmcgdGhlaXIgZW1haWwsIHNpbmNlIHRoZXkgZ290IHRoZSBwYXNzd29yZCByZXNldCB2aWEgZW1haWwuXG4gICAgICAgICAgICAgIGxldCBhZmZlY3RlZFJlY29yZHMgPSB7fTtcbiAgICAgICAgICAgICAgLy8gaWYgcmVhc29uIGlzIGVucm9sbCB0aGVuIGNoZWNrIHNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC50b2tlbiBmaWVsZCBmb3IgYWZmZWN0ZWQgcmVjb3Jkc1xuICAgICAgICAgICAgICBpZiAoaXNFbnJvbGwpIHtcbiAgICAgICAgICAgICAgICBhZmZlY3RlZFJlY29yZHMgPSBhd2FpdCBNZXRlb3IudXNlcnMudXBkYXRlQXN5bmMoXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIF9pZDogdXNlci5faWQsXG4gICAgICAgICAgICAgICAgICAgIFwiZW1haWxzLmFkZHJlc3NcIjogZW1haWwsXG4gICAgICAgICAgICAgICAgICAgIFwic2VydmljZXMucGFzc3dvcmQuZW5yb2xsLnRva2VuXCI6IHRva2VuXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJlbWFpbHMuJC52ZXJpZmllZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIC4uLnVwZGF0b3IuJHNldFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAkdW5zZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICBcInNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICAgIC4uLnVwZGF0b3IuJHVuc2V0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFmZmVjdGVkUmVjb3JkcyA9IGF3YWl0IE1ldGVvci51c2Vycy51cGRhdGVBc3luYyhcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJlbWFpbHMuYWRkcmVzc1wiOiBlbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC50b2tlblwiOiB0b2tlblxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICAgICAgICAgIFwiZW1haWxzLiQudmVyaWZpZWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAuLi51cGRhdG9yLiRzZXRcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJHVuc2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldFwiOiAxLFxuICAgICAgICAgICAgICAgICAgICAgIC4uLnVwZGF0b3IuJHVuc2V0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChhZmZlY3RlZFJlY29yZHMgIT09IDEpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiSW52YWxpZCBlbWFpbFwiKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVzZXRUb09sZFRva2VuKCk7XG4gICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVwbGFjZSBhbGwgdmFsaWQgbG9naW4gdG9rZW5zIHdpdGggbmV3IG9uZXMgKGNoYW5naW5nXG4gICAgICAgICAgICAvLyBwYXNzd29yZCBzaG91bGQgaW52YWxpZGF0ZSBleGlzdGluZyBzZXNzaW9ucykuXG4gICAgICAgICAgICBhd2FpdCBBY2NvdW50cy5fY2xlYXJBbGxMb2dpblRva2Vucyh1c2VyLl9pZCk7XG5cbiAgICAgICAgICAgIGlmIChBY2NvdW50cy5fY2hlY2syZmFFbmFibGVkPy4odXNlcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgICAgICAgICAgIGVycm9yOiBBY2NvdW50cy5faGFuZGxlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAnQ2hhbmdlZCBwYXNzd29yZCwgYnV0IHVzZXIgbm90IGxvZ2dlZCBpbiBiZWNhdXNlIDJGQSBpcyBlbmFibGVkJyxcbiAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgJzJmYS1lbmFibGVkJ1xuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB1c2VySWQ6IHVzZXIuX2lkIH07XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICB9XG4pO1xuXG4vLy9cbi8vLyBFTUFJTCBWRVJJRklDQVRJT05cbi8vL1xuXG5cbi8vIHNlbmQgdGhlIHVzZXIgYW4gZW1haWwgd2l0aCBhIGxpbmsgdGhhdCB3aGVuIG9wZW5lZCBtYXJrcyB0aGF0XG4vLyBhZGRyZXNzIGFzIHZlcmlmaWVkXG5cbi8qKlxuICogQHN1bW1hcnkgU2VuZCBhbiBlbWFpbCBhc3luY2hyb25vdXNseSB3aXRoIGEgbGluayB0aGUgdXNlciBjYW4gdXNlIHZlcmlmeSB0aGVpciBlbWFpbCBhZGRyZXNzLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gc2VuZCBlbWFpbCB0by5cbiAqIEBwYXJhbSB7U3RyaW5nfSBbZW1haWxdIE9wdGlvbmFsLiBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyJ3MgdG8gc2VuZCB0aGUgZW1haWwgdG8uIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gRGVmYXVsdHMgdG8gdGhlIGZpcnN0IHVudmVyaWZpZWQgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVBhcmFtc10gT3B0aW9uYWwgYWRkaXRpb25hbCBwYXJhbXMgdG8gYmUgYWRkZWQgdG8gdGhlIHZlcmlmaWNhdGlvbiB1cmwuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fSBQcm9taXNlIG9mIGFuIG9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc30gdmFsdWVzLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsID1cbiAgYXN5bmMgKHVzZXJJZCwgZW1haWwsIGV4dHJhVG9rZW5EYXRhLCBleHRyYVBhcmFtcykgPT4ge1xuICAgIC8vIFhYWCBBbHNvIGdlbmVyYXRlIGEgbGluayB1c2luZyB3aGljaCBzb21lb25lIGNhbiBkZWxldGUgdGhpc1xuICAgIC8vIGFjY291bnQgaWYgdGhleSBvd24gc2FpZCBhZGRyZXNzIGJ1dCB3ZXJlbid0IHRob3NlIHdobyBjcmVhdGVkXG4gICAgLy8gdGhpcyBhY2NvdW50LlxuXG4gICAgY29uc3QgeyBlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbiB9ID1cbiAgICAgIGF3YWl0IEFjY291bnRzLmdlbmVyYXRlVmVyaWZpY2F0aW9uVG9rZW4odXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEpO1xuICAgIGNvbnN0IHVybCA9IEFjY291bnRzLnVybHMudmVyaWZ5RW1haWwodG9rZW4sIGV4dHJhUGFyYW1zKTtcbiAgICBjb25zdCBvcHRpb25zID0gYXdhaXQgQWNjb3VudHMuZ2VuZXJhdGVPcHRpb25zRm9yRW1haWwocmVhbEVtYWlsLCB1c2VyLCB1cmwsICd2ZXJpZnlFbWFpbCcpO1xuICAgIGF3YWl0IEVtYWlsLnNlbmRBc3luYyhvcHRpb25zKTtcbiAgICBpZiAoTWV0ZW9yLmlzRGV2ZWxvcG1lbnQgJiYgIU1ldGVvci5pc1BhY2thZ2VUZXN0KSB7XG4gICAgICBjb25zb2xlLmxvZyhgXFxuVmVyaWZpY2F0aW9uIGVtYWlsIFVSTDogJHsgdXJsIH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9ucyB9O1xuICB9O1xuXG4vLyBUYWtlIHRva2VuIGZyb20gc2VuZFZlcmlmaWNhdGlvbkVtYWlsLCBtYXJrIHRoZSBlbWFpbCBhcyB2ZXJpZmllZCxcbi8vIGFuZCBsb2cgdGhlbSBpbi5cbk1ldGVvci5tZXRob2RzKFxuICB7XG4gICAgdmVyaWZ5RW1haWw6IGFzeW5jIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGFyZ3NbMF07XG4gICAgICByZXR1cm4gYXdhaXQgQWNjb3VudHMuX2xvZ2luTWV0aG9kKFxuICAgICAgICB0aGlzLFxuICAgICAgICBcInZlcmlmeUVtYWlsXCIsXG4gICAgICAgIGFyZ3MsXG4gICAgICAgIFwicGFzc3dvcmRcIixcbiAgICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG4gICAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IE1ldGVvci51c2Vycy5maW5kT25lQXN5bmMoXG4gICAgICAgICAgICB7ICdzZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMudG9rZW4nOiB0b2tlbiB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlczogMSxcbiAgICAgICAgICAgICAgICBlbWFpbHM6IDEsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIGlmICghdXNlcilcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlZlcmlmeSBlbWFpbCBsaW5rIGV4cGlyZWRcIik7XG5cbiAgICAgICAgICBjb25zdCB0b2tlblJlY29yZCA9XG4gICAgICAgICAgICBhd2FpdCB1c2VyXG4gICAgICAgICAgICAgIC5zZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMuZmluZCh0ID0+IHQudG9rZW4gPT0gdG9rZW4pO1xuXG4gICAgICAgICAgaWYgKCF0b2tlblJlY29yZClcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJWZXJpZnkgZW1haWwgbGluayBleHBpcmVkXCIpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgZW1haWxzUmVjb3JkID1cbiAgICAgICAgICAgIHVzZXIuZW1haWxzLmZpbmQoZSA9PiBlLmFkZHJlc3MgPT0gdG9rZW5SZWNvcmQuYWRkcmVzcyk7XG5cbiAgICAgICAgICBpZiAoIWVtYWlsc1JlY29yZClcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJWZXJpZnkgZW1haWwgbGluayBpcyBmb3IgdW5rbm93biBhZGRyZXNzXCIpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gQnkgaW5jbHVkaW5nIHRoZSBhZGRyZXNzIGluIHRoZSBxdWVyeSwgd2UgY2FuIHVzZSAnZW1haWxzLiQnIGluIHRoZVxuICAgICAgICAgIC8vIG1vZGlmaWVyIHRvIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgc3BlY2lmaWMgb2JqZWN0IGluIHRoZSBlbWFpbHNcbiAgICAgICAgICAvLyBhcnJheS4gU2VlXG4gICAgICAgICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvVXBkYXRpbmcvI1VwZGF0aW5nLVRoZSUyNHBvc2l0aW9uYWxvcGVyYXRvcilcbiAgICAgICAgICAvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Rpc3BsYXkvRE9DUy9VcGRhdGluZyNVcGRhdGluZy0lMjRwdWxsXG4gICAgICAgICAgYXdhaXQgTWV0ZW9yLnVzZXJzLnVwZGF0ZUFzeW5jKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBfaWQ6IHVzZXIuX2lkLFxuICAgICAgICAgICAgICAnZW1haWxzLmFkZHJlc3MnOiB0b2tlblJlY29yZC5hZGRyZXNzXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAkc2V0OiB7ICdlbWFpbHMuJC52ZXJpZmllZCc6IHRydWUgfSxcbiAgICAgICAgICAgICAgJHB1bGw6IHsgJ3NlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucyc6IHsgYWRkcmVzczogdG9rZW5SZWNvcmQuYWRkcmVzcyB9IH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKEFjY291bnRzLl9jaGVjazJmYUVuYWJsZWQ/Lih1c2VyKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IEFjY291bnRzLl9oYW5kbGVFcnJvcihcbiAgICAgICAgICAgICdFbWFpbCB2ZXJpZmllZCwgYnV0IHVzZXIgbm90IGxvZ2dlZCBpbiBiZWNhdXNlIDJGQSBpcyBlbmFibGVkJyxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgJzJmYS1lbmFibGVkJ1xuICAgICAgICAgICksXG4gICAgICAgIH07XG4gICAgICB9cmV0dXJuIHsgdXNlcklkOiB1c2VyLl9pZCB9O1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbi8qKlxuICogQHN1bW1hcnkgQXN5bmNocm9ub3VzbHkgYWRkIGFuIGVtYWlsIGFkZHJlc3MgZm9yIGEgdXNlci4gVXNlIHRoaXMgaW5zdGVhZCBvZiBkaXJlY3RseVxuICogdXBkYXRpbmcgdGhlIGRhdGFiYXNlLiBUaGUgb3BlcmF0aW9uIHdpbGwgZmFpbCBpZiB0aGVyZSBpcyBhIGRpZmZlcmVudCB1c2VyXG4gKiB3aXRoIGFuIGVtYWlsIG9ubHkgZGlmZmVyaW5nIGluIGNhc2UuIElmIHRoZSBzcGVjaWZpZWQgdXNlciBoYXMgYW4gZXhpc3RpbmdcbiAqIGVtYWlsIG9ubHkgZGlmZmVyaW5nIGluIGNhc2UgaG93ZXZlciwgd2UgcmVwbGFjZSBpdC5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuZXdFbWFpbCBBIG5ldyBlbWFpbCBhZGRyZXNzIGZvciB0aGUgdXNlci5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3ZlcmlmaWVkXSBPcHRpb25hbCAtIHdoZXRoZXIgdGhlIG5ldyBlbWFpbCBhZGRyZXNzIHNob3VsZFxuICogYmUgbWFya2VkIGFzIHZlcmlmaWVkLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmFkZEVtYWlsQXN5bmMgPSBhc3luYyAodXNlcklkLCBuZXdFbWFpbCwgdmVyaWZpZWQpID0+IHtcbiAgY2hlY2sodXNlcklkLCBOb25FbXB0eVN0cmluZyk7XG4gIGNoZWNrKG5ld0VtYWlsLCBOb25FbXB0eVN0cmluZyk7XG4gIGNoZWNrKHZlcmlmaWVkLCBNYXRjaC5PcHRpb25hbChCb29sZWFuKSk7XG5cbiAgaWYgKHZlcmlmaWVkID09PSB2b2lkIDApIHtcbiAgICB2ZXJpZmllZCA9IGZhbHNlO1xuICB9XG5cbiAgY29uc3QgdXNlciA9IGF3YWl0IGdldFVzZXJCeUlkKHVzZXJJZCwgeyBmaWVsZHM6IHsgZW1haWxzOiAxIH0gfSk7XG4gIGlmICghdXNlcikgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG5cbiAgLy8gQWxsb3cgdXNlcnMgdG8gY2hhbmdlIHRoZWlyIG93biBlbWFpbCB0byBhIHZlcnNpb24gd2l0aCBhIGRpZmZlcmVudCBjYXNlXG5cbiAgLy8gV2UgZG9uJ3QgaGF2ZSB0byBjYWxsIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyB0byBkbyBhIGNhc2VcbiAgLy8gaW5zZW5zaXRpdmUgY2hlY2sgYWNyb3NzIGFsbCBlbWFpbHMgaW4gdGhlIGRhdGFiYXNlIGhlcmUgYmVjYXVzZTogKDEpIGlmXG4gIC8vIHRoZXJlIGlzIG5vIGNhc2UtaW5zZW5zaXRpdmUgZHVwbGljYXRlIGJldHdlZW4gdGhpcyB1c2VyIGFuZCBvdGhlciB1c2VycyxcbiAgLy8gdGhlbiB3ZSBhcmUgT0sgYW5kICgyKSBpZiB0aGlzIHdvdWxkIGNyZWF0ZSBhIGNvbmZsaWN0IHdpdGggb3RoZXIgdXNlcnNcbiAgLy8gdGhlbiB0aGVyZSB3b3VsZCBhbHJlYWR5IGJlIGEgY2FzZS1pbnNlbnNpdGl2ZSBkdXBsaWNhdGUgYW5kIHdlIGNhbid0IGZpeFxuICAvLyB0aGF0IGluIHRoaXMgY29kZSBhbnl3YXkuXG4gIGNvbnN0IGNhc2VJbnNlbnNpdGl2ZVJlZ0V4cCA9IG5ldyBSZWdFeHAoXG4gICAgYF4ke01ldGVvci5fZXNjYXBlUmVnRXhwKG5ld0VtYWlsKX0kYCxcbiAgICBcImlcIlxuICApO1xuXG4gIC8vIFRPRE86IFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoLiBJZiB3ZSBoYXZlIGEgbG90IG9mIGVtYWlscy5cbiAgLy8gIHdlIHNob3VsZCBjb25zaWRlciB1c2luZyBhIGRpZmZlcmVudCBkYXRhIHN0cnVjdHVyZS5cbiAgY29uc3QgdXBkYXRlZEVtYWlsID0gYXN5bmMgKGVtYWlscyA9IFtdLCBfaWQpID0+IHtcbiAgICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgZW1haWwgb2YgZW1haWxzKSB7XG4gICAgICBpZiAoY2FzZUluc2Vuc2l0aXZlUmVnRXhwLnRlc3QoZW1haWwuYWRkcmVzcykpIHtcbiAgICAgICAgYXdhaXQgTWV0ZW9yLnVzZXJzLnVwZGF0ZUFzeW5jKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIF9pZDogX2lkLFxuICAgICAgICAgICAgXCJlbWFpbHMuYWRkcmVzc1wiOiBlbWFpbC5hZGRyZXNzLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICBcImVtYWlscy4kLmFkZHJlc3NcIjogbmV3RW1haWwsXG4gICAgICAgICAgICAgIFwiZW1haWxzLiQudmVyaWZpZWRcIjogdmVyaWZpZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1cGRhdGVkO1xuICB9O1xuICBjb25zdCBkaWRVcGRhdGVPd25FbWFpbCA9IGF3YWl0IHVwZGF0ZWRFbWFpbCh1c2VyLmVtYWlscywgdXNlci5faWQpO1xuXG4gIC8vIEluIHRoZSBvdGhlciB1cGRhdGVzIGJlbG93LCB3ZSBoYXZlIHRvIGRvIGFub3RoZXIgY2FsbCB0b1xuICAvLyBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMgdG8gbWFrZSBzdXJlIHRoYXQgbm8gY29uZmxpY3RpbmcgdmFsdWVzXG4gIC8vIHdlcmUgYWRkZWQgdG8gdGhlIGRhdGFiYXNlIGluIHRoZSBtZWFudGltZS4gV2UgZG9uJ3QgaGF2ZSB0byBkbyB0aGlzIGZvclxuICAvLyB0aGUgY2FzZSB3aGVyZSB0aGUgdXNlciBpcyB1cGRhdGluZyB0aGVpciBlbWFpbCBhZGRyZXNzIHRvIG9uZSB0aGF0IGlzIHRoZVxuICAvLyBzYW1lIGFzIGJlZm9yZSwgYnV0IG9ubHkgZGlmZmVyZW50IGJlY2F1c2Ugb2YgY2FwaXRhbGl6YXRpb24uIFJlYWQgdGhlXG4gIC8vIGJpZyBjb21tZW50IGFib3ZlIHRvIHVuZGVyc3RhbmQgd2h5LlxuXG4gIGlmIChkaWRVcGRhdGVPd25FbWFpbCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFBlcmZvcm0gYSBjYXNlIGluc2Vuc2l0aXZlIGNoZWNrIGZvciBkdXBsaWNhdGVzIGJlZm9yZSB1cGRhdGVcbiAgYXdhaXQgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyhcbiAgICBcImVtYWlscy5hZGRyZXNzXCIsXG4gICAgXCJFbWFpbFwiLFxuICAgIG5ld0VtYWlsLFxuICAgIHVzZXIuX2lkXG4gICk7XG5cbiAgYXdhaXQgTWV0ZW9yLnVzZXJzLnVwZGF0ZUFzeW5jKFxuICAgIHtcbiAgICAgIF9pZDogdXNlci5faWQsXG4gICAgfSxcbiAgICB7XG4gICAgICAkYWRkVG9TZXQ6IHtcbiAgICAgICAgZW1haWxzOiB7XG4gICAgICAgICAgYWRkcmVzczogbmV3RW1haWwsXG4gICAgICAgICAgdmVyaWZpZWQ6IHZlcmlmaWVkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9XG4gICk7XG5cbiAgLy8gUGVyZm9ybSBhbm90aGVyIGNoZWNrIGFmdGVyIHVwZGF0ZSwgaW4gY2FzZSBhIG1hdGNoaW5nIHVzZXIgaGFzIGJlZW5cbiAgLy8gaW5zZXJ0ZWQgaW4gdGhlIG1lYW50aW1lXG4gIHRyeSB7XG4gICAgYXdhaXQgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyhcbiAgICAgIFwiZW1haWxzLmFkZHJlc3NcIixcbiAgICAgIFwiRW1haWxcIixcbiAgICAgIG5ld0VtYWlsLFxuICAgICAgdXNlci5faWRcbiAgICApO1xuICB9IGNhdGNoIChleCkge1xuICAgIC8vIFVuZG8gdXBkYXRlIGlmIHRoZSBjaGVjayBmYWlsc1xuICAgIGF3YWl0IE1ldGVvci51c2Vycy51cGRhdGVBc3luYyhcbiAgICAgIHsgX2lkOiB1c2VyLl9pZCB9LFxuICAgICAgeyAkcHVsbDogeyBlbWFpbHM6IHsgYWRkcmVzczogbmV3RW1haWwgfSB9IH1cbiAgICApO1xuICAgIHRocm93IGV4O1xuICB9XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IFJlbW92ZSBhbiBlbWFpbCBhZGRyZXNzIGFzeW5jaHJvbm91c2x5IGZvciBhIHVzZXIuIFVzZSB0aGlzIGluc3RlYWQgb2YgdXBkYXRpbmdcbiAqIHRoZSBkYXRhYmFzZSBkaXJlY3RseS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbCBUaGUgZW1haWwgYWRkcmVzcyB0byByZW1vdmUuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5yZW1vdmVFbWFpbCA9XG4gIGFzeW5jICh1c2VySWQsIGVtYWlsKSA9PiB7XG4gICAgY2hlY2sodXNlcklkLCBOb25FbXB0eVN0cmluZyk7XG4gICAgY2hlY2soZW1haWwsIE5vbkVtcHR5U3RyaW5nKTtcblxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBnZXRVc2VyQnlJZCh1c2VySWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuICAgIGlmICghdXNlcilcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlVzZXIgbm90IGZvdW5kXCIpO1xuXG4gICAgYXdhaXQgTWV0ZW9yLnVzZXJzLnVwZGF0ZUFzeW5jKHsgX2lkOiB1c2VyLl9pZCB9LFxuICAgICAgeyAkcHVsbDogeyBlbWFpbHM6IHsgYWRkcmVzczogZW1haWwgfSB9IH0pO1xuICB9XG5cbi8vL1xuLy8vIENSRUFUSU5HIFVTRVJTXG4vLy9cblxuLy8gU2hhcmVkIGNyZWF0ZVVzZXIgZnVuY3Rpb24gY2FsbGVkIGZyb20gdGhlIGNyZWF0ZVVzZXIgbWV0aG9kLCBib3RoXG4vLyBpZiBvcmlnaW5hdGVzIGluIGNsaWVudCBvciBzZXJ2ZXIgY29kZS4gQ2FsbHMgdXNlciBwcm92aWRlZCBob29rcyxcbi8vIGRvZXMgdGhlIGFjdHVhbCB1c2VyIGluc2VydGlvbi5cbi8vXG4vLyByZXR1cm5zIHRoZSB1c2VyIGlkXG5jb25zdCBjcmVhdGVVc2VyID1cbiAgYXN5bmMgb3B0aW9ucyA9PiB7XG4gICAgLy8gVW5rbm93biBrZXlzIGFsbG93ZWQsIGJlY2F1c2UgYSBvbkNyZWF0ZVVzZXJIb29rIGNhbiB0YWtlIGFyYml0cmFyeVxuICAgIC8vIG9wdGlvbnMuXG4gICAgY2hlY2sob3B0aW9ucywgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcbiAgICAgIHVzZXJuYW1lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgZW1haWw6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICBwYXNzd29yZDogTWF0Y2guT3B0aW9uYWwocGFzc3dvcmRWYWxpZGF0b3IpXG4gICAgfSkpO1xuXG4gICAgY29uc3QgeyB1c2VybmFtZSwgZW1haWwsIHBhc3N3b3JkIH0gPSBvcHRpb25zO1xuICAgIGlmICghdXNlcm5hbWUgJiYgIWVtYWlsKVxuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwiTmVlZCB0byBzZXQgYSB1c2VybmFtZSBvciBlbWFpbFwiKTtcblxuICAgIGNvbnN0IHVzZXIgPSB7IHNlcnZpY2VzOiB7fSB9O1xuICAgIGlmIChwYXNzd29yZCkge1xuICAgICAgY29uc3QgaGFzaGVkID0gYXdhaXQgaGFzaFBhc3N3b3JkKHBhc3N3b3JkKTtcbiAgICAgIGNvbnN0IGFyZ29uMkVuYWJsZWQgPSBBY2NvdW50cy5fYXJnb24yRW5hYmxlZCgpO1xuICAgICAgaWYgKGFyZ29uMkVuYWJsZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIHVzZXIuc2VydmljZXMucGFzc3dvcmQgPSB7IGJjcnlwdDogaGFzaGVkIH07XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdXNlci5zZXJ2aWNlcy5wYXNzd29yZCA9IHsgYXJnb24yOiBoYXNoZWQgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgQWNjb3VudHMuX2NyZWF0ZVVzZXJDaGVja2luZ0R1cGxpY2F0ZXMoeyB1c2VyLCBlbWFpbCwgdXNlcm5hbWUsIG9wdGlvbnMgfSk7XG4gIH07XG5cbi8vIG1ldGhvZCBmb3IgY3JlYXRlIHVzZXIuIFJlcXVlc3RzIGNvbWUgZnJvbSB0aGUgY2xpZW50LlxuTWV0ZW9yLm1ldGhvZHMoXG4gIHtcbiAgICBjcmVhdGVVc2VyOiBhc3luYyBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGFyZ3NbMF07XG4gICAgICByZXR1cm4gYXdhaXQgQWNjb3VudHMuX2xvZ2luTWV0aG9kKFxuICAgICAgICB0aGlzLFxuICAgICAgICBcImNyZWF0ZVVzZXJcIixcbiAgICAgICAgYXJncyxcbiAgICAgICAgXCJwYXNzd29yZFwiLFxuICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgLy8gY3JlYXRlVXNlcigpIGFib3ZlIGRvZXMgbW9yZSBjaGVja2luZy5cbiAgICAgICAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgICAgICAgIGlmIChBY2NvdW50cy5fb3B0aW9ucy5mb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24pXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiU2lnbnVwcyBmb3JiaWRkZW5cIilcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCB1c2VySWQgPSBhd2FpdCBBY2NvdW50cy5jcmVhdGVVc2VyVmVyaWZ5aW5nRW1haWwob3B0aW9ucyk7XG5cbiAgICAgICAgICAvLyBjbGllbnQgZ2V0cyBsb2dnZWQgaW4gYXMgdGhlIG5ldyB1c2VyIGFmdGVyd2FyZHMuXG4gICAgICAgICAgcmV0dXJuIHsgdXNlcklkOiB1c2VySWQgfTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4vKipcbiAqIEBzdW1tYXJ5IENyZWF0ZXMgYW4gdXNlciBhc3luY2hyb25vdXNseSBhbmQgc2VuZHMgYW4gZW1haWwgaWYgYG9wdGlvbnMuZW1haWxgIGlzIGluZm9ybWVkLlxuICogVGhlbiBpZiB0aGUgYHNlbmRWZXJpZmljYXRpb25FbWFpbGAgb3B0aW9uIGZyb20gdGhlIGBBY2NvdW50c2AgcGFja2FnZSBpc1xuICogZW5hYmxlZCwgeW91J2xsIHNlbmQgYSB2ZXJpZmljYXRpb24gZW1haWwgaWYgYG9wdGlvbnMucGFzc3dvcmRgIGlzIGluZm9ybWVkLFxuICogb3RoZXJ3aXNlIHlvdSdsbCBzZW5kIGFuIGVucm9sbG1lbnQgZW1haWwuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyBvYmplY3QgdG8gYmUgcGFzc2VkIGRvd24gd2hlbiBjcmVhdGluZ1xuICogdGhlIHVzZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLnVzZXJuYW1lIEEgdW5pcXVlIG5hbWUgZm9yIHRoaXMgdXNlci5cbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmVtYWlsIFRoZSB1c2VyJ3MgZW1haWwgYWRkcmVzcy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLnBhc3N3b3JkIFRoZSB1c2VyJ3MgcGFzc3dvcmQuIFRoaXMgaXMgX19ub3RfXyBzZW50IGluIHBsYWluIHRleHQgb3ZlciB0aGUgd2lyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLnByb2ZpbGUgVGhlIHVzZXIncyBwcm9maWxlLCB0eXBpY2FsbHkgaW5jbHVkaW5nIHRoZSBgbmFtZWAgZmllbGQuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICogKi9cbkFjY291bnRzLmNyZWF0ZVVzZXJWZXJpZnlpbmdFbWFpbCA9XG4gIGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgb3B0aW9ucyA9IHsgLi4ub3B0aW9ucyB9O1xuICAgIC8vIENyZWF0ZSB1c2VyLiByZXN1bHQgY29udGFpbnMgaWQgYW5kIHRva2VuLlxuICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IGNyZWF0ZVVzZXIob3B0aW9ucyk7XG4gICAgLy8gc2FmZXR5IGJlbHQuIGNyZWF0ZVVzZXIgaXMgc3VwcG9zZWQgdG8gdGhyb3cgb24gZXJyb3IuIHNlbmQgNTAwIGVycm9yXG4gICAgLy8gaW5zdGVhZCBvZiBzZW5kaW5nIGEgdmVyaWZpY2F0aW9uIGVtYWlsIHdpdGggZW1wdHkgdXNlcmlkLlxuICAgIGlmICghdXNlcklkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY3JlYXRlVXNlciBmYWlsZWQgdG8gaW5zZXJ0IG5ldyB1c2VyXCIpO1xuXG4gICAgLy8gSWYgYEFjY291bnRzLl9vcHRpb25zLnNlbmRWZXJpZmljYXRpb25FbWFpbGAgaXMgc2V0LCByZWdpc3RlclxuICAgIC8vIGEgdG9rZW4gdG8gdmVyaWZ5IHRoZSB1c2VyJ3MgcHJpbWFyeSBlbWFpbCwgYW5kIHNlbmQgaXQgdG9cbiAgICAvLyB0aGF0IGFkZHJlc3MuXG4gICAgaWYgKG9wdGlvbnMuZW1haWwgJiYgQWNjb3VudHMuX29wdGlvbnMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKSB7XG4gICAgICBpZiAob3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgICBhd2FpdCBBY2NvdW50cy5zZW5kVmVyaWZpY2F0aW9uRW1haWwodXNlcklkLCBvcHRpb25zLmVtYWlsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IEFjY291bnRzLnNlbmRFbnJvbGxtZW50RW1haWwodXNlcklkLCBvcHRpb25zLmVtYWlsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXNlcklkO1xuICB9O1xuXG4vLyBDcmVhdGUgdXNlciBkaXJlY3RseSBvbiB0aGUgc2VydmVyLlxuLy9cbi8vIFVubGlrZSB0aGUgY2xpZW50IHZlcnNpb24sIHRoaXMgZG9lcyBub3QgbG9nIHlvdSBpbiBhcyB0aGlzIHVzZXJcbi8vIGFmdGVyIGNyZWF0aW9uLlxuLy9cbi8vIHJldHVybnMgUHJvbWlzZTx1c2VySWQ+IG9yIHRocm93cyBhbiBlcnJvciBpZiBpdCBjYW4ndCBjcmVhdGVcbi8vXG4vLyBYWFggYWRkIGFub3RoZXIgYXJndW1lbnQgKFwic2VydmVyIG9wdGlvbnNcIikgdGhhdCBnZXRzIHNlbnQgdG8gb25DcmVhdGVVc2VyLFxuLy8gd2hpY2ggaXMgYWx3YXlzIGVtcHR5IHdoZW4gY2FsbGVkIGZyb20gdGhlIGNyZWF0ZVVzZXIgbWV0aG9kPyBlZywgXCJhZG1pbjpcbi8vIHRydWVcIiwgd2hpY2ggd2Ugd2FudCB0byBwcmV2ZW50IHRoZSBjbGllbnQgZnJvbSBzZXR0aW5nLCBidXQgd2hpY2ggYSBjdXN0b21cbi8vIG1ldGhvZCBjYWxsaW5nIEFjY291bnRzLmNyZWF0ZVVzZXIgY291bGQgc2V0P1xuLy9cblxuQWNjb3VudHMuY3JlYXRlVXNlckFzeW5jID0gY3JlYXRlVXNlclxuXG4vLyBDcmVhdGUgdXNlciBkaXJlY3RseSBvbiB0aGUgc2VydmVyLlxuLy9cbi8vIFVubGlrZSB0aGUgY2xpZW50IHZlcnNpb24sIHRoaXMgZG9lcyBub3QgbG9nIHlvdSBpbiBhcyB0aGlzIHVzZXJcbi8vIGFmdGVyIGNyZWF0aW9uLlxuLy9cbi8vIHJldHVybnMgdXNlcklkIG9yIHRocm93cyBhbiBlcnJvciBpZiBpdCBjYW4ndCBjcmVhdGVcbi8vXG4vLyBYWFggYWRkIGFub3RoZXIgYXJndW1lbnQgKFwic2VydmVyIG9wdGlvbnNcIikgdGhhdCBnZXRzIHNlbnQgdG8gb25DcmVhdGVVc2VyLFxuLy8gd2hpY2ggaXMgYWx3YXlzIGVtcHR5IHdoZW4gY2FsbGVkIGZyb20gdGhlIGNyZWF0ZVVzZXIgbWV0aG9kPyBlZywgXCJhZG1pbjpcbi8vIHRydWVcIiwgd2hpY2ggd2Ugd2FudCB0byBwcmV2ZW50IHRoZSBjbGllbnQgZnJvbSBzZXR0aW5nLCBidXQgd2hpY2ggYSBjdXN0b21cbi8vIG1ldGhvZCBjYWxsaW5nIEFjY291bnRzLmNyZWF0ZVVzZXIgY291bGQgc2V0P1xuLy9cblxuQWNjb3VudHMuY3JlYXRlVXNlciA9IEFjY291bnRzLmNyZWF0ZVVzZXJBc3luYztcblxuLy8vXG4vLy8gUEFTU1dPUkQtU1BFQ0lGSUMgSU5ERVhFUyBPTiBVU0VSU1xuLy8vXG5hd2FpdCBNZXRlb3IudXNlcnMuY3JlYXRlSW5kZXhBc3luYygnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLnRva2VuJyxcbiAgeyB1bmlxdWU6IHRydWUsIHNwYXJzZTogdHJ1ZSB9KTtcbmF3YWl0IE1ldGVvci51c2Vycy5jcmVhdGVJbmRleEFzeW5jKCdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC50b2tlbicsXG4gIHsgdW5pcXVlOiB0cnVlLCBzcGFyc2U6IHRydWUgfSk7XG5hd2FpdCBNZXRlb3IudXNlcnMuY3JlYXRlSW5kZXhBc3luYygnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsLnRva2VuJyxcbiAgeyB1bmlxdWU6IHRydWUsIHNwYXJzZTogdHJ1ZSB9KTtcblxuIl19
