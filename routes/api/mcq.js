/**
 * Created by akashkrishnan on 23-Nov-15.
 */

'use strict';

var Utils = require( '../../models/utils.js' );
var User = require( '../../models/user.js' );
var Mcq = require( '../../models/mcq.js' );
var Submission = require( '../../models/submission.js' );

module.exports = function ( app ) {

  app.get( '/api/mcqs/:mcq_id', apiMcqGet );
  app.delete( '/api/mcqs/:mcq_id', apiMcqRemove );
  app.get( '/api/mcqs/:mcq_id/submissions', apiSubmissionList );
  app.post( '/api/mcqs/:mcq_id/submissions', apiSubmissionAdd );
  app.get( '/api/mcqs/:mcq_id/grades', apiMcqGrades );

};

/**
 * Called to get the specified Mcq object associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMcqGet( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Get mcq
    Mcq.get(
      {
        _id: req.params.mcq_id,
        user_id: req.user._id,
        projection: {
          timestamps: false
        }
      },
      Utils.safeFn( function ( err, mcq ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( mcq );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to remove the specified Mcq object associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMcqRemove( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Remove mcq
    Mcq.remove(
      {
        _id: req.params.mcq_id,
        user_id: req.user._id,
        projection: {
          timestamps: false
        }
      },
      Utils.safeFn( function ( err, mcq ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( mcq );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to get a list of Submission objects associated with the specified mcq and the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiSubmissionList( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce certain values
    req.body.user_id = req.user._id;
    req.body.mcq_id = req.params.mcq_id;
    req.body.projection = { timestamps: false };

    // Get list of submissions
    Submission.list( req.body, Utils.safeFn( function ( err, submissions ) {
      if ( err ) {
        res.json( { err: err } );
      } else {

        // Return results to client
        res.json( submissions );

      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a user wants to add a submission to an MCQ.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiSubmissionAdd( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce some invariants
    req.body.user_id = req.user._id;
    req.body.mcq_id = req.params.mcq_id;

    // Add submission
    Submission.add( req.body, Utils.safeFn( function ( err, submission ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( submission );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a user wants to view all grades of an MCQ.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMcqGrades( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce some invariants
    req.body.user_id = req.user._id;
    req.body.mcq_id = req.params.mcq_id;

    Submission.getMCQGrades( req.body, function ( err, grades ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( grades );
      }
    } );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}
