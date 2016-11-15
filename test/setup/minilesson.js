'use strict';

var Course = require('../../models/course.js');
var User = require( '../../models/user.js' );

module.exports = function(scope) {
  return function ( done ) {
    // Make sure course is set up
    (require( './course.js' )(scope))( function () {
      scope.nextMonth = new Date();
      scope.nextMonth.setDate(scope.nextMonth.getDate() + 30);

      Course.add({
          name: 'courseName10',
          teacher_id: String(scope.teacher._id)
        }, function (err, _course) {
          if (err) {
            throw err;
          }
          scope.course = _course;
          scope.minilessonData = {
            user_id: String(scope.teacher._id),
            course_id: String(scope.course._id),
            due_date: scope.nextMonth,
            title: "Kinematics I"
          };
          done();
        });
    } );

  };

};
