// ----------------------------------
window.onload = function() {
  document.querySelector('#fetchButton').addEventListener('click', function() {
      authenticate();
  });
  function authenticate(){
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
         if(token){
          let init = {
              method: 'GET',
              async: true,
              headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              'contentType': 'json'
            };
            fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json`, init)
        .then((response) => response.json())
        .then(function(data) {
          const userName = data.name;
          displayGreeting(userName);
        });
            // fetch(
            //   `https://classroom.googleapis.com/v1/courses?key=AIzaSyA1KIm7t2nRjqHD483Es6B8nIvZZTV6rUw`,
            //   init
            // )
            //   .then((response) => response.json())
            //   .then(function(data) {
            //     const courses = data.courses;
            //     let assignments = [];
            //     courses.forEach(function(course) {
            //       fetchCourseAssignments(token, course.id)
            //         .then((courseAssignments) => {
            //           assignments = assignments.concat(courseAssignments);
            //           saveAssignments(assignments);
            //           displayAssignments(assignments);
            //         })
            //         .catch((error) => {
            //           console.log('Error fetching course assignments:', error);
            //         });
            //     });
            //   });
            let canvasToken = '19045~AHIqmK1xCpaF533iPmvVoUxLso6YEC8Jhs8XmnvPujGpM9e9R6P193adKxOCKpap'
            getCanvasCourses(canvasToken)
         }else{
          console.log("FAILED")
         }
        });
      
  }

  /**
   * Get Courses from Canvas and the Assignments assigned in that Course
  */
  function getCanvasCourses(token){
    let init2 = {
      method: 'GET',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      'contentType': 'json'
    };
    fetch(
      `https://uplb.instructure.com/api/v1/courses`,
      init2
    )
      .then((response) => response.json())
      .then(function(data) {
        let assignments = [];
        data.forEach(function(course) {
          fetchCanvasAssignments(token, course.id)
            .then((response) => {
              assignments = assignments.concat(response);
              saveCanvasAssignments(response);
            })
            .catch((error) => {
              console.log('Error fetching course assignments:', error);
            });
        });
      });
      loadAssignments();
  }

  document.querySelector('#logoutButton').addEventListener('click', function() {
    chrome.identity.getAuthToken({ interactive: false }, function(currentToken) {
      if (!chrome.runtime.lastError && currentToken) {
        chrome.identity.removeCachedAuthToken({ token: currentToken }, function() {
          console.log('User logged out.');
          clearAssignments();
          clearGreeting();
          chrome.identity.launchWebAuthFlow(
            {
              url: 'https://accounts.google.com/logout',
              interactive: false
            },
            function() {
              console.log('Token cache cleared. Please sign in again.');
            }
          );
        });
      }
    });
  });
  function displayGreeting(userName) {
    const greetingElement = document.querySelector('#greeting');
    greetingElement.textContent = `Hi, ${userName}`;
    greetingElement.style.display = 'block';
    saveGreeting(userName);
  }

  function saveGreeting(greeting) {
    chrome.storage.local.set({ greeting: greeting });
  }

  function fetchCourseAssignments(token, courseId) {
    let init = {
      method: 'GET',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      'contentType': 'json'
    };
    return fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?key=AIzaSyA1KIm7t2nRjqHD483Es6B8nIvZZTV6rUw&fields=courseWork(id,title,dueDate,alternateLink)`,
      init
    )
      .then((response) => response.json())
      .then(function(data) {
        const assignments = data.courseWork.filter((assignment) => {
          return assignment.dueDate.year && assignment.dueDate.year >= 2021 && assignment.dueDate.month>=5;
        });
        return assignments;
      });
  }

  //canvas token: 19045~AHIqmK1xCpaF533iPmvVoUxLso6YEC8Jhs8XmnvPujGpM9e9R6P193adKxOCKpap
  //curl https://uplb.instructure.com/api/v1/courses/${courseId}/assignments?order_by=due_at -H "Authorization: Bearer 19045~AHIqmK1xCpaF533iPmvVoUxLso6YEC8Jhs8XmnvPujGpM9e9R6P193adKxOCKpap"
  //parameter of interest: name, due_at
  //curl https://uplb.instructure.com/api/v1/courses -H "Authorization: Bearer 19045~AHIqmK1xCpaF533iPmvVoUxLso6YEC8Jhs8XmnvPujGpM9e9R6P193adKxOCKpap"
  //parameter of interest: id
  //curl https://uplb.instructure.com/api/v1/users/self -H "Authorization: Bearer 19045~AHIqmK1xCpaF533iPmvVoUxLso6YEC8Jhs8XmnvPujGpM9e9R6P193adKxOCKpap"

  /**
   * Fetch assignment data from Canvas LMS.
   */
  async function fetchCanvasAssignments(token, courseId){
    let init = {
      method: 'GET',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      'contentType': 'json'
    };
    const response = await fetch(
      `https://uplb.instructure.com/api/v1/courses/${courseId}/assignments`,
      init
    );
    const data = await response.json();
    const cAssignments = data;
    return cAssignments;
  }

  /**
   * Gets important details from canvas assignments and saves them to Browser
   */
  function saveCanvasAssignments(assignments) {
    processedAssignments = [];
    //currentDate = Date(Date.now());
    currentDate = Date.parse('2022-01-01');

    assignments.forEach(function(assignment){
      importantDetails = {"id":assignment.id, "name": assignment.name, "due": assignment.due_at, "url": assignment.html_url};
      //filter deadlines after a certain date/time
      if ((Date.parse(importantDetails.due) > currentDate) || (importantDetails.due == null)){
        processedAssignments = processedAssignments.concat(importantDetails);
      }
    });
    chrome.storage.local.get(['assignments'], function(result) {
      if (result.assignments) {
        newAssignments = JSON.parse(result.assignments).concat(processedAssignments);
        chrome.storage.local.set({ assignments: JSON.stringify(newAssignments) });
      }else{
        chrome.storage.local.set({ assignments: JSON.stringify(processedAssignments) });
      }
    });
  }

  function displayAssignments(assignments) {
    let deadlineList = document.querySelector("#deadline-list");
    deadlineList.innerHTML = ''; // Clear previous assignments
    assignments.sort((a, b) => {
      const dateA = Date.parse(a.due);
      const dateB = Date.parse(b.due);
      return dateA - dateB;
    });
    assignments.forEach(function(assignment) {
      let dline = document.createElement("li");
      dline.addEventListener('click', () => {
        window.open(assignment.html_url, '_blank');
      });
      dline.innerHTML = `${assignment.name}<br/> Due Date: ${assignment.due}`;
      deadlineList.appendChild(dline);
    });
    // TODO due date
  }

  function loadAssignments() {
    chrome.storage.local.get(['assignments', 'greeting'], function(result) {
      if (result.assignments) {
        const assignments = JSON.parse(result.assignments);
        displayAssignments(assignments);
      }

      if (result.greeting) {
        const greeting = result.greeting;
        displayGreeting(greeting);
      }
    });
    chrome.storage.local.remove('assignments');
  }
  loadAssignments();
  function clearAssignments() {
      chrome.storage.local.remove('assignments');
      let deadlineList = document.querySelector("#deadline-list");
      deadlineList.innerHTML = '';
    }

    function clearGreeting() {
      chrome.storage.local.remove('greeting');
      let greetingElement = document.querySelector('#greeting');
      greetingElement.textContent = '';
      greetingElement.style.display = 'none';
    }
  //loadAssignments();

  document.querySelector('#calendarButton').addEventListener('click', function() {
    createCalendar(calendar, 2023, 6);
  });

  function createCalendar(elem, year, month) {
    let mon = month - 1; // months in JS are 0..11, not 1..12
    let d = new Date(year, mon);

    let table = '<table><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr><tr>';

    // spaces for the first row
    // from Monday till the first day of the month
    // * * * 1  2  3  4
    for (let i = 0; i < getDay(d); i++) {
      table += '<td></td>';
    }

    // <td> with actual dates
    while (d.getMonth() == mon) {
      table += '<td>' + d.getDate() + '</td>';

      if (getDay(d) % 7 == 6) { // sunday, last day of week - newline
        table += '</tr><tr>';
      }

      d.setDate(d.getDate() + 1);
    }

    // add spaces after last days of month for the last row
    // 29 30 31 * * * *
    if (getDay(d) != 0) {
      for (let i = getDay(d); i < 7; i++) {
        table += '<td></td>';
      }
    }

    // close the table
    table += '</tr></table>';

    elem.innerHTML = table;
  }

  function getDay(date) { // get day number from 0 (monday) to 6 (sunday)
    let day = date.getDay();
    return day;
  }
};
