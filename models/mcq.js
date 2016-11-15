'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var Page = require( './page.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'mcqs' ] );

// TODO: INDEXES

module.exports = {

  list: list,
  get: get,
  add: add,
  remove: remove

};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} mcqs - list of Mcq objects in the current page
 * @param {number} count - total number of Mcq objects across all pages
 */

/**
 * Gets a list of Mcq objects.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.page_id - Page._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Mcq object in the page
 * @param {number} [data.limit=0] - number of Mcq objects in a page
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    var userCriteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true }
    } );

    var listCriteria = Utils.validateObject( data, {
      page_id: { type: 'string', required: true }
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

    var find = function ( query, projection, done ) {

      // Get from database
      db.mcqs.count( query, function ( err, count ) {
        if ( err ) {
          done( err, [], 0 );
        } else {
          db.mcqs
            .find( query, projection )
            .sort( sort )
            .skip( data.offset || 0 )
            .limit( data.limit || 0, function ( err, mcqs ) {
              if ( err ) {
                done( err, [], 0 );
              } else {

                // Return list of mcqs
                done( null, mcqs, count );

              }
            } );
        }
      } );

    };

    // Ensure user is associated with the page
    Page.get(
      {
        _id: listCriteria.page_id,
        user_id: userCriteria.user_id,
        projection: {
          timestamps: false
        }
      },
      function ( err, page, course ) {
        if ( err ) {
          done( err, [], 0 );
        } else {

          // Get mcqs
          find( listCriteria, projection, function ( err, mcqs, count ) {
            if ( err ) {
              done( err, [], 0 );
            } else if ( course.teaching ) {
              done( null, mcqs, count );
            } else {

              // We need to check if student has answered the questions

              var Submission = require( './submission.js' );

              // Loop through mcqs
              (function next( i, n ) {
                if ( i < n ) {

                  var mcq = mcqs[ i ];

                  // Get submission associated with mcq and user_id
                  // TODO: IMPL AND USE EXIST METHOD
                  Submission.list(
                    {
                      user_id: userCriteria.user_id,
                      mcq_id: mcq._id.toString()
                    },
                    function ( err, submissions, count ) {

                      mcq.submitted = Boolean( !err && count );

                      if ( mcq.submitted ) {
                        mcq.submittedAnswer = submissions[ 0 ].answer;
                      }

                      next( i + 1, n );

                    }
                  );

                } else {
                  done( null, mcqs, count );
                }
              })( 0, mcqs.length );

            }
          } );

        }
      }
    );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback getCallback
 * @param {Error} err - Error object
 * @param {object} mcq - Mcq object
 * @param {object} course - Course object if a valid user_id was provided
 */

/**
 * Gets an Mcq object.
 *
 * @param {object} data - data
 * @param {*} data._id - Mcq._id
 * @param {string} [data.user_id] - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {getCallback} done - callback
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
      db.mcqs.findOne( query, projection, function ( err, page ) {
        if ( err ) {
          done( err );
        } else if ( page ) {
          done( null, page );
        } else {
          done( new Error( 'Mcq not found.' ), null );
        }
      } );
    };

    // Ensure valid mcq
    findOne( { _id: criteria._id }, projection, function ( err, mcq ) {
      if ( err ) {
        done( err, null, null );
      } else if ( criteria.user_id ) {

        // Ensure user is associated with mcq's page
        Page.get(
          {
            _id: mcq.page_id,
            user_id: criteria.user_id,
            projection: {
              timestamps: false
            }
          },
          function ( err, page, course, minilesson ) {
            if ( err ) {
              done( err, null, null );
            } else {
              done( null, mcq, course, minilesson );
            }
          }
        );

      } else {
        done( null, mcq, null );
      }
    } );

  } catch ( err ) {
    done( err, null, null );
  }
}

/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} mcq - Mcq object
 */

/**
 * Adds an mcq.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.page_id - Page._id
 * @param {string} data.question - question
 * @param {Array.<string>} data.answers - answer choices
 * @param {number} data.answer - index of answer choice that is correct
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      page_id: { type: 'string', required: true }
    } );

    var insertData = Utils.validateObject( data, {
      page_id: { type: 'string', required: true },
      question: { type: 'string', required: true },
      answers: { required: true },
      answer: { type: 'string', required: true }
    } );

    if ( ( new Set( insertData.answers ) ).size !== insertData.answers.length ) {
      return done( new Error( 'Answer choices must be unique.' ), null );
    }

    if ( insertData.answers.length ) {
      if ( insertData.question.length ) {
        if ( insertData.answers instanceof Array ) {
          // Make sure answer is a valid answer choice
          if ( insertData.answers.indexOf( insertData.answer ) === -1 ) {
            done( new Error( 'Provided answer is not a valid answer choice.' ), null );
          } else {

            // Ensure user is associated with mcq's page
            Page.get(
              {
                _id: criteria.page_id,
                user_id: criteria.user_id,
                projection: {
                  timestamps: false
                }
              },
              function ( err, page, course ) {
                if ( err ) {
                  done( err, null );
                } else if ( course.teaching ) {

                  // Only teachers can add pages
                  insertData.timestamps = { created: new Date() };

                  // Insert into database
                  db.mcqs.insert( insertData, function ( err, mcq ) {
                    if ( err ) {
                      done( err, null );
                    } else {

                      // Get the new mcq object the proper way
                      get( { _id: mcq._id }, done );

                    }
                  } );

                } else {
                  done( new Error( 'Only teachers can add mcqs to pages.' ), null );
                }
              }
            );

          }

        } else {
          done( new Error( 'Expected array for property: answers.' ), null );
        }
      } else {
        done( new Error( 'Expected non-zero length question.' ), null );
      }
    } else {
      done( new Error( 'Expected more than 1 answer choices.' ), null );
    }

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback removeMcqCallback
 * @param {Error} err - Error object
 * @param {object} mcq - Mcq object before removal
 */

/**
 * Removes an mcq from the database.
 *
 * @param {object} data - data
 * @param {*} data._id - Mcq._id
 * @param {string} [data.user_id] - User._id of teacher
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {removeMcqCallback} done - callback
 */
function remove( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      user_id: { type: 'string' }
    } );

    criteria.projection = Utils.validateObject( data, {
      projection: {
        type: {
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    // Ensure valid mcq
    get( criteria, function ( err, mcq, course ) {
      if ( err ) {
        done( err, null );
      } else if ( course.teaching ) {

        // Remove from database
        db.mcqs.remove( { _id: mcq._id }, true, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {
            done( null, mcq );
          }
        } );

      } else {

        // Students may not remove mcqs
        done( new Error( 'Only a teacher of the course may remove its mcqs.' ), null );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}
