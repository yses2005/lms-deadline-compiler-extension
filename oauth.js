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
          return assignment.dueDate.year && assignment.dueDate.year >= 2023 && assignment.dueDate.month>=5;
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
};
