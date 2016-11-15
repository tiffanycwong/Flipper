/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );
var crypto = require( 'crypto' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'users' ] );

// TODO: INDEXES

module.exports = {

  /* ---------------EXTERNAL--------------- */

  list: list,
  exists: exists,
  get: get,
  add: add,
  sign: sign,
  active: active,


  /* ---------------INTERNAL--------------- */

  validateCredentials: validateCredentials

};

/**
 * @callback listUsersCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} users - list of User objects in the current page
 * @param {number} count - total number of User objects across all pages
 */

/**
 * Gets a list of User objects. Passwords and salts are not included.
 *
 * @param {object} data - data
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first User object in the page
 * @param {number} [data.limit=0] - number of User objects in a page
 * @param {listUsersCallback} done - callback
 */
function list( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {} );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    // Do not leak the salt or password
    projection.salt = false;
    projection.password = false;

    var sort = Utils.validateObject( data, {
      sort: {
        type: {},
        default: {}
      }
    } ).sort;

    sort.username = 1;

    db.users.count( function ( err, count ) {
      if ( err ) {
        done( err, [], 0 );
      } else {
        db.users
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 )
          .limit( data.limit || 0, function ( err, users ) {
            if ( err ) {
              done( err, [], 0 );
            } else {

              // Return list of users
              done( null, users, count );

            }
          } );
      }
    } );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback userExistsCallback
 * @param {Error} err - Error object
 * @param {boolean} user - true if user exists; false otherwise
 */

/**
 * Checks to see if a User object exists by _id or username.
 *
 * @param {object} data - data
 * @param {*} [data._id] - User._id
 * @param {string} [data.username] - User.username
 * @param {userExistsCallback} done - callback
 * @return {undefined} -
 */
function exists( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId' },
      username: { type: 'string' }
    } );

    // Handle different input combinations
    if ( criteria._id ) {
      delete criteria.username;
    } else if ( criteria.username ) {
      delete criteria._id;
    } else {
      return done( new Error( 'Invalid parameters.' ), false );
    }

    db.users.count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, false );
      } else {
        done( null, Boolean( count ) );
      }
    } );

  } catch ( err ) {
    done( err, false );
  }
}

/**
 * @callback getUserCallback
 * @param {Error} err - Error object
 * @param {object} user - User object
 */

/**
 * Gets a User object.
 *
 * @param {object} data - data
 * @param {*} [data._id] - User._id
 * @param {string} [data.username] - User.username
 * @param {string} [data.password] - User.password
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {getUserCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId' },
      username: { type: 'string' },
      password: { type: 'string' }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    /**
     * Called after criteria is validated and password has been validated if applicable.
     *
     * @param {object} criteria -
     */
    var next = function ( criteria ) {

      db.users.findOne( criteria, projection, function ( err, user ) {
        if ( err ) {
          done( err, null );
        } else if ( user ) {

          // Do not leak the salt or password
          delete user.salt;
          delete user.password;

          // Stringify the MongoId
          user._id = user._id.toString();

          done( null, user );

        } else {
          done( new Error( 'User not found.' ), null );
        }
      } );

    };

    // Handle different input combinations
    if ( criteria._id ) {

      // Delete unused criteria
      delete criteria.username;
      delete criteria.password;

      // We don't have any passwords to check; let's continue getting the user
      next( criteria );

    } else if ( criteria.username || criteria.password ) {

      // Delete unused criteria
      delete criteria._id;

      if ( criteria.password ) {

        // We're dealing with a password; we first need to retrieve the salt and password for the username
        db.users.findOne(
          {
            username: criteria.username
          },
          {
            _id: true,
            salt: true,
            password: true
          },
          function ( err, user ) {
            if ( err ) {
              done( err, null );
            } else if ( user ) {

              // User exists; let's generate the salted hash
              var sha256 = crypto.createHash( 'sha256' );
              sha256.update( user.salt + criteria.password );
              var saltedHash = sha256.digest( 'hex' );

              // Check if passwords match
              if ( saltedHash === user.password ) {

                // Passwords match; let's continue getting the user
                delete criteria.password;
                next( criteria );

              } else {
                done(
                  new Error(
                    'Invalid password provided for user: ' + JSON.stringify( { username: criteria.username } )
                  ),
                  null
                );
              }

            } else {
              done( new Error( 'User not found: [' + JSON.stringify( { username: criteria.username } ) ), null );
            }
          }
        );

      } else {

        // We're only dealing with an email; delete the unused password criteria and continue getting the user
        delete criteria.password;
        next( criteria );

      }

    } else {
      done( new Error( 'Invalid parameters.' ), null );
    }

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback addUserCallback
 * @param {Error} err - Error object
 * @param {object} user - newly created User object
 */

