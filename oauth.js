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
            getClassroomCourses(token);
          
            let canvasToken = '19045~AHIqmK1xCpaF533iPmvVoUxLso6YEC8Jhs8XmnvPujGpM9e9R6P193adKxOCKpap'
            getCanvasCourses(canvasToken)
         }else{
          console.log("FAILED")
         }
        });
      loadAssignments();
  }
  /**
   * Get Courses from Canvas and the Assignments assigned in that Course
  */
  function getClassroomCourses(token){
    let init = {
      method: 'GET',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      'contentType': 'json'
    };
    fetch(
      `https://classroom.googleapis.com/v1/courses?key=AIzaSyA1KIm7t2nRjqHD483Es6B8nIvZZTV6rUw`,
      init
    )
      .then((response) => response.json())
      .then(function(data) {
        const courses = data.courses;
        let assignments = [];
        courses.forEach(function(course) {
          fetchClassroomAssignments(token, course.id)
            .then((courseAssignments) => {
              assignments = assignments.concat(courseAssignments);
              saveClassroomAssignments(assignments);
            })
            .catch((error) => {
              console.log('Error fetching course assignments:', error);
            });
        });
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
        assignments = [];
        data.forEach(function(course) {
          fetchCanvasAssignments(token, course.id)
            .then((response) => {
              assignments = assignments.concat(response);
              saveCanvasAssignments(assignments);
            })
            .catch((error) => {
              console.log('Error fetching course assignments:', error);
            });
        });
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

  /**
   * Fetch assignment data from Google Classroom LMS.
   */
  async function fetchClassroomAssignments(token, courseId) {
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
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?key=AIzaSyA1KIm7t2nRjqHD483Es6B8nIvZZTV6rUw&fields=courseWork(id,title,dueDate,alternateLink)`,
      init
    );
    const data = await response.json();
    return data;
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
   * Gets important details from google classroom assignments and saves them to Browser
   */
  function saveClassroomAssignments(assignments) {
    processedAssignments = [];
    //currentDate = Date(Date.now());
    currentDate = Date.parse('2023-01-01');

    assignments.forEach(function(assignment){
      for (let i = 0; i < Object.keys(assignment).length; i++) {
        due_date = assignment.courseWork[i].dueDate
        if (due_date){
          strDue = due_date.year.toString() + "-" + due_date.month.toString() + "-" + due_date.day.toString()
          utsDue = Date.parse(strDue)
          if(utsDue > currentDate){
            importantDetails = {"id":assignment.id, "name": assignment.courseWork[i].title, "due": strDue, "url": assignment.courseWork[i].alternateLink};
            processedAssignments = processedAssignments.concat(importantDetails);
          }
        }
      }
    });


    chrome.storage.local.get(['assignments'], function(result) {
      if (result.assignments) {
        chrome.storage.local.set({ assignments: JSON.stringify(processedAssignments) });
      }else{
        newAssignments = processedAssignments;
        chrome.storage.local.set({ assignments: JSON.stringify(newAssignments) });
      }
    });
  }


  /**
   * Gets important details from canvas assignments and saves them to Browser
   */
  function saveCanvasAssignments(assignments) {
    processedAssignments = [];
    //currentDate = Date(Date.now());
    currentDate = Date.parse('2023-01-01');

    assignments.forEach(function(assignment){
      importantDetails = {"id":assignment.id, "name": assignment.name, "due": assignment.due_at, "url": assignment.html_url};
      //filter deadlines after a certain date/time
      if ((Date.parse(importantDetails.due) > currentDate) && (importantDetails.due !== null)){
        processedAssignments = processedAssignments.concat(importantDetails);
      }
      return assignments;
    });
    chrome.storage.local.get(['assignments'], function(result) {
      if (result.assignments) {
        chrome.storage.local.set({ assignments: JSON.stringify(processedAssignments) });
      }else{
        newAssignments = processedAssignments;
        chrome.storage.local.set({ assignments: JSON.stringify(newAssignments) });
      }
    });
  }

  function displayAssignments(assignments) {
    console.log(assignments)
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
        window.open(assignment.url, '_blank');
      });
      dline.innerHTML = `${assignment.name}<br/> Due Date: ${assignment.due}`;
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

  const daysTag = document.querySelector(".days"),
currentDate = document.querySelector(".current-date"),
prevNextIcon = document.querySelectorAll(".icons span");

// getting new date, current year and month
let date = new Date(),
currYear = date.getFullYear(),
currMonth = date.getMonth();

// storing full name of all months in array
const months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];

const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(), // getting first day of month
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(), // getting last date of month
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(), // getting last day of month
    lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate(); // getting last date of previous month
    let liTag = "";

    for (let i = firstDayofMonth; i > 0; i--) { // creating li of previous month last days
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    for (let i = 1; i <= lastDateofMonth; i++) { // creating li of all days of current month
        // adding active class to li if the current day, month, and year matched
        let isToday = i === date.getDate() && currMonth === new Date().getMonth() 
                     && currYear === new Date().getFullYear() ? "active" : "";
        liTag += `<li class="${isToday}">${i}</li>`;
    }

    for (let i = lastDayofMonth; i < 6; i++) { // creating li of next month first days
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`
    }
    currentDate.innerText = `${months[currMonth]} ${currYear}`; // passing current mon and yr as currentDate text
    daysTag.innerHTML = liTag;
}
renderCalendar();

prevNextIcon.forEach(icon => { // getting prev and next icons
    icon.addEventListener("click", () => { // adding click event on both icons
        // if clicked icon is previous icon then decrement current month by 1 else increment it by 1
        currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

        if(currMonth < 0 || currMonth > 11) { // if current month is less than 0 or greater than 11
            // creating a new date of current year & month and pass it as date value
            date = new Date(currYear, currMonth, new Date().getDate());
            currYear = date.getFullYear(); // updating current year with new date year
            currMonth = date.getMonth(); // updating current month with new date month
        } else {
            date = new Date(); // pass the current date as date value
        }
        renderCalendar(); // calling renderCalendar function
    });
});
};
