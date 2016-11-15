'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var Course = require( './course.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'minilessons' ] );

// TODO: INDEXES

module.exports = {
  list: list,
  get: get,
  add: add,
  remove: remove,
  publish: publish,
  edit: edit
};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} minilessons - list of Minilesson objects in the current page
 * @param {number} count - total number of Minilesson objects across all pages
 */

/**
 * Gets a list of Minilesson objects.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.course_id - Course._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Minilesson object in the page
 * @param {number} [data.limit=0] - number of Minilesson objects in a page
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    var userCriteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true }
    } );

    var listCriteria = Utils.validateObject( data, {
      course_id: { type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          states: { type: 'boolean' },
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

    var find = function () {

      // Get from database
      db.minilessons.count( listCriteria, function ( err, count ) {
        if ( err ) {
          done( err, [], 0 );
        } else {
          db.minilessons
            .find( listCriteria, projection )
            .sort( sort )
            .skip( data.offset || 0 )
            .limit( data.limit || 0, function ( err, minilessons ) {
              if ( err ) {
                done( err, [], 0 );
              } else {

                // Return list of minilessons
                done( null, minilessons, count );

              }
            } );
        }
      } );

    };

    // Ensure user is in the course
    Course.getWithUser(
      {
        _id: listCriteria.course_id,
        user_id: userCriteria.user_id,
        projection: {
          teachers: false,
          students: false,
          states: false,
          timestamps: false
        }
      },
      function ( err, course ) {
        if ( err ) {
          done( err, [], 0 );
        } else if ( course.teaching ) {

          // Teachers can see all minilessons
          find();

        } else {

          // Students can only see published minilessons
          listCriteria[ 'states.published' ] = true;
          find();

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
 * @param {object} minilesson - Minilesson object
 * @param {object} course - Course object if valid user_id was provided
 */

/**
 * Gets a Minilesson object.
 *
 * @param {object} data - data
 * @param {string} data._id - Minilesson._id
 * @param {string} [data.user_id] - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.states] -
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
          states: { type: 'boolean' },
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    var findOne = function ( query, projection, done ) {
      db.minilessons.findOne( query, projection, function ( err, minilesson ) {
        if ( err ) {
          done( err );
        } else if ( minilesson ) {

          if ( minilesson.timestamps && minilesson.timestamps.due_date ) {
            minilesson.due_date_passed = Boolean( +minilesson.timestamps.due_date < +new Date() );
          }

          done( null, minilesson );

        } else {
          done( new Error( 'Minilesson not found.' ), null );
        }
      } );
    };

    // Ensure valid minilesson
    findOne( { _id: criteria._id }, projection, function ( err, minilesson ) {
      if ( err ) {
        done( err, null, null );
      } else if ( criteria.user_id ) {

        // Ensure user is in the course
        Course.getWithUser(
          {
            _id: minilesson.course_id,
            user_id: criteria.user_id,
            projection: {
              teachers: false,
              students: false,
              states: false,
              timestamps: false
            }
          },
          function ( err, course ) {
            if ( err ) {
              done( err, null, null );
            } else if ( course.teaching ) {

              // Teachers can see all minilessons
              done( null, minilesson, course );

            } else {

              // Students can only see published minilessons
              findOne( { _id: criteria._id, 'states.published': true }, projection, function ( err, minilesson ) {
                if ( err ) {
                  done( err, null, null );
                } else {
                  done( null, minilesson, course );
                }
              } );

            }
          }
        );

      } else {
        done( null, minilesson, null );
      }
    } );

  } catch ( err ) {
    done( err, null, null );
  }
}

/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} minilesson - newly created Minilesson object
 */

/**
 * Adds a minilesson.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.course_id - Course._id
 * @param {string} data.title - title of minilesson
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      course_id: { type: 'string', required: true },
      title: {
        type: 'string',
        filter: 'trim',
        required: true
      },
      due_date: {}
    } );

    // Ensure due_date is a valid date
    if ( criteria.due_date ) {
      if ( isNaN( new Date( criteria.due_date ).getTime() ) ) {
        return done( new Error( 'Invalid date.' ), null );
      } else {
        criteria.due_date = new Date( criteria.due_date );
      }
    }

    // Ensure user is teaching the course
    Course.getWithUser(
      {
        _id: criteria.course_id,
        user_id: criteria.user_id,
        projection: {
          teachers: false,
          students: false,
          states: false,
          timestamps: false
        }
      },
      function ( err, course ) {
        if ( err ) {
          done( err, null );
        } else if ( course.teaching ) {

          // Insert into database
          db.minilessons.insert(
            {
              course_id: criteria.course_id,
              title: criteria.title,
              states: {
                published: false
              },
              timestamps: {
                created: new Date(),
                due_date: criteria.due_date
              }
            },
            function ( err, minilesson ) {
              if ( err ) {
                done( err, null );
              } else {

                // Get the new minilesson object the proper way
                get( { _id: minilesson._id }, done );

              }
            }
          );

        } else {
          done( new Error( 'Only a teacher may add a minilesson to a course.' ), null );
        }
      }
    );

  } catch ( err ) {
    done( err, null );
  }
}


/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} minilesson - newly published Minilesson object
 */

