/**
 * Created by akashkrishnan on 11/17/15.
 */

'use strict';

var Flipper = function () {

  var that = Object.create( Flipper.prototype );

  var getCookie = function ( name ) {
    var value = '; ' + document.cookie;
    var parts = value.split( '; ' + name + '=' );
    if ( parts.length === 2 ) {
      return parts.pop().split( ';' ).shift();
    }
  };

  var ajax = function ( method, url, data, done ) {

    // Set token in data
    data.token = getCookie( 'token' );

    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
      done( xhr.response );
    };

    xhr.open( method, url, true );
    xhr.setRequestHeader( 'Content-Type', 'application/json;charset=UTF-8' );
    xhr.responseType = 'json';
    xhr.send( JSON.stringify( data ) );

  };

  that.user = {

    register: function ( data, done ) {
      if ( data ) {
        ajax( 'POST', '/api/register', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            done( new Error( 'Unable to register. Invalid server response.' ), null );
          }
        } );
      }
    },

    login: function ( data, done ) {
      if ( data ) {
        ajax( 'POST', '/api/login', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            done( new Error( 'Unable to login. Invalid server response.' ), null );
          }
        } );
      }
    },

    logout: function ( data, done ) {
      if ( data ) {
        ajax( 'POST', '/api/logout', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            done( new Error( 'Unable to logout. Invalid server response.' ), null );
          }
        } );
      }
    }

  };

  that.course = {

    list: function ( data, done ) {
      if ( data ) {
        ajax( 'GET', '/api/courses', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            done( new Error( 'Unable to get a list courses. Invalid server response.' ), null );
          }
        } );
      }
    },

    get: function ( data, done ) {
      if ( data ) {
        if ( data.course_id && data.course_id.trim() ) {
          ajax( 'GET', '/api/courses/' + data.course_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get course. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A course ID is required to get a course.' ) );
        }
      }
    },

    add: function ( data, done ) {
      if ( data && data.name ) {
        if ( data.name.length > 100 ) {
          // TODO: USE CONFIG
          done( new Error( 'Name too long. Please shorten the name to at most 100 characters.' ) );
        } else {
          ajax( 'POST', '/api/courses', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to add course. Invalid server response.' ), null );
            }
          } );
        }
      }
    },

    addPendingStudent: function ( data, done ) {
      if ( data ) {
        if ( data.course_id && data.course_id.trim() ) {
          ajax( 'POST', '/api/courses/' + data.course_id.trim() + '/join', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to join course. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A course ID is required to get a course.' ) );
        }
      }
    },

    removePendingStudent: function ( data, done ) {
      if ( data ) {
        if ( data.course_id && data.course_id.trim() && data.student_id && data.student_id.trim() ) {
          ajax( 'POST', '/api/courses/' + data.course_id.trim() + '/decline', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to decline student. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A course ID & student ID are required to decline a student.' ) );
        }
      }
    },

    addStudent: function ( data, done ) {
      if ( data ) {
        if ( data.course_id && data.course_id.trim() && data.student_id && data.student_id.trim() ) {
          ajax( 'POST', '/api/courses/' + data.course_id.trim() + '/approve', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to approve student. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A course ID & student ID are required to approve a student.' ) );
        }
      }
    },

    remove: function ( data, done ) {
      if ( data ) {
        done( new Error( 'Not implemented.' ) );
      }
    }

  };

  that.minilesson = {

    list: function ( data, done ) {
      if ( data ) {
        if ( data.course_id && data.course_id.trim() ) {
          ajax( 'GET', '/api/courses/' + data.course_id.trim() + '/minilessons', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get a list of minilessons. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A course ID is required to get a list of minilessons.' ) );
        }
      }
    },

    get: function ( data, done ) {
      if ( data ) {
        if ( data.minilesson_id && data.minilesson_id.trim() ) {
          ajax( 'GET', '/api/minilessons/' + data.minilesson_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get minilesson. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A minilesson ID is required to get a minilesson.' ) );
        }
      }
    },

    add: function ( data, done ) {
      if ( data ) {
        if ( data.course_id && data.course_id.trim() ) {
          ajax( 'POST', '/api/courses/' + data.course_id.trim() + '/minilessons', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to add minilesson. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A course ID is required to add a minilesson.' ) );
        }
      }
    },

    remove: function ( data, done ) {
      if ( data ) {
        if ( data.minilesson_id && data.minilesson_id.trim() ) {
          ajax( 'DELETE', '/api/minilessons/' + data.minilesson_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to remove minilesson. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A minilesson ID is required to remove a minilesson.' ) );
        }
      }
    },

    publish: function ( data, done ) {
      if ( data ) {
        if ( data.minilesson_id && data.minilesson_id.trim() && data.course_id && data.course_id.trim() ) {
          ajax( 'POST', '/api/minilessons/publish/' + data.minilesson_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to publish minilesson. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A minilesson ID is required to publish a minilesson.' ) );
        }
      }
    },

    edit: function ( data, done ) {
      if ( data ) {
        if ( data.minilesson_id && data.minilesson_id.trim() && data.course_id && data.course_id.trim() ) {
          ajax( 'POST', '/api/minilessons/edit/' + data.minilesson_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to edit minilesson. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A minilesson ID is required to edit a minilesson.' ) );
        }
      }
    }

  };

  that.page = {

    list: function ( data, done ) {
      if ( data ) {
        if ( data.minilesson_id && data.minilesson_id.trim() ) {
          ajax( 'GET', '/api/minilessons/' + data.minilesson_id.trim() + '/pages', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get a list of pages. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A minilesson ID is required to get a list of pages.' ) );
        }
      }
    },

    get: function ( data, done ) {
      if ( data ) {
        if ( data.page_id && data.page_id.trim() ) {
          ajax( 'GET', '/api/pages/' + data.page_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get page. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A page ID is required to get a page.' ) );
        }
      }
    },

    add: function ( data, done ) {
      if ( data ) {
        if ( data.minilesson_id && data.minilesson_id.trim() ) {
          ajax( 'POST', '/api/minilessons/' + data.minilesson_id.trim() + '/pages', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to add page. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A minilesson ID is required to add a page.' ) );
        }
      }
    },

    remove: function ( data, done ) {
      if ( data ) {
        if ( data.page_id && data.page_id.trim() ) {
          ajax( 'DELETE', '/api/pages/' + data.page_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to remove page. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A page ID is required to remove a page.' ) );
        }
      }
    }

  };

  that.mcq = {

    list: function ( data, done ) {
      if ( data ) {
        if ( data.page_id && data.page_id.trim() ) {
          ajax( 'GET', '/api/pages/' + data.page_id.trim() + '/mcqs', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get a list of mcqs. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A page ID is required to get a list of mcqs.' ) );
        }
      }
    },

    get: function ( data, done ) {
      if ( data ) {
        if ( data.mcq_id && data.mcq_id.trim() ) {
          ajax( 'GET', '/api/mcqs/' + data.mcq_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get mcq. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A mcq ID is required to get a mcq.' ) );
        }
      }
    },

    grades: function ( data, done ) {
      if ( data ) {
        if ( data.mcq_id && data.mcq_id.trim() ) {
          ajax( 'GET', '/api/mcqs/' + data.mcq_id.trim() + '/grades', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get mcq grades. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'An mcq ID is required to get mcq grades.' ) );
        }
      }
    },

    add: function ( data, done ) {
      if ( data ) {
        if ( data.page_id && data.page_id.trim() ) {
          ajax( 'POST', '/api/pages/' + data.page_id.trim() + '/mcqs', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to add MCQ. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A page ID is required to add an MCQ.' ) );
        }
      }
    },

    remove: function ( data, done ) {
      if ( data ) {
        if ( data.mcq_id && data.mcq_id.trim() ) {
          ajax( 'DELETE', '/api/mcqs/' + data.mcq_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to remove mcq. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A mcq ID is required to remove a mcq.' ) );
        }
      }
    }

  };

  that.submission = {

    add: function ( data, done ) {
      if ( data ) {
        if ( data.mcq_id && data.mcq_id.trim() ) {
          ajax( 'POST', '/api/mcqs/' + data.mcq_id.trim() + '/submissions', data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to add submission. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'An mcq ID is required to add a submission.' ) );
        }
      }
    },

    get: function ( data, done ) {
      if ( data ) {
        if ( data.submission_id && data.submission_id.trim() ) {
          ajax( 'GET', '/api/submissions/' + data.submission_id.trim(), data, function ( data ) {
            if ( data ) {
              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }
            } else {
              done( new Error( 'Unable to get submission. Invalid server response.' ), null );
            }
          } );
        } else {
          done( new Error( 'A submission ID is required to get a submission.' ) );
        }
      }
    }

  };

  Object.freeze( that.user );
  Object.freeze( that.course );
  Object.freeze( that.minilesson );
  Object.freeze( that.page );
  Object.freeze( that.mcq );
  Object.freeze( that.submission );
  Object.freeze( that );

  return that;

};
