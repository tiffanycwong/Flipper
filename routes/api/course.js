/**
 * Created by akashkrishnan on 23-Nov-15.
 */

'use strict';

var Utils = require( '../../models/utils.js' );
var Course = require( '../../models/course.js' );
var Minilesson = require( '../../models/minilesson.js' );

module.exports = function ( app ) {

  require( './user.js' )( app );

  app.get( '/api/courses', apiCourseList );
  app.post( '/api/courses', apiCourseAdd );

  app.get( '/api/courses/:course_id', apiCourseGet );
  app.post( '/api/courses/:course_id/join', apiCourseJoin );
  app.post( '/api/courses/:course_id/approve', apiCourseApprove );
  app.post( '/api/courses/:course_id/decline', apiCourseDecline );

  app.get( '/api/courses/:course_id/minilessons', apiMinilessonList );
  app.post( '/api/courses/:course_id/minilessons', apiMinilessonAdd );

};

/**
 * Called to get a list of Courses objects associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiCourseList( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Get courses the user teaches
    Course.list(
      {
        user_id: req.user._id,
        projection: {
          students: false,
          timestamps: false,
          states: false
        }
      },
      Utils.safeFn( function ( err, teacherCourses, studentCourses, pendingCourses, openCourses ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( {
            teaching: teacherCourses,
            taking: studentCourses,
            pending: pendingCourses,
            open: openCourses
          } );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to get the specified Course object associated with the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiCourseGet( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Get course
    Course.get(
      {
        _id: req.params.course_id,
        projection: {
          students: false,
          timestamps: false,
          states: false
        }
      },
      Utils.safeFn( function ( err, course ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( course );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a user wants to add a new course.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiCourseAdd( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce certain values
    req.body.teacher_id = req.user._id;

    // Add course
    Course.add( req.body, Utils.safeFn( function ( err, course ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( course );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a student wants to join a new course.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiCourseJoin( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce certain values
    req.body._id = req.params.course_id;
    req.body.student_id = req.user._id;

    // Add course
    Course.join( req.body, Utils.safeFn( function ( err, course ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( course );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}


/**
 * Called to when a teacher wants to approve a student to a course.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiCourseApprove( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure certain values
    req.body._id = req.params.course_id;
    req.body.teacher_id = req.user._id;

    Course.acceptStudent( req.body, Utils.safeFn( function ( err, course ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( course );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a teacher wants to decline a student request to a course.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiCourseDecline( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure certain values
    req.body._id = req.params.course_id;
    req.body.teacher_id = req.user._id;

    Course.declineStudent( req.body, Utils.safeFn( function ( err, course ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( course );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to get a list of Minilesson objects associated with the specified course and the authenticated user.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMinilessonList( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Enforce certain values
    req.params.user_id = req.user._id;

    // Get list of minilessons
    Minilesson.list( req.params, Utils.safeFn( function ( err, minilessons ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( minilessons );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

/**
 * Called to when a user wants to add a new minilesson to a course.
 *
 * @param {object} req - req
 * @param {object} res - res
 */
function apiMinilessonAdd( req, res ) {

  // Ensure user
  if ( req.user ) {


    req.body.course_id = req.params.course_id;
    req.body.user_id = req.user._id;
    // Add minilesson
    Minilesson.add(
      req.body,
      Utils.safeFn( function ( err, minilesson ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.json( minilesson );
        }
      } )
    );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}
