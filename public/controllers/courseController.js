/**
 * Created by akashkrishnan on 18-Nov-15.
 * Last modified by akashkrishnan on 18-Nov-15 21:00.
 */

'use strict';

(function () {

  var removePageBtn = document.querySelector( '#remove-page-btn' );

  if ( removePageBtn ) {
    removePageBtn.addEventListener( 'click', function ( e ) {
      e.preventDefault();
      page_id = removePageBtn.getAttribute( 'page-id' );
      var data = { 'page_id': page_id };

      flipper.page.remove( data, function ( err ) {
        if ( err ) {
          console.error( err );
          toastr.error( err );
        } else {
          toastr.info( 'Page has been removed.' );
          var newUrl = window.location.href.split( '/' ).slice( 0, -1 ).join( '/' );
          window.location = newUrl;
        }
      } );
    } );
  }


  /* -------------------------------------------------------------------------------------------------------------- */

  var RemoveMcqBtns = document.querySelectorAll( '[mcq-item] [buttons] [remove]' );
  if ( RemoveMcqBtns ) {
    forEach( RemoveMcqBtns, function ( RemoveMcqBtn ) {
      RemoveMcqBtn.addEventListener( 'click', function () {

        var mcqItem = RemoveMcqBtn.parentNode.parentNode;
        var mcq_id = mcqItem.getAttribute( 'mcq-id' );

        if ( mcq_id ) {
          var data = { mcq_id: mcq_id };

          flipper.mcq.remove( data, function ( err ) {
            if ( err ) {
              console.error( err );
              toastr.error( err );
            } else {
              toastr.info( ' Question has been deleted. ' );
              location.reload();
            }
          } );

        } else {
          if ( DEBUG ) {
            console.error( 'Missing [mcq-id].' );
          }
        }
      } );
    } );
  } else {
    if ( DEBUG ) {
      console.error( 'Missing removeMcqBtns.' );
    }
  }


  /* -------------------------------------------------------------------------------------------------------------- */


  var minilesson_id;
  var removeBtns = document.querySelectorAll( '#remove-btn' );


  if ( removeBtns ) {
    forEach( removeBtns, function ( removeBtn ) {
      removeBtn.addEventListener( 'click', function ( e ) {
        e.preventDefault();
        minilesson_id = removeBtn.getAttribute( 'minilesson-id' );
        var data = { 'minilesson_id': minilesson_id };

        flipper.minilesson.remove( data, function ( err ) {
          if ( err ) {
            console.error( err );
            toastr.error( err );
          } else {
            toastr.info( 'Minilesson has been removed.' );
            var newUrl = window.location.protocol + '//' + window.location.host +
                         window.location.pathname.split( '/' ).slice( 0, 3 ).join( '/' );
            window.location = newUrl;
          }
        } );
      } );
    } );
  }


  /* -------------------------------------------------------------------------------------------------------------- */

  var editBtns = document.querySelectorAll( '#edit-btn' );


  if ( editBtns ) {
    forEach( editBtns, function ( editBtn ) {
      editBtn.addEventListener( 'click', function ( e ) {
        e.preventDefault();
        minilesson_id = editBtn.getAttribute( 'minilesson-id' );
      } );
    } );
  }


  /* -------------------------------------------------------------------------------------------------------------- */

  var minilessonEditDialog = document.querySelector( '#minilesson-edit-dialog' );
  if ( minilessonEditDialog ) {

    var course_id = minilessonEditDialog.getAttribute( 'course-id' );
    var setBtn = document.querySelector( '#minilesson-edit-dialog [set]' );

    if ( setBtn ) {
      setBtn.addEventListener( 'click', function ( e ) {
        e.preventDefault();

        var titleInput = document.querySelector( '#minilesson-edit-dialog [title-input]' );

        var data = {
          minilesson_id: minilesson_id,
          course_id: course_id,
          title: titleInput.value
        };

        var dueDate = document.querySelector( '#minilesson-edit-dialog [due-Date-input]' );
        var currentTimeZoneOffsetInMinutes = new Date().getTimezoneOffset();

        if ( dueDate.value ) {
          var d = new Date( dueDate.value );
          var m = moment( d );
          var dueDateTZ = m.add( currentTimeZoneOffsetInMinutes, 'm' );
          data.due_date = dueDateTZ;
        }

        flipper.minilesson.edit( data, function ( err ) {
          if ( err ) {
            console.error( err );
            toastr.error( err );
          } else {
            toastr.info( 'Minilesson has been edited.' );
            location.reload();
          }
        } );
      } );
    } else {
      if ( DEBUG ) {
        console.error( 'Missing setBtn.' );
      }
    }
  } else {
    if ( DEBUG ) {
      console.error( 'Missing #minilesson-edit-dialog.' );
    }
  }

  /* -------------------------------------------------------------------------------------------------------------- */


  var publishBtn = document.querySelector( '#publish-btn' );
  if ( publishBtn ) {
    publishBtn.addEventListener( 'click', function () {
      var minilesson_id = publishBtn.getAttribute( 'minilesson-id' );
      var course_id = publishBtn.getAttribute( 'course-id' );
      var data = { 'minilesson_id': minilesson_id, 'course_id': course_id };
      flipper.minilesson.publish( data, function ( err ) {
        if ( err ) {
          console.error( err );
          toastr.error( err );
        } else {
          toastr.info( 'Minilesson has been published.' );

          //location.reload();
        }

      } );
    } );
  } else {
    if ( DEBUG ) {
      console.error( 'Missing publish btn.' );
    }
  }


  /* -------------------------------------------------------------------------------------------------------------- */


  var createBtn;

  var minilessonAddDialog = document.querySelector( '#minilesson-add-dialog' );
  if ( minilessonAddDialog ) {

    var course_id = minilessonAddDialog.getAttribute( 'course-id' );

    // Click listener for add-minilesson create button click event
    createBtn = document.querySelector( '#minilesson-add-dialog [create]' );
    if ( createBtn ) {
      createBtn.addEventListener( 'click', function () {

        var titleInput = document.querySelector( '#minilesson-add-dialog [title-input]' );

        var data = {
          course_id: course_id,
          title: titleInput.value
        };

        var dueDate = document.querySelector( '#minilesson-add-dialog [due-Date-input]' );
        var currentTimeZoneOffsetInMinutes = new Date().getTimezoneOffset();

        if ( dueDate.value ) {
          var d = new Date( dueDate.value );
          var m = moment( d );
          var dueDateTZ = m.add( currentTimeZoneOffsetInMinutes, 'm' );
          data.due_date = dueDateTZ;
        }

        if ( titleInput ) {

          flipper.minilesson.add( data, function ( err ) {
            if ( err ) {
              console.error( err );
              toastr.error( err );
            } else {
              toastr.info( 'Minilesson has been added.' );
              location.reload();
            }
          } );

        } else {
          if ( DEBUG ) {
            console.error( 'Missing #minilesson-add-dialog [title-input].' );
          }
        }

      }, false );
    } else {
      if ( DEBUG ) {
        console.error( 'Missing #minilesson-add-dialog [create].' );
      }
    }

  } else {
    if ( DEBUG ) {
      console.error( 'Missing #minilesson-add-dialog.' );
    }
  }

  /* -------------------------------------------------------------------------------------------------------------- */

  var pageAddDialog = document.querySelector( '#page-add-dialog' );
  if ( pageAddDialog ) {

    var minilesson_id = pageAddDialog.getAttribute( 'minilesson-id' );

    // Click listener for add-page create button click event
    createBtn = document.querySelector( '#page-add-dialog [create]' );
    if ( createBtn ) {
      createBtn.addEventListener( 'click', function () {

        // Get inputs
        var titleInput = document.querySelector( '#page-add-dialog [title-input]' );
        var resourceInput = document.querySelector( '#page-add-dialog [resource-input]' );
        if ( titleInput ) {

          var data = {
            minilesson_id: minilesson_id,
            title: titleInput.value,
            resource: resourceInput.value || ''
          };

          flipper.page.add( data, function ( err ) {
            if ( err ) {
              console.error( err );
              toastr.error( err );
            } else {
              toastr.info( 'Page has been added.' );
              location.reload();
            }
          } );

        } else {
          if ( DEBUG ) {
            console.error( 'Missing #page-add-dialog [title-input].' );
          }
        }

      }, false );
    } else {
      if ( DEBUG ) {
        console.error( 'Missing #page-add-dialog [create].' );
      }
    }

  } else {
    if ( DEBUG ) {
      console.error( 'Missing #page-add-dialog.' );
    }
  }

  /* -------------------------------------------------------------------------------------------------------------- */

  var mcqAddDialog = document.querySelector( '#mcq-add-dialog' );
  if ( mcqAddDialog ) {

    var page_id = mcqAddDialog.getAttribute( 'page-id' );

    // Click listener for add-page create button click event
    createBtn = document.querySelector( '#mcq-add-dialog [create]' );
    if ( createBtn ) {
      createBtn.addEventListener( 'click', function () {

        var question = document.querySelector( '#mcq-add-dialog [question-input]' );
        var a = document.querySelector( '#mcq-add-dialog [choiceA-input]' );
        var b = document.querySelector( '#mcq-add-dialog [choiceB-input]' );
        var c = document.querySelector( '#mcq-add-dialog [choiceC-input]' );
        var d = document.querySelector( '#mcq-add-dialog [choiceD-input]' );
        var e = document.querySelector( '#mcq-add-dialog [choiceE-input]' );

        var radio_answer = document.querySelectorAll( '.create-radio-answer' );

        var answers = [];
        var answerObjs = [ a, b, c, d, e ];
        answerObjs.forEach( function ( choice ) {
          if ( choice.value && choice.value.trim() ) {
            answers.push( choice.value );
          }
        } );

        var answer = '';
        forEach( radio_answer, function ( rb, i ) {
          if ( rb.checked ) {
            answer = answers[ i ];
          }
        } );

        var data = {
          page_id: page_id,
          question: question.value,
          answers: answers,
          answer: answer
        };

        flipper.mcq.add( data, function ( err ) {
          if ( err ) {
            console.error( err );
            toastr.error( err );
          } else {
            toastr.info( 'Mcq has been added.' );
            location.reload();
          }
        } );

      }, false );
    } else {
      if ( DEBUG ) {
        console.error( 'Missing #mcq-add-dialog [create].' );
      }
    }

  } else {
    if ( DEBUG ) {
      console.error( 'Missing #mcq-add-dialog.' );
    }
  }

  /* -------------------------------------------------------------------------------------------------------------- */

  var submitMcqBtns = document.querySelectorAll( '[mcq-item] [buttons] [submit]' );

  if ( submitMcqBtns ) {
    forEach( submitMcqBtns, function ( submitMcqBtn ) {
      submitMcqBtn.addEventListener( 'click', function () {

        var mcqItem = submitMcqBtn.parentNode.parentNode;
        var mcq_id = mcqItem.getAttribute( 'mcq-id' );
        var answer = mcqItem.querySelector( 'input[type="radio"][name="student-answer-options"]:checked' );

        if ( mcq_id ) {
          if ( answer ) {

            var data = {
              mcq_id: mcq_id,
              answer: answer.value
            };

            flipper.submission.add( data, function ( err, submission ) {
              if ( err ) {
                console.error( err );
                toastr.error( err );
              } else {
                toastr.info( 'Answer has been submitted.' );
                location.reload();
              }
            } );

          } else {
            toastr.error( 'Please select an answer.' );
          }
        } else {
          if ( DEBUG ) {
            console.error( 'Missing [mcq-id] or answer.' );
          }
        }

      }, false );
    } );
  } else {
    if ( DEBUG ) {
      console.error( 'Missing [mcq-item] [buttons] [submit].' );
    }
  }

})();
