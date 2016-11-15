/**
 * Created by akashkrishnan on 11/17/15.
 */

'use strict';

toastr.options = {
  progressBar: true,
  positionClass: 'toast-bottom-left',
  timeOut: 5000,
  extendedTimeOut: 2000
};

var DEBUG = false;

var flipper = Flipper();

var forEach = function ( array, callback, scope ) {
  for ( var i = 0, n = array.length; i < n; i++ ) {
    callback.call( scope, array[ i ], i, array );
  }
};
