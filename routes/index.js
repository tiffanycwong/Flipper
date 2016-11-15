/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

var Log = require( '../models/log.js' );

module.exports = function ( app ) {

  require( './csrf.js' ).validate( app );
  require( './navigation.js' )( app );
  require( './api' )( app );

  app.get( '*', otherwise );

};

/**
 * Called when no routes were matched.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function otherwise( req, res ) {
  Log.info( 'Received bad request: ' + req.originalUrl );
  res.redirect( '/' );
}
