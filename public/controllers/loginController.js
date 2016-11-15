/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

( function () {

  // Add keyup listener for enter/return inside of the form
  document.querySelector( '#password' ).addEventListener( 'keyup', function ( e ) {

    // Check if Enter/Return
    if ( e.keyCode === 13 ) {

      // Validate the registration form
      validate();

    }

  }, false );

  document.querySelector( '[button][login]' ).addEventListener( 'click', function () {

    // Validate the registration form
    validate();

  }, false );

  function validate() {

    var data = {
      username: document.querySelector( '#username' ).value,
      password: document.querySelector( '#password' ).value
    };

    // Ensure username and password are set before querying the server
    if ( data.username && data.password ) {
      flipper.user.login( data, function ( err ) {
        if ( err ) {
          console.error( err );
          toastr.error( err );
        } else {

          // Account has been authenticated; refresh the page to show new content
          window.location.replace( '/' );

        }
      } );
    }

  }

} )();
