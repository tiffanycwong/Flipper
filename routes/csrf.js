'use strict';

var Log = require( '../models/log.js' );

module.exports = {
  validate: validate
};

function validate( app ) {

  app.all( '*', all );
  app.post( '*', checkToken );
  app.put( '*', checkToken );
  app.delete( '*', checkToken );

}

function all( req, res, next ) {
  res.set( 'Strict-Transport-Security', 'max-age=604800' );
  next();
}

function checkToken( req, res, next ) {

  // Only applicable to authenticated users
  if ( req.user ) {

    // Check for token
    if ( req.body.token ) {

      // Verify token against user session token
      if ( req.body.token === req.session.token ) {

        // LGTM AFAIK; remove token and move on
        delete req.body.token;
        next();

      } else {

        // All post, put, delete actions must contain a valid token
        Log.warn( 'Prevented possible CSRF attack.' );
        res.json( { err: 'Invalid token.' } );

      }

    } else {

      // All post, put, delete actions must contain a token
      Log.warn( 'Prevented possible CSRF attack.' );
      res.json( { err: 'Missing token.' } );

    }

  } else {
    next();
  }

}
