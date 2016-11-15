'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var User = require( './user.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'courses' ] );

// TODO: INDEXES

module.exports = {

  /* ---------------EXTERNAL--------------- */

  list: list,
  listForTeacher: listForTeacher,
  listForStudent: listForStudent,
  listForPendingStudent: listForPendingStudent,
  listOpen: listOpen,

  exists: exists,

  get: get,
  getWithUser: getWithUser,

  add: add,
  join: join,
  acceptStudent: acceptStudent,
  declineStudent: declineStudent,


  /* ---------------INTERNAL--------------- */

  expandCourseUsers: expandCourseUsers

};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} teacherCourses - list of Course objects
 * @param {Array.<object>} studentCourses - list of Course objects
 * @param {Array.<object>} pendingCourses - list of Course objects
 * @param {Array.<object>} openCourses - list of Course objects
 */

/**
 * Gets a list of Course objects associated with the specified user.
 *
 * @param {object} data - data
 * @param {string} data.teacher_id - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      user_id: { type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
          states: { type: 'boolean' },
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    // Get courses the user teaches
    listForTeacher(
      {
        teacher_id: criteria.user_id,
        projection: projection
      },
      Utils.safeFn( function ( err, teacherCourses ) {
        if ( err ) {
          done( err, [], [], [], [] );
        } else {

          // Get courses the user takes
          listForStudent(
            {
              student_id: criteria.user_id,
              projection: projection
            },
            Utils.safeFn( function ( err, studentCourses ) {
              if ( err ) {
                done( err, [], [], [], [] );
              } else {

                // Get courses where the user is pending
                listForPendingStudent(
                  {
                    student_id: criteria.user_id,
                    projection: projection
                  },
                  Utils.safeFn( function ( err, pendingCourses ) {
                    if ( err ) {
                      done( err, [], [], [], [] );
                    } else {

                      // Get courses that are open to join
                      listOpen(
                        {
                          user_id: criteria.user_id,
                          projection: projection
                        },
                        Utils.safeFn( function ( err, openCourses ) {
                          if ( err ) {
                            done( err, [], [], [], [] );
                          } else {
                            done( null, teacherCourses, studentCourses, pendingCourses, openCourses );
                          }
                        } )
                      );

                    }
                  } )
                );

              }
            } )
          );

        }
      } )
    );

  } catch ( err ) {
    done( err, [], [], [], [] );
  }
}

/**
 * @callback listForTeacherCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} courses - list of Course objects in the current page
 * @param {number} count - total number of Course objects across all pages
 */

/**
 * Gets a list of Course objects with the specified teacher.
 *
 * @param {object} data - data
 * @param {string} data.teacher_id - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Course object in the page
 * @param {number} [data.limit=0] - number of Course objects in a page
 * @param {listForTeacherCallback} done - callback
 */
function listForTeacher( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      teacher_id: { name: 'teachers', type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
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
        default: { name: 1 }
      }
    } ).sort;

    db.courses.count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, [], 0 );
      } else {
        db.courses
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 )
          .limit( data.limit || 0, function ( err, courses ) {
            if ( err ) {
              done( err, [], 0 );
            } else {
              expandCourseUsers( courses, function () {

                // Return list of courses
                done( null, courses, count );

              } );
            }
          } );
      }
    } );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback listForStudentCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} courses - list of Course objects in the current page
 * @param {number} count - total number of Course objects across all pages
 */

/**
 * Gets a list of Course objects with the specified student.
 *
 * @param {object} data - data
 * @param {string} data.student_id - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Course object in the page
 * @param {number} [data.limit=0] - number of Course objects in a page
 * @param {listForStudentCallback} done - callback
 */
function listForStudent( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      student_id: { name: 'students', type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
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
        default: { name: 1 }
      }
    } ).sort;

    db.courses.count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, [], 0 );
      } else {
        db.courses
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 )
          .limit( data.limit || 0, function ( err, courses ) {
            if ( err ) {
              done( err, [], 0 );
            } else {
              expandCourseUsers( courses, function () {

                // Return list of courses
                done( null, courses, count );

              } );
            }
          } );
      }
    } );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback listForPendingStudentCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} courses - list of Course objects in the current page
 * @param {number} count - total number of Course objects across all pages
 */

/**
 * Gets a list of Course objects for which the specified student is a pending student.
 *
 * @param {object} data - data
 * @param {string} data.student_id - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Course object in the page
 * @param {number} [data.limit=0] - number of Course objects in a page
 * @param {listForPendingStudentCallback} done - callback
 */
