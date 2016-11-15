/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

var Utils = require( '../models/utils.js' );
var Log = require( '../models/log.js' );
var Session = require( '../models/session.js' );
var User = require( '../models/user.js' );

module.exports = function ( name ) {
  return function ( req, res, next ) {

    // We require that the cookie-parser middleware is registered before this middleware
    if ( req.cookies ) {

      // Store apikey for convenience
      req.apikey = req.cookies[ name ];

      if ( req.apikey ) {

        // Ensure valid session
        Session.get( { _id: req.apikey }, Utils.safeFn( function ( err, session ) {
          if ( err ) {

            // The session doesn't exist or something went wrong. Either way, tell client to remove cookie
            res.clearCookie( name, {} );
            next();

          } else {

            // Store the session value for future use
            req.session = session;

            /**
             * Valid session; ensure valid user by seeing if we can update the active state.
             *
             * NOTE: a valid session doesn't guarantee the user is available
             */
            User.active( { _id: session.value }, Utils.safeFn( function ( err, user ) {
              if ( err ) {
                next();
              } else {

                /**
                 * Store the User object for convenience; this will serve as a valid authority.
                 *
                 * NOTE: Although the User object is stored, its data is subject to change, and we do not want to tempt
                 * developers to take shortcuts. It's best to query the User model for the latest data.
                 */
                req.user = user;

                next();

              }
            } ) );

          }
        } ) );

      } else {
        next();
      }

    } else {
      Log.error( 'Missing middleware: cookie-parser.' );
    }

  };
};