/**
 * Publishes a minilesson.
 *
 * @param {object} data - data
 * @param {string} data.minilesson_id - id of published minilesson
 * @param {addCallback} done - callback
 */
function publish( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      course_id: { type: 'string', required: true },
      minilesson_id: { filter: 'MongoId', required: true }
    } );

    // Ensure user is teaching the course
    Course.getWithUser(
      {
        _id: criteria.course_id,
        user_id: criteria.user_id,
        projection: {
          teachers: false,
          students: false,
          states: false,
          timestamps: false
        }
      },
      function ( err, course ) {
        if ( err ) {
          done( err, null );
        } else if ( course.teaching ) {
          // Update in database
          db.minilessons.update(
            {
              _id: criteria.minilesson_id
            },
            {
              $set: { 'states.published': true }
            },
            function ( err, minilesson ) {
              if ( err ) {
                done( err, null );
              } else {
                done( null, minilesson );
              }
            }
          );
        } else {
          done( new Error( 'Only a teacher may publish a minilesson.' ), null );
        }
      }
    );

  } catch ( err ) {
    done( err, null );
  }
}


/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} minilesson - newly edited Minilesson object
 */

/**
 * Edits a minilesson.
 *
 * @param {object} data - data
 * @param {string} data.minilesson_id - id of published minilesson
 * @param {string} data.course_id - id of edited minilesson
 * @param {string} data.user_id - id of user editing minilesson
 * @param {string} data.title - id new title for minilesson
 * @param {string} data.dueDate - id of new due date for minilesson
 * @param {addCallback} done - callback
 */

function edit( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      course_id: { type: 'string', required: true },
      minilesson_id: { filter: 'MongoId', required: true },
      title: {
        type: 'string',
        filter: 'trim',
        required: true
      },
      due_date: {}
    } );

    // Ensure due_date is a valid date
    if ( criteria.due_date ) {
      if ( isNaN( new Date( criteria.due_date ).getTime() ) ) {
        return done( new Error( 'Invalid date.' ), null );
      } else {
        criteria.due_date = new Date( criteria.due_date );
      }
    }

    // Ensure user is teaching the course
    Course.getWithUser(
      {
        _id: criteria.course_id,
        user_id: criteria.user_id,
        projection: {
          teachers: false,
          students: false,
          states: false,
          timestamps: false
        }
      },
      function ( err, course ) {
        if ( err ) {
          done( err, null );
        } else if ( course.teaching ) {

          // Update in database
          db.minilessons.update(
            {
              _id: criteria.minilesson_id
            },
            {
              $set: { 'title': criteria.title, 'timestamps.due_date': criteria.due_date }
            },
            function ( err, minilesson ) {
              if ( err ) {
                done( err, null );
              } else {
                done( null, minilesson );
              }
            }
          );
        } else {
          done( new Error( 'Only a teacher may publish a minilesson.' ), null );
        }
      }
    );

  } catch ( err ) {
    done( err, null );
  }
}


/**
 * @callback removeMinilessonCallback
 * @param {Error} err - Error object
 * @param {object} minilesson - Minilesson object before removal
 */

/**
 * Removes a minilesson from the database.
 *
 * @param {object} data - data
 * @param {*} data._id - Minilesson._id
 * @param {string} [data.user_id] - User._id of teacher
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {removeMinilessonCallback} done - callback
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
          states: { type: 'boolean' },
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    // Ensure valid minilesson
    get( criteria, function ( err, minilesson, course ) {
      if ( err ) {
        done( err, null );
      } else if ( course.teaching ) {

        // Remove from database
        db.minilessons.remove( { _id: minilesson._id }, true, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {
            done( null, minilesson );
          }
        } );

      } else {

        // Students may not remove minilessons
        done( new Error( 'Only a teacher of the course may remove its minilessons.' ), null );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}
