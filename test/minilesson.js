/**
 * Created by medra_000 on 11/18/2015.
 */

'use strict';

var Minilesson = require( '../models/minilesson.js' );
var assert = require( 'assert' );
var Setup = require("./setup/minilesson.js");


var Config = require( '../config.js' );
var util = require( 'util' );
var mongojs = require( 'mongojs' );
var db = mongojs( Config.services.db.mongodb.uri );



describe( 'Minilesson', function () {
  var scope = {};
  before(Setup(scope));
  
  after(function (done) {
    db.dropDatabase(done);
  });

  describe( '#add()', function () {
    context( 'all valid entries', function () {
      it( 'should add a minilesson to database', function ( done ) {
        Minilesson.add( scope.minilessonData, function ( err, _minilesson ) {
          if ( err ) {
            throw err;
          }
          scope.minilesson = _minilesson;
          done();
        } );
      } );
      it( 'should return callback with correct data', function () {
        assert.equal(scope.minilesson.course_id, scope.minilessonData.course_id);
        assert.equal(scope.minilesson.title, scope.minilessonData.title);
        assert.equal(scope.minilesson.timestamps.due_date, String(scope.minilessonData.due_date));
      } );
    } );
  } );

  describe( '#get()', function () {
    it( 'gets a minilesson by _id without error', function ( done ) {
      Minilesson.get( { _id: scope.minilesson._id }, done );
    } );
    it( 'should return minilesson with correct data in callback', function ( done ) {
      Minilesson.get( { _id: scope.minilesson._id }, function ( err, _minilesson ) {
        if ( err ) {
          done( err );
        } else {
          assert.equal( String(_minilesson._id), String(scope.minilesson._id) );
          assert.equal( String(_minilesson.course_id), String(scope.minilesson.course_id) );
          assert.equal( String(_minilesson.title), String(scope.minilesson.title) );
          assert.equal( String(_minilesson.timestamps.due_date), String(scope.minilesson.timestamps.due_date));
          assert.equal( String(_minilesson.states), String(scope.minilesson.states) );
          done();
        }
      } );
    } );
  } );

  describe('#edit', function(){
    it('should edit minilesson without error', function(done){
      scope.new_data = {
        user_id: scope.teacher._id,
        course_id: String(scope.course._id),
        minilesson_id: scope.minilesson._id,
        title:"New Title",
        due_date: new Date()
      };

      Minilesson.edit(scope.new_data, done);
    });
    it('edited minilesson should have correct data', function(done){
      scope.new_data = {
        user_id: scope.teacher._id,
        course_id: String(scope.course._id),
        minilesson_id: scope.minilesson._id,
        title:"New Title 2",
        due_date: new Date()
      };

      Minilesson.edit(scope.new_data, function(err, _minilessonEdit) {
        assert.equal( _minilessonEdit.ok, 1 );
        assert.equal( _minilessonEdit.nModified, 1 );
        assert.equal( _minilessonEdit.n, 1 );
        done();
      })
    })
  });

  describe('#publish', function(){
    it('should change state of minilesson to publish', function(done) {
      Minilesson.publish({
        minilesson_id: scope.minilesson._id,
        user_id: scope.teacher._id,
        course_id: String(scope.course._id)},
          function(err, _minilessonEdit){
            if(err){
              done(err);
            } else {
              assert.equal( _minilessonEdit.ok, 1 );
              assert.equal( _minilessonEdit.nModified, 1 );
              assert.equal( _minilessonEdit.n, 1 );
              done();
        }
      });
    });
    it('should return minilesson as published', function(done){
      Minilesson.get({_id: scope.minilesson._id}, function(err, _minilesson){
        if(err){
          done(err);
        } else {
          assert.equal(_minilesson.states.published, true);
          done();
        }
      });
    });
  });

  describe( '#remove', function () {
    context('all valid entries', function() {
      it('removes a Page to existing minilesson without error', function (done) {
        Minilesson.add(scope.minilessonData, function(err, _minilesson) {
          Minilesson.remove({_id: _minilesson._id, user_id: scope.minilessonData.user_id}, done);
        });
      });
    });
    context('missing minilesson _id', function(){
      it('should throw an error', function(done){
        Minilesson.add(scope.minilessonData, function(err){
          Minilesson.remove({user_id: scope.minilessonData.teacher_id}, function(err){
            if(err){
              done();
            } else {
              done(new Error("No Error Thrown"));
            }
          });
        });
      });
    });
  });
});