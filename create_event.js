document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("accountForm");
  const modal = document.getElementById("accountModal");
  const span = document.getElementsByClassName("close")[0];

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(form);

    fetch("/create_account", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          return response.text();
        }
      })
      .then((data) => {
        // Show modal with response
        modal.style.display = "block";
        document.getElementById("httpResponse").textContent = data;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
