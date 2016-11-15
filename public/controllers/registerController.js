/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

( function () {

  var config;

  // Add keyup listener for enter/return inside of the form
  document.querySelector( '#password_verify' ).addEventListener( 'keyup', function ( e ) {

    // Check if Enter/Return
    if ( e.keyCode === 13 ) {

      // Validate the registration form
      validate();

    }

  }, false );

  document.querySelector( '[button][register]' ).addEventListener( 'click', function () {

    // Validate the registration form
    validate();

  }, false );

  /**
   * Retrieves config data from server. Config data includes information on username and passwords constraints.
   *
   * @param {function()} done - callback function
   */
  function loadConfig( done ) {

    var xhr = new XMLHttpRequest();

    xhr.onload = function () {

      config = xhr.response;

      if ( config ) {
        done();
      } else {
        console.error( 'Unable to retrieve configuration file. Invalid server response.' );
        toastr.error( 'Unable to retrieve configuration file. Invalid server response.' );
      }

    };

    xhr.open( 'GET', '/config.json', true );
    xhr.responseType = 'json';
    xhr.send();

  }

  function validate() {

    // Retrieve config if it hasn't already been loaded
    if ( !config ) {
      loadConfig( validate );
    } else {

      var name = document.querySelector( '#name' ).value;
      var username = document.querySelector( '#username' ).value;
      var password = document.querySelector( '#password' ).value;
      var passwordVerify = document.querySelector( '#password_verify' ).value;

      var nameMinLength = config.registration.name.length.min;
      var nameMaxLength = config.registration.name.length.max;

      var usernameMinLength = config.registration.username.length.min;
      var usernameMaxLength = config.registration.username.length.max;
      var validUsername = new RegExp( config.registration.username.regex.valid ).test( username );

      var passwordMinLength = config.registration.password.length.min;
      var passwordMaxLength = config.registration.password.length.max;
      var hasNumeral = new RegExp( config.registration.password.regex.hasNumeral ).test( password );
      var hasUpper = new RegExp( config.registration.password.regex.hasUpper ).test( password );
      var hasLower = new RegExp( config.registration.password.regex.hasLower ).test( password );

      if ( name.length < nameMinLength ) {
        toastr.error( 'Full Name must contain at least ' + nameMinLength + ' characters.' );
      } else if ( name.length > nameMaxLength ) {
        toastr.error( 'Full Name must contain at most ' + nameMaxLength + ' characters.' );
      } else if ( username.length < usernameMinLength ) {
        toastr.error( 'Username must contain at least ' + usernameMinLength + ' characters.' );
      } else if ( username.length > usernameMaxLength ) {
        toastr.error( 'Username must contain at most ' + usernameMaxLength + ' characters.' );
      } else if ( !validUsername ) {
        toastr.error( 'Username contains invalid characters. Please use alphanumeric characters and underscores.' );
      } else if ( password !== passwordVerify ) {
        toastr.error( 'Passwords do not match.' );
      } else if ( username === password ) {
        toastr.error( 'Username and password must be different.' );
      } else if ( password.length < passwordMinLength ) {
        toastr.error( 'Password must contain at least ' + passwordMinLength + ' characters.' );
      } else if ( password.length > passwordMaxLength ) {
        toastr.error( 'Password must contain at most ' + passwordMaxLength + ' characters.' );
      } else if ( !hasNumeral ) {
        toastr.error( 'Password must contain at least one (1) Arabic numeral (0-9).' );
      } else if ( !hasUpper ) {
        toastr.error( 'Password must contain at least one (1) uppercase English alphabet character (A-Z).' );
      } else if ( !hasLower ) {
        toastr.error( 'Password must contain at least one (1) lowercase English alphabet character (a-z).' );
      } else {
        flipper.user.register( { name: name, username: username, password: password }, function ( err ) {
          if ( err ) {
            console.error( err );
            toastr.error( err );
          } else {

            // Account has been registered; go back to the login page
            window.location.replace( '/' );

          }
        } );
      }

    }

  }

} )();
