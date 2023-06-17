document.addEventListener('DOMContentLoaded', function () {
    // Send a message to the background script to retrieve the deadlines
    chrome.runtime.sendMessage({ action: 'getDeadlines' }, function (response) {
      // Display the deadlines in the popup
      displayDeadlines(response);
    });
  });
  
  function displayDeadlines(deadlines) {
    const deadlineList = document.getElementById('deadline-list');
    for (const deadline of deadlines) {
      const li = document.createElement('li');
      li.textContent = `Course: ${deadline.courseTitle}, Title: ${deadline.workTitle}, Deadline: ${deadline.deadline}`;
      deadlineList.appendChild(li);
    }
  }
  