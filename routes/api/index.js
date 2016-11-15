/**
 * Created by akashkrishnan on 19-Nov-15.
 * Last modified by akashkrishnan on 19-Nov-15 01:10.
 */

'use strict';

module.exports = function ( app ) {

  require( './user.js' )( app );
  require( './course.js' )( app );
  require( './minilesson.js' )( app );
  require( './page.js' )( app );
  require( './mcq.js' )( app );
  require( './submission.js' )( app );

};
