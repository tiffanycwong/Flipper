'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var Minilesson = require( './minilesson.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'pages' ] );

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
 * @param {Array.<object>} pages - list of Page objects in the current page
 * @param {number} count - total number of Page objects across all pages
 */

/**
 * Gets a list of Page objects.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.minilesson_id - Minilesson._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Page object in the page
 * @param {number} [data.limit=0] - number of Page objects in a page
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    var userCriteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true }
    } );

    var listCriteria = Utils.validateObject( data, {
      minilesson_id: { type: 'string', required: true }
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
        default: { 'position': 1 }
      }
    } ).sort;

    var find = function ( query, projection ) {

      // Get from database
      db.pages.count( query, function ( err, count ) {
        if ( err ) {
          done( err, [], 0 );
        } else {
          db.pages
            .find( query, projection )
            .sort( sort )
            .skip( data.offset || 0 )
            .limit( data.limit || 0, function ( err, pages ) {
              if ( err ) {
                done( err, [], 0 );
              } else {

                // Return list of pages
                done( null, pages, count );

              }
            } );
        }
      } );

    };

    // Ensure user is associated with the minilesson
    Minilesson.get(
      {
        _id: listCriteria.minilesson_id,
        user_id: userCriteria.user_id,
        projection: {
          states: false,
          timestamps: false
        }
      },
      function ( err ) {
        if ( err ) {
          done( err, [], 0 );
        } else {
          find( listCriteria, projection );
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
 * @param {object} page - Page object
 * @param {object} course - Course object if a valid user_id was provided
 */

/**
 * Gets a Page object.
 *
 * @param {object} data - data
 * @param {string} data._id - Page._id
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
      db.pages.findOne( query, projection, function ( err, page ) {
        if ( err ) {
          done( err );
        } else if ( page ) {
          done( null, page );
        } else {
          done( new Error( 'Page not found.' ), null );
        }
      } );
    };

    // Ensure valid page
    findOne( { _id: criteria._id }, projection, function ( err, page ) {
      if ( err ) {
        done( err, null, null );
      } else if ( criteria.user_id ) {

        // Ensure user is associated with page's minilesson
        Minilesson.get(
          {
            _id: page.minilesson_id,
            user_id: criteria.user_id
          },
          function ( err, minilesson, course ) {
            if ( err ) {
              done( err, null, null );
            } else {

              // Teachers can see all pages
              done( null, page, course, minilesson );

            }
          }
        );

      } else {
        done( null, page, null );
      }
    } );

  } catch ( err ) {
    done( err, null, null );
  }
}

/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} page - Page object
 */

/**
 * Adds a Page.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {string} data.minilesson_id - Minilesson._id
 * @param {string} data.title - title of page
 * @param {string} [data.resource] - resource link
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true },
      minilesson_id: { type: 'string', required: true }
    } );

    var insertData = Utils.validateObject( data, {
      minilesson_id: { type: 'string', required: true },
      title: { type: 'string', filter: 'trim', required: true },
      resource: { type: 'string', filter: 'trim' }
    } );

    // TODO: VALIDATE RESOURCE

    // Ensure user is associated with page's minilesson
    Minilesson.get(
      {
        _id: criteria.minilesson_id,
        user_id: criteria.user_id,
        projection: {
          states: false,
          timestamps: false
        }
      },
      function ( err, minilesson, course ) {
        if ( err ) {
          done( err, null );
        } else if ( course.teaching ) {

          // Only teachers can add pages
          insertData.timestamps = { created: new Date() };

          // Insert into database
          db.pages.insert( insertData, function ( err, page ) {
            if ( err ) {
              done( err, null );
            } else {

              // Get the new page object the proper way
              get( { _id: page._id }, done );

            }
          } );

        } else {
          done( new Error( 'Only teachers can add pages to minilessons.' ), null );
        }
      }
    );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback removePageCallback
 * @param {Error} err - Error object
 * @param {object} page - Page object before removal
 */

/**
 * Removes a page from the database.
 *
 * @param {object} data -
 * @param {*} data._id - Page._id
 * @param {string} [data.user_id] - User._id of teacher
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.timestamps] -
 * @param {removePageCallback} done - callback
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

    // Ensure valid page
    get( criteria, function ( err, page, course ) {
      if ( err ) {
        done( err, null );
      } else if ( course.teaching ) {

        // Remove from database
        db.pages.remove( { _id: page._id }, true, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {
            done( null, page );
          }
        } );

      } else {

        // Students may not remove pages
        done( new Error( 'Only a teacher of the course may remove its pages.' ), null );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}