function listForPendingStudent( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      student_id: { name: 'pendingStudents', type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
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
        default: { name: 1 }
      }
    } ).sort;

    db.courses.count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, [], 0 );
      } else {
        db.courses
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 )
          .limit( data.limit || 0, function ( err, courses ) {
            if ( err ) {
              done( err, [], 0 );
            } else {
              expandCourseUsers( courses, function () {

                // Return list of courses
                done( null, courses, count );

              } );
            }
          } );
      }
    } );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback listForJoinCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} courses - list of Course objects in the current page
 * @param {number} count - total number of Course objects across all pages
 */

/**
 * Gets a list of Course objects that are not associated with the specified user. Hence, these are the courses the
 * user can join.
 *
 * @param {object} data - data
 * @param {string} data.user_id - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset of first Course object in the page
 * @param {number} [data.limit=0] - number of Course objects in a page
 * @param {listForJoinCallback} done - callback
 */
function listOpen( data, done ) {
  try {

    var userCriteria = Utils.validateObject( data, {
      user_id: { name: '_id', type: 'string', required: true }
    } );

    var criteria = {
      teachers: { $nin: [ userCriteria._id ] },
      students: { $nin: [ userCriteria._id ] },
      pendingStudents: { $nin: [ userCriteria._id ] }
    };

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
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
        default: { name: 1 }
      }
    } ).sort;

    // Ensure valid user_id
    User.get( userCriteria, function ( err ) {
      if ( err ) {
        done( err, [], 0 );
      } else {

        // Get from database
        db.courses.count( criteria, function ( err, count ) {
          if ( err ) {
            done( err, [], 0 );
          } else {
            db.courses
              .find( criteria, projection )
              .sort( sort )
              .skip( data.offset || 0 )
              .limit( data.limit || 0, function ( err, courses ) {
                if ( err ) {
                  done( err, [], 0 );
                } else {
                  expandCourseUsers( courses, function () {

                    // Return list of courses
                    done( null, courses, count );

                  } );
                }
              } );
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, [], 0 );
  }
}

/**
 * @callback existsCallback
 * @param {Error} err - Error object
 * @param {boolean} exists - whether or not course exists
 */

/**
 * Checks if a Course object exists.
 *
 * @param {object} data - data
 * @param {*} [data._id] - Course._id
 * @param {string} [data.name] - course name
 * @param {string} [data.teacher_id] - User._id of teacher
 * @param {string} [data.student_id] - User._id of student
 * @param {string} [data.pending_student_id] - User._id of pending student
 * @param {existsCallback} done - callback
 */
function exists( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId' },
      name: { type: 'string' },
      teacher_id: { name: 'teachers', type: 'string' },
      student_id: { name: 'students', type: 'string' },
      pending_student_id: { name: 'pendingStudents', type: 'string' }
    } );

    // Ensure there is at least one parameter
    if ( criteria._id || criteria.name || criteria.teachers || criteria.students || criteria.pendingStudents ) {

      // Get from database
      db.courses.count( criteria, function ( err, count ) {
        if ( err ) {
          done( err, false );
        } else {
          done( null, Boolean( count ) );
        }
      } );

    } else {
      done( new Error( 'Invalid parameters.' ), false );
    }

  } catch ( err ) {
    done( err, false );
  }
}

/**
 * @callback getCourseCallback
 * @param {Error} err - Error object
 * @param {object} course - Course object
 */

/**
 * Gets a Course object.
 *
 * @param {object} data - data
 * @param {*} [data._id] - Course._id
 * @param {string} [data.name] - name of course
 * @param {string} [data.teacher_id] - User._id of teacher
 * @param {string} [data.student_id] - User._id of student
 * @param {string} [data.pending_student_id] - User._id of pending student
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {getCourseCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId' },
      name: { type: 'string' },
      teacher_id: { name: 'teachers', type: 'string' },
      student_id: { name: 'students', type: 'string' },
      pending_student_id: { name: 'pendingStudents', type: 'string' }
    } );
    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
          states: { type: 'boolean' },
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    // Ensure there is at least one parameter
    if ( criteria._id || criteria.name || criteria.teachers || criteria.students || criteria.pendingStudents ) {

      // Get from database
      db.courses.findOne( criteria, projection, function ( err, course ) {
        if ( err ) {
          done( err, null );
        } else if ( course == null ) {
          done (new Error( 'Course does not exist'), null);
        } else {
          expandUsers( course.teachers, function () {
            expandUsers( course.students, function () {
              expandUsers( course.pendingStudents, function () {
                done( null, course );
              } );
            } );
          } );
        }
      } );

    } else {
      done( new Error( 'Invalid parameters.' ), null );
    }

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback getWithUserCallback
 * @param {Error} err - Error object
 * @param {object} course - Course object
 */

