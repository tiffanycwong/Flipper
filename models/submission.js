/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var Mcq = require( './mcq.js' );
var User = require( './user.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'submissions' ] );

// TODO: INDEXES

module.exports = {

  /* ---------------EXTERNAL--------------- */

  list: list,
  get: get,
  add: add,
  getMCQGrades: getMCQGrades
};

/**
 * @callback listSubmissionsCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} submissions - list of Submission objects in the current page
 * @param {number} count - total number of Submission objects across all pages
 */

/**
 * Gets a list of Submission objects.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.mcq_id - Mcq._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Mcq object in the page
 * @param {number} [data.limit=0] - number of Mcq objects in a page
 * @param {listSubmissionsCallback} done - callback
 */
function list( data, done ) {
  try {

    var userCriteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true }
    } );

    var listCriteria = Utils.validateObject( data, {
      mcq_id: { type: 'string', required: true }
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

    var sort = Utils.validateObject( data, {
      sort: {
        type: {},
        default: { 'timestamps.created': 1 }
      }
    } ).sort;

    var find = function ( query, projection ) {

      // Get from database
      db.submissions.count( query, function ( err, count ) {
        if ( err ) {
          done( err, [], 0 );
        } else {
          db.submissions
            .find( query, projection )
            .sort( sort )
            .skip( data.offset || 0 )
            .limit( data.limit || 0, function ( err, submissions ) {
              if ( err ) {
                done( err, [], 0 );
              } else {
                expandSubmissionUsers( submissions, function () {

                  // Return list of submissions
                  done( null, submissions, count );

                } );
              }
            } );
        }
      } );

    };

    // Ensure user is associated with the mcq
    Mcq.get(
      {
        _id: listCriteria.mcq_id,
        user_id: userCriteria.user_id,
        projection: {
          timestamps: false
        }
      },
      function ( err, mcq, course ) {
        if ( err ) {
          done( err, [], 0 );
        } else if ( course.teaching ) {

          // Teachers get a list of student submissions
          find( listCriteria, projection );

        } else {

          // Students only get their submissions
          listCriteria.user_id = userCriteria.user_id;
          find( listCriteria, projection );

        }
      }
    );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback getSubmissionCallback
 * @param {Error} err - Error object
 * @param {object} submission - Submission object
 * @param {object} course - Course object if a valid user_id was provided
 */

/**
 * Gets a Submission object.
 *
 * @param {object} data - data
 * @param {string} data._id - Submission._id
 * @param {string} [data.user_id] - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {getSubmissionCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      user_id: { type: 'string' }
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

    var findOne = function ( query, projection, done ) {
      db.submissions.findOne( query, projection, function ( err, submission ) {
        if ( err ) {
          done( err, null );
        } else if ( submission ) {

          // Replace user id with user object
          if ( submission.user_id ) {

            User.get(
              {
                _id: submission.user_id,
                projection: {
                  timestamps: false
                }
              },
              Utils.safeFn( function ( err, user ) {
                submission.user = user || {};
                done( null, submission );
              } )
            );

          } else {
            done( null, submission );
          }

        } else {
          done( new Error( 'Submission not found.' ), null );
        }
      } );
    };

    // Ensure valid submission
    findOne( { _id: criteria._id }, projection, function ( err, submission ) {
      if ( err ) {
        done( err, null, null );
      } else if ( criteria.user_id ) {

        // We want to figure out if the user_id is a teacher
        Mcq.get(
          {
            _id: submission.mcq_id,
            user_id: criteria.user_id,
            projection: {
              timestamps: false
            }
          },
          function ( err, mcq, course ) {
            if ( err ) {
              done( err, null, null );
            } else if ( course.teaching ) {

              // Teachers can see all submissions
              done( null, submission, course );

            } else if ( submission.user_id === criteria.user_id ) {

              // User is a student, so we make sure the user_id matches
              done( null, submission, course );

            } else {
              done( new Error( 'Submission not found.' ), null, null );
            }
          }
        );

      } else {
        done( null, submission, null );
      }
    } );

  } catch ( err ) {
    done( err, null, null );
  }
}

/**
 * @callback addSubmissionCallback
 * @param {Error} err - Error object
 * @param {object} submission - Submission object
 */

/**
 * Adds a submission.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.mcq_id - Mcq._id
 * @param {string} data.answer - answer
 * @param {addSubmissionCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      mcq_id: { type: 'string', required: true }
    } );

    var insertData = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      mcq_id: { type: 'string', required: true },
      answer: { type: 'string', required: true }
    } );

    // Ensure submission doesn't already exist
    db.submissions.count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, null );
      } else if ( count ) {
        done( new Error( 'You can only submit once.' ), null );
      } else {

        // Ensure user is associated with mcq
        Mcq.get(
          {
            _id: criteria.mcq_id,
            user_id: criteria.user_id,
            projection: {
              timestamps: false
            }
          },
          function ( err, mcq, course, minilesson ) {
            if ( err ) {
              done( err, null );
            } else if ( mcq.answers.indexOf( insertData.answer ) === -1 ) {
              done( new Error( 'Provided answer is not a valid answer choice.' ), null );
            } else if ( course.teaching ) {

              // Teachers cannot answers mcqs associated with the courses they teach
              done( new Error( 'Only students can answer an mcq.' ), null );

            } else if ( minilesson.timestamps.due_date && (+minilesson.timestamps.due_date < +new Date()) ) {
              done( new Error( 'It is too late to submit an answer.' ), null );
            } else {

              console.log( minilesson.timestamps.due_date );
              console.log( new Date() );

              insertData.score = insertData.answer === mcq.answer ? 1 : 0;
              insertData.timestamps = { created: new Date() };

              // Insert into database
              db.submissions.insert( insertData, function ( err, submission ) {
                if ( err ) {
                  done( err, null );
                } else {

                  // Get the new submission object the proper way
                  get( { _id: submission._id }, done );

                }
              } );

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
 * @callback getMCQGradesCallback
 * @param {Error} err - Error object
 * @param {object} grades object - Name and grades object
 */

/**
 * Gets mcq grades as object
 * of name and grade pairs.
 * Grade is 0 if incorrect. 1 if correct.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.mcq_id - Mcq._id
 * @param {getMCQGradesCallback} done - callback
 */

function getMCQGrades( data , done ) {
  try{


    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      mcq_id: { type: 'string', required: true }
    } );

    list( criteria, function ( err, submissions ) {
      if ( err ) {
        done( err, null );
      } else {
        var grades = {};

        /**
         * Replaces student ids with user objects in submissions.
         *
         * @param {Array.<Object>} submissions - list of Submission objects
         * @param {function()} done - callback
         */
        var processSubmissions = function ( submissions, done ) {

          // Loop through courses
          (function nextSubmission( i, n ) {
            if ( i < n ) {

              var submission = submissions[ i ];

              if ( submission.user_id ) {

                User.get(
                  {
                    _id: submission.user_id,
                    projection: {
                      timestamps: false
                    }
                  },
                  Utils.safeFn( function ( err, user ) {
                    grades[ user.name ] = submission.score;
                    nextSubmission( i + 1, n );
                  } )
                );

              } else {
                nextSubmission( i + 1, n );
              }

            } else {
              done();
            }
          })( 0, submissions.length );

        };

        processSubmissions( submissions, function () {

          // Return results
          done( null, grades );

        } );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback expandSubmissionUsersCallback
 */

/**
 * Replaces user ids with user objects in submissions.
 *
 * @param {Array.<Object>} submissions - list of Submission objects
 * @param {expandSubmissionUsersCallback} done - callback
 */
function expandSubmissionUsers( submissions, done ) {
  if ( submissions ) {

    // Loop through submissions
    (function nextSubmission( i, n ) {
      if ( i < n ) {

        var submission = submissions[ i ];

        if ( submission.user_id ) {

          User.get(
            {
              _id: submission.user_id,
              projection: {
                timestamps: false
              }
            },
            Utils.safeFn( function ( err, user ) {
              submission.user = user || {};
              nextSubmission( i + 1, n );
            } )
          );

        } else {
          nextSubmission( i + 1, n );
        }

      } else {
        done();
      }
    })( 0, submissions.length );

  } else {
    done();
  }
}
