'use strict';

var MCQ = require( '../models/mcq.js' );
var assert = require( 'assert' );
var Setup = require("./setup/mcq.js");

var Config = require( '../config.js' );
var util = require( 'util' );
var mongojs = require( 'mongojs' );
var db = mongojs( Config.services.db.mongodb.uri );

describe( 'MCQ', function () {
  var scope = {};
  before(Setup(scope));

  after(function (done) {
    db.dropDatabase(done);
  });
  
  describe( '#add()', function () {
    context( 'all valid entries', function () {
      it( 'should add an mcq to database', function ( done ) {
        MCQ.add( scope.mcqData, function ( err ) {
          if ( err ) {
            throw err;
          }
          done();
        } );
      } );
    } );
    context( 'empty string question', function () {
      it( 'should throw error', function () {
        assert.throws( function () {
          scope.mcqData.question = scope.emptyString;
          MCQ.add( scope.mcqData, function ( err ) {
            scope.mcqData.question = scope.question;
            if ( err ) {
              throw err;
            }
          } );
        }, Error, 'Error Thrown' );
      } );
    } );
    context( 'missing question', function () {
      it( 'should throw error', function () {
        assert.throws( function () {
          delete scope.mcqData.question;
          MCQ.add( scope.mcqData, function ( err ) {
            scope.mcqData.question = scope.question;
            if ( err ) {
              throw err;
            }
          } );
        }, Error, 'Error Thrown' );
      } );
    } );
    context( 'empty answerChoicesList ', function () {
      it( 'should throw an error', function () {
        assert.throws( function () {
          scope.mcqData.answers = scope.emptyList ;
          MCQ.add( mcqData, function ( err ) {
            scope.mcqData.answers = scope.manyChoiceList;
            if ( err ) {
              throw err;
            }
          } );
        } );
      } );
    } );
    context( 'one choice answerChoicesList ', function () {
      it( 'should add mcq to database', function ( done ) {
        scope.mcqData.answers = scope.oneChoiceList;
        MCQ.add( scope.mcqData, function ( err ) {
          scope.mcqData.answers = scope.manyChoiceList;
          if ( err ) {
            throw err;
          }
          done();
        } );
      } );
    } );
    context( 'missing answerChoicesList', function () {
      it( 'should throw an error', function () {
        assert.throws( function () {
          delete scope.mcqData.answers;
          MCQ.add( scope.mcqData, function ( err ) {
            scope.mcqData.answers = scope.manyChoiceList;
            if ( err ) {
              throw err;
            }
          } );
        } );
      } );
    } );
  } );
  describe( '#remove()', function () {
    context( 'existing object in db with given id', function () {
      it( 'should remove an mcq from database given valid id', function () {
        MCQ.add( scope.mcqData, function ( err, mcq ) {
          if ( err ) {
            throw err;
          }
          MCQ.remove( scope.mcq, function ( err ) {
            if ( err ) {
              throw err;
            }
          } );
        } );
      } );
    } );
    context( 'no id property', function () {
      it( 'should throw error', function () {
        assert.throws( function () {
          MCQ.remove( {}, function ( err ) {
            if ( err ) {
              throw err;
            }
          } );
        } );
      } );
    } );
  } );
  describe( '#get()', function () {
    context( 'given valid id', function () {
      it( 'should get the mcq from database', function () {
        MCQ.add( scope.mcqData, function ( err, mcq ) {
          if ( err ) {
            throw err;
          }
          MCQ.get(mcq, function ( err, mcqReturned ) {
            if ( err ) {
              throw err;
            }
            assert( mcqReturned._id );
          } );
        } );
      } );
    } );
    context( 'given no id property', function () {
      it( 'should throw an error', function () {
        assert.throws( function () {
          MCQ.get( {}, function ( err ) {
            if ( err ) {
              throw err;
            }
          } );
        }, Error, 'Error Thrown' );
      } );
    } );
  } );
} );