/**
 * Gets a Course object with the specified user.
 *
 * @param {object} data - data
 * @param {*} data._id - Course._id
 * @param {string} data.user_id - User._id
 * @param {object} [data.projection] - projection
 * @param {boolean} [data.projection.teachers] -
 * @param {boolean} [data.projection.students] -
 * @param {boolean} [data.projection.pendingStudents] -
 * @param {boolean} [data.projection.states] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {getWithUserCallback} done - callback
 */
function getWithUser( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      user_id: { type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          teachers: { type: 'boolean' },
          students: { type: 'boolean' },
          pendingStudents: { type: 'boolean' },
          states: { type: 'boolean' },
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {}
      }
    } ).projection;

    // Check if user is a teacher
    db.courses.count(
      {
        _id: criteria._id,
        teachers: criteria.user_id
      },
      function ( err, count ) {
        if ( err ) {
          done( err, null );
        } else if ( count ) {

          // Get the Course object
          get(
            {
              _id: criteria._id,
              projection: projection
            },
            function ( err, course ) {
              if ( err ) {
                done( err, null );
              } else {
                course.teaching = true;
                done( null, course );
              }
            }
          );

        } else {

          // Check if user is a student
          db.courses.count(
            {
              _id: criteria._id,
              students: criteria.user_id
            },
            function ( err, count ) {
              if ( err ) {
                done( err, null );
              } else if ( count ) {

                // Get the Course object
                get(
                  {
                    _id: criteria._id,
                    projection: projection
                  },
                  function ( err, course ) {
                    if ( err ) {
                      done( err, null );
                    } else {
                      course.taking = true;
                      done( null, course );
                    }
                  }
                );

              } else {
                done( new Error( 'Course not found.' ), null );
              }
            }
          );

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
 * @param {object} course - Course object
 */

/**
 * Adds a course.
 *
 * @param {object} data - data
 * @param {string} data.name - name of course
 * @param {string} data.teacher_id - User._id
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      name: { type: 'string', filter: 'trim', required: true },
      teacher_id: { type: 'string', required: true }
    } );

    // Ensure valid teacher_id
    User.get( { _id: criteria.teacher_id }, function ( err, user ) {
      if ( err ) {
        done( err, null );
      } else {

        // Ensure course with same name and teacher does not already exist
        exists(
          {
            name: criteria.name,
            teacher_id: criteria.teacher_id
          },
          function ( err, exists ) {
            if ( err ) {
              done( err, null );
            } else if ( exists ) {
              done( new Error( 'A course you teach with the specified name already exists.' ), null );
            } else {

              // Insert into database
              db.courses.insert(
                {
                  name: criteria.name,
                  teachers: [ user._id ],
                  students: [],
                  pendingStudents: [],
                  states: {
                    active: true
                  },
                  timestamps: {
                    created: new Date()
                  }
                },
                function ( err, course ) {
                  if ( err ) {
                    done( err, null );
                  } else {

                    // Get the new Course object the proper way
                    getWithUser( { _id: course._id, user_id: user._id }, done );

                  }
                }
              );

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
 * @callback joinCallback
 * @param {Error} err - Error object
 * @param {object} course - Course object before adding student
 */

/**
 * Adds a student to a course as pending.
 *
 * @param {object} data - data
 * @param {*} data._id - Course._id
 * @param {string} data.student_id - User._id
 * @param {joinCallback} done - callback
 */
function join( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      student_id: { type: 'string', required: true }
    } );

    // Ensure valid course
    get( { _id: criteria._id }, function ( err, course ) {
      if ( err ) {
        done( err, null );
      } else {

        // TODO: ENSURE STUDENT_ID IS NOT A TEACHER OF THE COURSE

        // Ensure student_id is not already a student of the course
        exists( { _id: criteria._id, student_id: criteria.student_id }, function ( err, _exists ) {
          if ( err ) {
            done( err, null );
          } else if ( _exists ) {
            done( new Error( 'User is already a student of the course.' ), null );
          } else {

            // Ensure student_id is not already a pending student of the course
            exists( { _id: criteria._id, pending_student_id: criteria.student_id }, function ( err, _exists ) {
              if ( err ) {
                done( err, null );
              } else if ( _exists ) {
                done( new Error( 'User is already pending admission to the course.' ), null );
              } else {
                // Add student to pending students list. Using $addToSet just in case of duplicates.
                db.courses.update(
                  {
                    _id: criteria._id
                  },
                  {
                    $addToSet: { pendingStudents: criteria.student_id }
                  },
                  {},
                  function ( err ) {
                    if ( err ) {
                      done( err, null );
                    } else {
                      done( null, course );
                    }
                  }
                );

              }
            } );

          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback declineStudentCallBack
 * @param {Error} err - Error object
 * @param {object} course - Course object before removing student
 */

/**
 * Removes a pending student from the pending list.
 *
 * @param {object} data - data
 * @param {*} data._id - Course._id
 * @param {string} data.teacher_id - User._id
 * @param {string} data.student_id - User._id
 * @param {declineStudentCallBack} done - callback
 */
function declineStudent( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      teacher_id: { type: 'string', required: true },
      student_id: { type: 'string', required: true }
    } );

    // Ensure teacher_id is a teacher of the course
    getWithUser( { _id: criteria._id, user_id: criteria.teacher_id }, function ( err, course ) {
      if ( err ) {
        done( err, null );
      } else if ( course.teaching ) {

        // Ensure student_id is a pending student in the course
        get( { _id: criteria._id, pending_student_id: criteria.student_id }, function ( err, course ) {
          if ( err ) {
            done( err, null );
          } else {

            // remove student from pending students list.
            db.courses.update(
              {
                _id: criteria._id,
                pendingStudents: criteria.student_id
              },
              {
                $pull: { pendingStudents: criteria.student_id }
              },
              {},
              function ( err ) {
                if ( err ) {
                  done( err, null );
                } else {
                  done( null, course );
                }
              }
            );

          }
        } );

      } else {
        done( new Error( 'Only a teacher of the course can add a student.' ), null );
      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback acceptStudentCallback
 * @param {Error} err - Error object
 * @param {object} course - Course object before adding student
 */

/**
 * Adds a student to a course.
 *
 * @param {object} data - data
 * @param {*} data._id - Course._id
 * @param {string} data.teacher_id - User._id
 * @param {string} data.student_id - User._id
 * @param {acceptStudentCallback} done - callback
 */
function acceptStudent( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      teacher_id: { type: 'string', required: true },
      student_id: { type: 'string', required: true }
    } );

    // Ensure teacher_id is a teacher of the course
    getWithUser( { _id: criteria._id, user_id: criteria.teacher_id }, function ( err, course ) {
      if ( err ) {
        done( err, null );
      } else if ( course.teaching ) {

        // Ensure student_id is a pending student in the course
        get( { _id: criteria._id, pending_student_id: criteria.student_id }, function ( err, course ) {
          if ( err ) {
            done( err, null );
          } else {
            // Add pending student to students list and remove student from pending students list. $addToSet is
            // important because we don't want to have duplicates
            db.courses.update(
              {
                _id: criteria._id,
                pendingStudents: criteria.student_id
              },
              {
                $addToSet: { students: criteria.student_id },
                $pull: { pendingStudents: criteria.student_id }
              },
              {},
              function ( err ) {
                if ( err ) {
                  done( err, null );
                } else {
                  done( null, course );
                }
              }
            );

          }
        } );

      } else {
        done( new Error( 'Only a teacher of the course can add a student.' ), null );
      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback expandCourseUsersCallback
 */

/**
 * Replaces user ids with user objects in courses.
 *
 * @param {Array.<Object>} courses - list of Course objects
 * @param {expandCourseUsersCallback} done - callback
 */
function expandCourseUsers( courses, done ) {
  if ( courses ) {

    // Loop through courses
    ( function nextCourse( i, n ) {
      if ( i < n ) {

        var course = courses[ i ];

        expandUsers( course.teachers, function () {
          expandUsers( course.students, function () {
            expandUsers( course.pendingStudents, function () {
              nextCourse( i + 1, n );
            } );
          } );
        } );

      } else {
        done();
      }
    } )( 0, courses.length );

  } else {
    done();
  }
}

/**
 * @callback expandUsersCallback
 */

/**
 * Replaces user ids with user objects in courses.
 *
 * @param {Array.<string>} list - list of User._id
 * @param {expandUsersCallback} done - callback
 */
function expandUsers( list, done ) {
  if ( list ) {

    // Loop through user ids
    ( function next( i, n ) {
      if ( i < n ) {

        // Get User object
        User.get(
          {
            _id: list[ i ],
            projection: {
              timestamps: false
            }
          },
          Utils.safeFn( function ( err, user ) {
            list[ i ] = user || {};
            next( i + 1, n );
          } )
        );

      } else {
        done();
      }
    } )( 0, list.length );

  } else {
    done();
  }
}
