'use strict';

var Submission = require("../models/submission.js");
var assert = require( 'assert' );
var Setup = require("./setup/submission.js");

var Config = require( '../config.js' );
var util = require( 'util' );
var mongojs = require( 'mongojs' );
var db = mongojs( Config.services.db.mongodb.uri );

describe( "Submissions", function () {
  var scope = {};
  before(Setup(scope));

  after(function (done) {
    db.dropDatabase(done);
  });

  describe( '#add()', function () {
    context( 'all valid entries, before due date', function () {
      it( 'should add a submission to the database', function ( done ) {
        Submission.add( scope.submissionData, function ( err ) {
          if ( err ) {
            throw err;
          }
          done();
        } );
      } );
    } );
    context( 'submission after due date', function () {
      it( 'should throw error', function () {
        assert.throws( function () {
          scope.submissionData.mcq_id = String(mcqYesterday._id);
          MCQ.add( mcqData, function ( err ) {
            scope.submissionData.mcq_id = String(mcqMonth._id);
            if ( err ) {
              throw err;
            }
          } );
        }, Error, 'Error Thrown' );
      } );
    } );
    context( 'duplicate subissions', function () {
      it( 'should throw error', function (done) {

            Submission.add(scope.submissionData, function(err) {
              if (err) {
                done();
              } else {
                done(true);
              }
          });
      } );
    } );
    context( 'Teaching trying to answer question', function () {
      it( 'should throw an error', function (done) {
        scope.submissionData.user_id = String(scope.teacher._id);
        Submission.add(scope.submissionData, function(err) {
          scope.submissionData.user_id = String(scope.student._id);
          if (err) {
            done();
          } else {
            done(true);
          }
          
        });
      } );
    } );
    context( 'User not associated with mcq', function () {
      it( 'should throw an error', function (done) {
        scope.submissionData.user_id = String(scope.student2._id);
        Submission.add(scope.submissionData, function(err) {
          scope.submissionData.user_id = String(scope.student._id);
          if (err) {
            done();
          } else {
            done(true);
          }
        });
      } );
    } );
    context( 'provided answer not a valid answer choice', function () {
      it( 'should throw an error', function ( done ) {
        scope.submissionData.answer = "banana";
        Submission.add(scope.submissionData, function(err) {
          scope.submissionData.answer = scope.answer;
          if (err) {
            return done();
          }
          done(true);
        });
      } );
    } );
    context( 'missing answer', function () {
      it( 'should throw an error', function (done) {
        
          delete scope.submissionData.answer;
          Submission.add(scope.submissionData, function ( err ) {
            scope.submissionData.answer = scope.answer;
            if ( err ) {
              return done();
            }
            done(true);
      } );
    } );
  } );
    context( 'missing userID', function () {
      it( 'should throw an error', function (done) {
        
          delete scope.submissionData.user_id;
          Submission.add(scope.submissionData, function ( err ) {
            scope.submissionData.user_id = String(scope.student._id);
            if ( err ) {
              return done();
            }
            done(true);
      } );
    } );
  } );
  describe( '#get()', function () {
    context( 'given valid id', function () {
      it( 'should get the submission from database', function (done) {
        Submission.add( scope.submissionData, function ( err, submission ) {
          if ( err ) {
            return done();
          }
          Submission.get( submission, function ( err, submissionReturned ) {
            if ( err ) {
              return done()
            }
            assert( submissionReturned._id );
          } );
        } );
      } );
    } );
    context( 'given no id property', function () {
      it( 'should throw an error', function (done) {
          Submission.get( {}, function ( err ) {
            if ( err ) {
              return done();
            }
            done(true);
          } );
        });
      } );
    } );
  describe( '#getMCQGrades()', function () {
    context( 'given all valid', function () {
      it( 'should get the submission from database', function (done) {
        Submission.getMCQGrades( scope.submissionData, function ( err, submission ) {
          if ( err ) {
            return done();
          }
          Submission.get( submission, function ( err, submissionReturned ) {
            if ( err ) {
              return done()
            }
            assert( submissionReturned._id );
          } );
        } );
      } );
    } );
    context( 'given no id property', function () {
      it( 'should throw an error', function (done) {
          Submission.getMCQGrades( {}, function ( err ) {
            if ( err ) {
              return done();
            }
            done(true);
          } );
        });
      } );
    } );
  } );
} );
