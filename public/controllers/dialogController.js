/**
 * Created by akashkrishnan on 17-Nov-15.
 * Last modified by akashkrishnan on 17-Nov-15 11:13.
 */

'use strict';

(function () {

  // Register all dialogs and make sure they're hidden
  var dialogs = document.querySelectorAll( '[dialog]' );
  forEach( dialogs, function ( dialog ) {

    // Update styles
    dialog.style.display = 'none';
    dialog.style.visibility = 'visible';

    // Support closing when esc button is pressed and dialog is a close trigger
    dialog.addEventListener( 'keyup', function ( e ) {

      // Check if Enter/Return
      if ( e.keyCode === 27 ) {

        // Click the submit button
        dialog.click();

      }

    } );

    // Support auto submitting

    var submitButton;

    // Get all buttons
    var buttons = dialog.querySelectorAll( '[buttons] [button]' );

    // Ensure we have at least one button
    if ( buttons && buttons.length ) {

      // Submit button is assumed to be the last button
      submitButton = buttons[ buttons.length - 1 ];

      // Get all user-input fields
      var inputFields = dialog.querySelectorAll( 'input:not([type="hidden"])' );

      // Ensure we have at least one input field
      if ( inputFields && inputFields.length ) {

        // Set up a listener on the last user-input field for auto submission
        inputFields[ inputFields.length - 1 ].addEventListener( 'keyup', function ( e ) {

          // Check if Enter/Return
          if ( e.keyCode === 13 ) {

            // Click the submit button
            submitButton.click();

          }

        } );

      }

    }

  } );

  // Register all triggers that show the specified dialog when clicked

  var openTriggers = document.querySelectorAll( '[dialog-open-trigger]' );

  var openTriggerEventHandler = function ( trigger ) {
    return function () {
      var id = trigger.getAttribute( 'dialog-open-trigger' );
      var dialog = document.querySelector( '#' + id );
      if ( dialog ) {
        if ( dialog.hasAttribute( 'dialog' ) ) {

          // Show the dialog
          dialog.style.display = null;

          // Get all user-input fields
          var inputFields = dialog.querySelectorAll( 'input:not([type="hidden"])' );

          // Ensure we have at least one input field
          if ( inputFields && inputFields.length ) {

            // Autofocus the first input field
            inputFields[ 0 ].focus();

          }

        } else {
          console.error( 'Dialog referenced by dialog-open-trigger is missing the dialog attribute.' );
        }
      } else {
        console.error( 'Dialog referenced by dialog-open-trigger not found.' );
      }
    };
  };

  forEach( openTriggers, function ( openTrigger ) {
    openTrigger.addEventListener( 'click', openTriggerEventHandler( openTrigger ), false );
  } );

  // Register all triggers that hide the specified dialog when clicked

  var closeTriggers = document.querySelectorAll( '[dialog-close-trigger]' );

  var closeTriggerEventHandler = function ( trigger ) {
    return function ( e ) {
      if ( e.target === trigger ) {
        var id = trigger.getAttribute( 'dialog-close-trigger' );
        var dialog = document.querySelector( '#' + id );
        if ( dialog ) {
          if ( dialog.hasAttribute( 'dialog' ) ) {
            dialog.style.display = 'none';
          } else {
            console.error( 'Dialog referenced by dialog-close-trigger is missing the dialog attribute.' );
          }
        } else {
          console.error( 'Dialog referenced by dialog-close-trigger not found.' );
        }
      }
    };
  };

  forEach( closeTriggers, function ( closeTrigger ) {
    closeTrigger.addEventListener( 'click', closeTriggerEventHandler( closeTrigger ), false );
  } );

})();
