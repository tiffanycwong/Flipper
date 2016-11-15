/**
 * Created by akashkrishnan on 17-Nov-15.
 * Last modified by akashkrishnan on 17-Nov-15 15:29.
 */

'use strict';

( function () {

  var approveBtns = document.querySelectorAll( '[approve]' );

  if ( approveBtns ) {
    forEach( approveBtns, function ( approveBtn ) {
      approveBtn.addEventListener( 'click', function ( event ) {
        var student_id = event.target.getAttribute( 'student-id' );
        var course_id = event.target.getAttribute( 'course-id' );
        if ( student_id && course_id ) {
          var data = { student_id: student_id, course_id: course_id };
          flipper.course.addStudent( data, function ( err, course ) {
            if ( err ) {
              console.error( err );
              toastr.error( err );
            } else {

              toastr.info( 'Student Approved.' );

              location.reload();

            }
          } );
        } else {
          console.error( 'Missing [student-id] or [course-id].' );
        }
      }, false );
    } );
  } else {
    console.error( 'Missing [approve]' );
  }

  /* -------------------------------------------------------------------------------------------------------------- */

  var declineBtns = document.querySelectorAll( '[decline]' );

  if ( declineBtns ) {
    forEach( declineBtns, function ( declineBtn ) {
      declineBtn.addEventListener( 'click', function ( event ) {
        var student_id = event.target.getAttribute( 'student-id' );
        var course_id = event.target.getAttribute( 'course-id' );
        if ( student_id && course_id ) {
          var data = { student_id: student_id, course_id: course_id };
          flipper.course.removePendingStudent( data, function ( err ) {
            if ( err ) {
              console.error( err );
              toastr.error( err );
            } else {
              toastr.info( 'Student Removed.' );
              location.reload();
            }
          } );
        } else {
          console.error( 'Missing [student-id] or [course-id].' );
        }
      }, false );
    } );
  } else {
    console.error( 'Missing [decline]' );
  }

} )();
