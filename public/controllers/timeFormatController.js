/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

( function () {

  var update = function () {

    var spans = document.querySelectorAll( 'span[time]' );

    forEach( spans, function ( span ) {
      var d = new Date( span.getAttribute( 'time' ) );
      var m = moment( d );
      span.innerHTML = 'Due ' + m.fromNow() + '.';
    } );

  };

  update();

  setInterval( update, 10000 );

} )();
