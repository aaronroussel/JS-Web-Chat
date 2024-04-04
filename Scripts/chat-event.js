document.addEventListener("DOMContentLoaded", function () {
  var socket = io(); // Connect to the server
  const messageBox = document.getElementById("message-box");
  const sendButton = document.getElementById("send-btn");
  const logoutButton = document.getElementById("logout-btn");
  // Handle incoming messages
  socket.on("chat message", function (data) {
    if (data.text) {
      var item = document.createElement("li");
      item.innerHTML =
        '<span class="username">' + data.user + ":</span> " + data.text;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    }
  });

  // Send message
  sendButton.addEventListener("click", function () {
    var messageText = messageBox.value;
    socket.emit("chat message", messageText); // Send message to server
    messageBox.value = ""; // Clear the input box
    return false;
  });

  messageBox.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default action of the Enter key

      // Trigger click on send button or directly call the send message function
      document.getElementById("send-btn").click();
    }
  });

  logoutButton.addEventListener("click", function () {
    window.location.href = "/logout";
  });
});
