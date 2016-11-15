/**
 * Created by akashkrishnan on 17-Nov-15.
 * Last modified by akashkrishnan on 17-Nov-15 15:29.
 */

'use strict';

(function () {

  var courseAddDialog = document.querySelector( '#course-add-dialog' );
  if ( courseAddDialog ) {

    // Click listener for add-course create button click event
    var createBtn = document.querySelector( '#course-add-dialog [create]' );
    if ( createBtn ) {
      createBtn.addEventListener( 'click', function () {

        // Get course name from form
        var nameInput = document.querySelector( '#course-add-dialog [name-input]' );
        if ( nameInput ) {

          var data = { name: nameInput.value };

          flipper.course.add( data, function ( err, course ) {
            if ( err ) {
              console.error( err );
              toastr.error( err );
            } else {

              toastr.info( 'Course has been added.' );

              location.reload();

              // Close the dialog --- this works because the dialog is a dialog-close-trigger
              courseAddDialog.click();

            }
          } );

        } else {
          if ( DEBUG ) {
            console.error( 'Missing #course-add-dialog [name-input].' );
          }
        }

      }, false );
    } else {
      if ( DEBUG ) {
        console.error( 'Missing #course-add-dialog [create].' );
      }
    }

  } else {
    if ( DEBUG ) {
      console.error( 'Missing #course-add-dialog.' );
    }
  }

  /* -------------------------------------------------------------------------------------------------------------- */

  var courseJoinDialog = document.querySelector( '#course-join-dialog' );
  if ( courseJoinDialog ) {

    // Click listener for join-course button click event
    var joinBtns = document.querySelectorAll( '#course-join-dialog [join]' );
    if ( joinBtns ) {
      joinBtns = [].slice.call( joinBtns );
      joinBtns.forEach( function ( joinBtn ) {
        joinBtn.addEventListener( 'click', function ( event ) {

          var course_id = event.target.getAttribute( 'course-id' );
          if ( course_id ) {

            var data = { course_id: course_id };

            flipper.course.addPendingStudent( data, function ( err, course ) {
              if ( err ) {
                console.error( err );
                toastr.error( err );
              } else {

                toastr.info( 'You have joined a course.' );

                location.reload();

                // Close the dialog --- this works because the dialog is a dialog-close-trigger
                courseJoinDialog.click();

              }
            } );

          } else {
            if ( DEBUG ) {
              console.error( 'Missing #course-join-dialog [course-id].' );
            }
          }

        }, false );
      } );
    } else {
      if ( DEBUG ) {
        console.error( 'Missing #course-join-dialog [join].' );
      }
    }
  } else {
    if ( DEBUG ) {
      console.error( 'Missing #course-join-dialog.' );
    }
  }

})();
