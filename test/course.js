'use strict';

var Course = require( '../models/course.js' );
var Setup = require("./setup/course.js");
var assert = require( 'assert' );

var Config = require( '../config.js' );
var util = require( 'util' );
var mongojs = require( 'mongojs' );
var db = mongojs( Config.services.db.mongodb.uri );

describe( 'Courses', function () {
  var scope = {};
  var testCourse;

  before(Setup(scope));

  after(function (done) {
    db.dropDatabase(done);
  });
  // add a course
  describe( '#add()', function () {
    it( 'adds a new course', function ( done ) {
      Course.add( {name: 'Biology', teacher_id: scope.teacher._id}, function ( err, course ) {
        testCourse = course; 
        assert.equal( course.name, 'Biology' );
        assert.equal( course.teachers.length, 1);
        assert.equal( course.teachers[0]._id, scope.teacher._id)
        done();
      } );
    } );

    it( 'rejects course with same name', function ( done ) {
      Course.add( { name: 'Biology', teacher_id: scope.teacher._id }, function ( err, course ) {
        assert.notEqual( err, null );
        assert.equal( course, null );
        done();
      }
      );
    } );
  } );


  // exists
  describe( '#exists()', function () {
    it( 'checks if a course exists', function ( done ) {
      Course.exists( { name: 'Biology' }, function ( err, exists, courseId ) {
        assert.equal( exists, true );
        done();
      } );
    } );
  } );


  // get
  describe( '#get()', function () {
    it( 'gets a course by name', function ( done ) {
      Course.get( { name: 'Biology' }, function ( err, course ) {
        assert.equal( course.name, 'Biology' );
        done();
      } );
    } );

    it( 'gets a course by teacher', function ( done ) {
      var criteria = { teacher_id: scope.teacher._id };
      Course.get( criteria, function ( err, course ) {
        assert.equal( course.name, 'Biology' );
        done();
      } );
    } );

  } );


  // adding a student to course
  describe( '#join()', function () {
    it( 'adds a pending student', function ( done ) {
      Course.join( { _id: testCourse._id, student_id: scope.student._id }, function ( err, course ) {
        Course.get( { _id: course._id }, function ( err, updatedCourse ) {
          assert.equal( updatedCourse.name, 'Biology' );
          assert.equal( updatedCourse.pendingStudents.length, 1);
          assert.equal( updatedCourse.pendingStudents[0]._id, scope.student._id);
          done();
        } );
      } );
    } );
  } );


  // accept student
  describe( '#acceptStudent()', function () {
    it( 'does not accept a non-pending student', function ( done ) {      
      Course.acceptStudent( { _id: testCourse._id, teacher_id: scope.teacher._id, student_id: scope.student2._id }, function ( err, course ) {
        assert.equal( course, null );
        done();
      } );
    } );

    it( 'does not allow someone who is not the teacher to accept student', function ( done ) {      
      Course.acceptStudent( { _id: testCourse._id, teacher_id: scope.student2._id, student_id: scope.student2._id }, function ( err, course ) {
        assert.equal( course, null );
        done();
      } );
    } );

    it( 'accepts a student into a class', function ( done ) {
      Course.acceptStudent( { _id: testCourse._id, teacher_id: scope.teacher._id, student_id: scope.student._id }, function ( err, course ) {
        Course.get( { _id: course._id }, function ( err, updatedCourse ) {
          assert.equal( updatedCourse.name, 'Biology' );
          assert.equal( updatedCourse.pendingStudents.length, 0);
          assert.equal( updatedCourse.students.length, 1);
          assert.equal( updatedCourse.students[0]._id, scope.student._id);
          done();
        } );
      } );
    } );
  } );


  // decline student
  describe( '#declineStudent()', function () {

    it( 'declines a student from joining a class', function ( done ) {
      Course.join( { _id: testCourse._id, student_id: scope.student2._id }, function ( err, course ) {
        Course.declineStudent( { _id: testCourse._id, teacher_id: scope.teacher._id, student_id: scope.student2._id }, function ( err, course ) {
          Course.get( { _id: testCourse._id }, function ( err, updatedCourse ) {
            assert.equal( updatedCourse.pendingStudents.length, 0);
            assert.equal( updatedCourse.students.length, 1);
            assert.notEqual( updatedCourse.students[0]._id, scope.student2._id);
            done();
          } );
        } );
      } );
    } );

  } );

} );
