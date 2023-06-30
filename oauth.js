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
            fetch(
              `https://classroom.googleapis.com/v1/courses?key=AIzaSyA1KIm7t2nRjqHD483Es6B8nIvZZTV6rUw`,
              init
            )
              .then((response) => response.json())
              .then(function(data) {
                const courses = data.courses;
                let assignments = [];
                courses.forEach(function(course) {
                  fetchCourseAssignments(token, course.id)
                    .then((courseAssignments) => {
                      assignments = assignments.concat(courseAssignments);
                      saveAssignments(assignments);
                      displayAssignments(assignments);
                    })
                    .catch((error) => {
                      console.log('Error fetching course assignments:', error);
                    });
                });
              });
         }else{
          comnsole.log("FAILED")
         }
        });
      
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
          return assignment.dueDate.year && assignment.dueDate.year >= 2015 && assignment.dueDate.month>=5;
        });
        return assignments;
      });
  }

  function saveAssignments(assignments) {
    chrome.storage.local.set({ assignments: JSON.stringify(assignments) });
  }

  function displayAssignments(assignments) {
    let deadlineList = document.querySelector("#deadline-list");
    deadlineList.innerHTML = ''; // Clear previous assignments

    assignments.sort((a, b) => {
      const dateA = new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day);
      const dateB = new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day);
      return dateA - dateB;
    });

    assignments.forEach(function(assignment) {
      let dline = document.createElement("li");
      dline.addEventListener('click', () => {
        window.open(assignment.alternateLink, '_blank');
      });
      dline.innerHTML = `Assignment Title: ${assignment.title}<br/> Assignment Due Date: ${assignment.dueDate.year}-${assignment.dueDate.month}-${assignment.dueDate.day}`;
      deadlineList.appendChild(dline);
    });
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
  }

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

  loadAssignments();

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
