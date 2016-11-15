/**
 * Created by akashkrishnan on 23-Nov-15.
 */

'use strict';

var Utils = require( '../../models/utils.js' );
var Page = require( '../../models/page.js' );
var Mcq = require( '../../models/mcq.js' );

module.exports = function ( app ) {

  app.get( '/api/pages/:page_id', apiPageGet );
  app.delete( '/api/pages/:page_id', apiPageRemove );
  app.get( '/api/pages/:page_id/mcqs', apiMcqList );
  app.post( '/api/pages/:page_id/mcqs', apiMcqAdd );

};

/**
 * Called to get the specified Page object associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiPageGet( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Get page
    Page.get(
      {
        _id: req.params.page_id,
        user_id: req.user._id,
        projection: {
          timestamps: false
        }
      },
      Utils.safeFn( function ( err, page ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( page );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to remove the specified Page object associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiPageRemove( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Remove page
    Page.remove(
      {
        _id: req.params.page_id,
        user_id: req.user._id,
        projection: {
          timestamps: false
        }
      },
      Utils.safeFn( function ( err, page ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( page );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to get a list of Mcq objects associated with the specified page and the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMcqList( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce certain values
    req.params.user_id = req.user._id;
    req.params.projection = { timestamps: false };

    // Get list of minilessons
    Mcq.list( req.params, Utils.safeFn( function ( err, mcqs ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( mcqs );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a user wants to add a new MCQ to a page.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMcqAdd( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce some invariants
    req.body.user_id = req.user._id;
    req.body.page_id = req.params.page_id;

    // Add mcq
    Mcq.add( req.body, Utils.safeFn( function ( err, mcq ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( mcq );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}
