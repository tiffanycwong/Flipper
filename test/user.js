/**
 * Created by akashkrishnan on 11/17/15.
 */

'use strict';

var User = require( '../models/user.js' );
var assert = require( 'assert' );

describe( 'User', function () {

  var data = {
    name: 'Akash Krishnan',
    username: 'akashkrishnan',
    password: 'akashk16MIT!'
  };

  var user;

  describe( '#add()', function () {

    it( 'creates a new user without error', function ( done ) {

      User.add( data, function ( err, _user ) {
        if ( err ) {
          done( err );
        } else {
          user = _user;
          done();
        }
      } );

    } );

    it( 'user in callback should have correct data', function ( done ) {
      assert.equal( user.name, data.name );
      assert.equal( user.username, data.username );
      done();
    } );

  } );

  describe( '#get()', function () {

    it( 'gets a user by _id without error', function ( done ) {
      User.get( { _id: user._id }, done );
    } );

    it( 'user in callback should have correct data', function ( done ) {
      User.get( { _id: user._id }, function ( err, _user ) {
        if ( err ) {
          done( err );
        } else {
          assert.equal( _user._id, user._id );
          assert.equal( _user.name, user.name );
          assert.equal( _user.username, user.username );
          done();
        }
      } );
    } );

    it( 'gets a user by username and password without error', function ( done ) {
      User.get( { username: data.username, password: data.password }, done );
    } );

    it( 'user in callback should have correct data', function ( done ) {
      User.get( { username: data.username, password: data.password }, function ( err, _user ) {
        if ( err ) {
          done( err );
        } else {
          assert.equal( _user._id, user._id );
          assert.equal( _user.name, user.name );
          assert.equal( _user.username, user.username );
          done();
        }
      } );
    } );

    it( 'gets a user by username and invalid password with error', function ( done ) {
      User.get( { username: data.username, password: 'wrong password' }, function ( err, _user ) {
        if ( err ) {
          done();
        } else {
          done( new Error( 'Should have received an error.' ) );
        }
      } );
    } );

  } );


} );
