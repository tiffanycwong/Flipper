/**
 * Created by akashkrishnan on 23-Nov-15.
 */

'use strict';

var Utils = require( '../../models/utils.js' );
var Submission = require( '../../models/submission.js' );

module.exports = function ( app ) {

  app.get( '/api/submissions/:submission_id', apiSubmissionGet );

};

/**
 * Called to get the specified Submission object associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiSubmissionGet( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Get mcq
    Submission.get(
      {
        _id: req.params.submission_id,
        user_id: req.user._id,
        projection: {
          timestamps: false
        }
      },
      Utils.safeFn( function ( err, submission ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( submission );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}