/**
 * Adds a user.
 *
 * @param {object} data - data
 * @param {string} data.name - User.name
 * @param {string} data.username - User.username
 * @param {string} data.password - User.password
 * @param {addUserCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      name: {
        type: 'string',
        filter: 'trim',
        required: true
      },
      username: {
        type: 'string',
        filter: 'trim',
        required: true
      },
      password: {
        type: 'string',
        filter: 'trim',
        required: true
      }
    } );

    // Make sure username and password are well-defined
    validateCredentials( criteria.name, criteria.username, criteria.password, function ( err ) {
      if ( err ) {
        done( err, null );
      } else {

        // Ensure username is unique
        exists( { username: criteria.username }, function ( err, _exists ) {
          if ( err ) {
            done( err, null );
          } else if ( _exists ) {
            done(
              new Error( 'User already exists: ' + JSON.stringify( { username: criteria.username } ) + '.' ),
              null
            );
          } else {
            try {

              // Generate cryptographically strong pseudo-random salt
              var salt = crypto.randomBytes( 256 / 8 ).toString( 'hex' );

              // Generate salted hash
              var sha256 = crypto.createHash( 'sha256' );
              sha256.update( salt + criteria.password );
              var saltedPasswordHash = sha256.digest( 'hex' );

              // Insert new user data into database
              db.users.insert(
                {
                  name: criteria.name,
                  username: criteria.username,
                  salt: salt,
                  password: saltedPasswordHash,
                  timestamps: {
                    created: new Date(),
                    last_signed: null,
                    signed: null,
                    active: null
                  }
                },
                function ( err, user ) {
                  if ( err ) {
                    done( err, null );
                  } else {

                    // Get the new user object the proper way
                    get( { _id: user._id }, done );

                  }
                }
              );

            } catch ( err ) {
              done( new Error( 'Unable to securely add user. Please try again.' ), null );
            }
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback signUserCallback
 * @param {Error} err - Error object
 * @param {object} user - User object after sign
 */

/**
 * Signs a user by updating the timestamps.last_sign, timestamps.sign, timestamps.active properties accordingly.
 *
 * @param {object} data - data
 * @param {signUserCallback} done - callback
 */
function sign( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true }
    } );

    // Ensure user exists; get timestamps.signed from User Object
    get( criteria, function ( err, user ) {
      if ( err ) {
        done( err, null );
      } else {

        // Sign user
        db.users.update(
          criteria,
          {
            $set: {
              'timestamps.last_signed': user.timestamps.signed
            },
            $currentDate: {
              'timestamps.signed': true,
              'timestamps.active': true
            }
          },
          {},
          function ( err ) {
            if ( err ) {
              done( err, null );
            } else {
              get( user, done );
            }
          }
        );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback activeUserCallback
 * @param {Error} err - Error object
 * @param {object} user - User object after sign
 */

/**
 * Updates user's timestamps.active date.
 *
 * @param {object} data - data
 * @param {activeUserCallback} done - callback
 */
function active( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true }
    } );

    // Ensure user exists
    get( criteria, function ( err, user ) {
      if ( err ) {
        done( err, null );
      } else {

        // Update active date
        db.users.update(
          criteria,
          {
            $currentDate: {
              'timestamps.active': true
            }
          },
          {},
          function ( err ) {
            if ( err ) {
              done( err, null );
            } else {
              get( user, done );
            }
          }
        );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback validateCredentialsCallback
 * @param {Error} err - Error object
 */

/**
 * Checks to make sure name, username, and password are well-defined and conform to the restrictions defined in the
 * config file.
 *
 * @param {string} name - User.name
 * @param {string} username - User.username
 * @param {string} password - User.password
 * @param {validateCredentialsCallback} done - callback
 */
function validateCredentials( name, username, password, done ) {
  try {

    var nameMinLength = Config.registration.name.length.min;
    var nameMaxLength = Config.registration.name.length.max;

    var usernameMinLength = Config.registration.username.length.min;
    var usernameMaxLength = Config.registration.username.length.max;
    var validUsername = new RegExp( Config.registration.username.regex.valid ).test( username );

    var passwordMinLength = Config.registration.password.length.min;
    var passwordMaxLength = Config.registration.password.length.max;
    var hasNumeral = new RegExp( Config.registration.password.regex.hasNumeral ).test( password );
    var hasUpper = new RegExp( Config.registration.password.regex.hasUpper ).test( password );
    var hasLower = new RegExp( Config.registration.password.regex.hasLower ).test( password );

    if ( name.length < nameMinLength ) {
      done( new Error( 'Name must contain at least ' + nameMinLength + ' characters.' ) );
    } else if ( name.length > nameMaxLength ) {
      done( new Error( 'Name must contain at most ' + nameMaxLength + ' characters.' ) );
    } else if ( username.length < usernameMinLength ) {
      done( new Error( 'Username must contain at least ' + usernameMinLength + ' characters.' ) );
    } else if ( username.length > usernameMaxLength ) {
      done( new Error( 'Username must contain at most ' + usernameMaxLength + ' characters.' ) );
    } else if ( !validUsername ) {
      done( new Error( 'Username contains invalid characters. Please use alphanumeric characters and underscores.' ) );
    } else if ( username === password ) {
      done( new Error( 'Password and email must be different.' ) );
    } else if ( password.length < passwordMinLength ) {
      done( new Error( 'Password must contain at least ' + passwordMinLength + ' characters.' ) );
    } else if ( password.length > passwordMaxLength ) {
      done( new Error( 'Password must contain at most ' + passwordMaxLength + ' characters.' ) );
    } else if ( !hasNumeral ) {
      done( new Error( 'Password must contain at least one (1) Arabic numeral (0-9).' ) );
    } else if ( !hasUpper ) {
      done( new Error( 'Password must contain at least one (1) uppercase English alphabet character (A-Z).' ) );
    } else if ( !hasLower ) {
      done( new Error( 'Password must contain at least one (1) lowercase English alphabet character (a-z).' ) );
    } else {
      done( null );
    }

  } catch ( err ) {
    done( err );
  }
}
