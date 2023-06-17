// function loadGoogleClassroomApiScript() {
//     const script = document.createElement('script');
//     script.src = 'https://apis.google.com/js/api.js';
//     script.onload = initializeGoogleClassroomApi;
//     document.head.appendChild(script);
//   }
  
//   function initializeGoogleClassroomApi() {
//     // OAuth 2.0 configuration
//     const clientId = '662004468767-h4725tg392bera623ra1bv763fa387uq.apps.googleusercontent.com';
//     const apiKey = 'AIzaSyCH43E-iBpc-GJ-cuY-1DxZzaZAZ20i-Tk';
//     const scopes = [
//       'https://www.googleapis.com/auth/classroom.courses.readonly',
//       'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
//     ];
  
//     // Authorize the user
//     function authorize() {
//       gapi.auth2.authorize(
//         {
//           client_id: clientId,
//           scope: scopes.join(' '),
//           immediate: false
//         },
//         handleAuthResult
//       );
//     }
  
//     // Handle the API authorization result
//     function handleAuthResult(authResult) {
//       if (authResult && !authResult.error) {
//         // API authorization successful, make API call to retrieve courses
//         gapi.client.load('classroom', 'v1', function () {
//           const request = gapi.client.classroom.courses.list();
//           request.execute(handleCoursesResponse);
//         });
//       } else {
//         console.error('Authorization failed:', authResult && authResult.error);
//       }
//     }
  
//     // Handle the API response for courses
//     function handleCoursesResponse(response) {
//       if (response && !response.error) {
//         const courses = response.courses || [];
//         // Implement logic to fetch deadlines from courses, course works, and student submissions
//         // ...
//       } else {
//         console.error('An error occurred:', response && response.error);
//       }
//     }
  
//     // Initialize the API client and authorize the user
//     function initClient() {
//       gapi.client.init({
//         apiKey: apiKey
//       }).then(authorize);
//     }
  
//     // Load the API client and authenticate the user
//     function handleClientLoad() {
//       gapi.load('client:auth2', initClient);
//     }
  
//     handleClientLoad();
//   }
  
//   loadGoogleClassroomApiScript();
  
  // Message listener to fetch deadlines
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'getDeadlines') {
      // Fetch the deadlines here and send the response
      const deadlines = [{courseTitle:"Title 1", workTitle:"work 1", deadline:"Today"}]; // Replace with your implementation to fetch deadlines
      sendResponse(deadlines);
      return true;
    }
  });
  