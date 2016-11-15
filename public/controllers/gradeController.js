'use strict';

( function () {

  $( document ).on( 'click', '.downloadGrades', function ( e ) {

    var item = e.target;
    var id = item.parentNode.parentNode.getAttribute( 'mcq-id' );

    flipper.mcq.grades( { mcq_id: id }, function ( err, grades ) {
      if ( err ) {
        console.error( err );
        toastr.error( err );
      } else {

        var gradesCSV = 'Name,Grade\n';
        var names = Object.keys( grades );

        names.forEach( function ( name ) {
          gradesCSV += name + ',' + grades[ name ] + '\n';
        } );

        var fileName = 'mcq-grades-' + id + '.csv';
        gradesCSV = 'data:text/csv;charset=utf-8,' + gradesCSV;

        var data = encodeURI( gradesCSV );

        var link = document.createElement( 'a' );
        link.setAttribute( 'href', data );
        link.setAttribute( 'download', fileName );
        link.click();

      }
    } );

  } );

} )();
