/**
 * Created by akashkrishnan on 23-Nov-15.
 */

'use strict';

var Config = require( '../../config.js' );
var Utils = require( '../../models/utils.js' );
var Session = require( '../../models/session.js' );
var User = require( '../../models/user.js' );

module.exports = function ( app ) {

  app.get( '/api/user.json', user );

  app.post( '/api/login', apiLogin );
  app.post( '/api/register', apiRegister );
  app.post( '/api/logout', apiLogout );

};

/**
 * Called to retrieve current user info.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function user( req, res ) {
  if ( req.user ) {
    res.json( req.user );
  } else {
    res.json( {} );
  }
}

/**
 * Called to authenticate a user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiLogin( req, res ) {

  // Ensure guest (i.e. no user)
  if ( req.user ) {
    res.status( 400 ).json( { err: 'Bad Request: User is already logged in.' } );
  } else {

    // Check if user exists with username and password
    User.get( req.body, Utils.safeFn( function ( err, user ) {
      if ( err ) {
        res.json( { err: 'Invalid Credentials' } );
      } else {

        // Add new session that persists indefinitely until logout
        Session.add( { value: user._id }, Utils.safeFn( function ( err, session ) {

          // Set cookies to be used for future authentication
          res.cookie( Config.web.cookie.name, session._id, { secure: true } );
          res.cookie( 'token', session.token, { secure: true } );

          if ( err ) {
            res.json( { err: err } );
          } else {

            // Update user stating that user has logged in
            User.sign( user, Utils.safeFn( function ( err ) {
              if ( err ) {
                res.json( { err: err } );
              } else {
                res.json( {} );
              }
            } ) );

          }

        } ) );

      }
    } ) );

  }

}

/**
 * Called to register an account.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiRegister( req, res ) {

  // Ensure guest (i.e. no user)
  if ( req.user ) {
    res.status( 400 ).json( { err: 'Bad Request: User must be anonymous to process request.' } );
  } else {

    // Register user by adding
    User.add( req.body, Utils.safeFn( function ( err ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( {} );
      }
    } ) );

  }

}

/**
 * Called to logout any authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiLogout( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Remove session
    Session.remove( { _id: req.apikey }, Utils.safeFn( function ( err ) {
      if ( err ) {
        res.json( { err: err } );
      } else {

        // Remove cookie
        res.clearCookie( Config.web.cookie.name, {} );
        res.clearCookie( 'token', {} );

        res.json( {} );

      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}
