'use strict';

var User = require('../../models/user.js');


module.exports = function(scope) {

	return function ( done ) {

  // Make sure user is set up
  (require( './user.js' )( scope ))( function () {
  	
	  User.add({
	  	name: 'Harini Suresh',
	    username: 'harinisuresh',
	    password: 'HaRiNi999!'
		}, function ( err, _user1 ) {
	      if ( err ) {
	        done( err );
	      } else {
	        scope.teacher = _user1;
	        User.add({
		    name: 'Tiffany Wong',
		    username: 'tiffanycwong',
		    password: 'Tiffany999!'
	  }, function ( err, _user2 ) {
	          if ( err ) {
	            done ( err );
	          } else {
	            scope.student = _user2;
	            User.add(scope.studentData2 = {
				    name: 'Alyssa Hacker',
				    username: 'aahack',
				    password: 'Alyssa999!'
	  			}, function ( err, _user3 ) {
	              if ( err ) {
	                done ( err );
	              } else {
	                scope.student2 = _user3;
	                done();
	              }
	          } );
	          }
	        } );
	      }
	    } );

    
  } );

};
}