document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("myForm");
  const modal = document.getElementById("myModal");
  const span = document.getElementsByClassName("close")[0];

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(form);

    fetch("/", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.text())
      .then((data) => {
        // Show modal with response
        modal.style.display = "block";
        document.querySelector(".modal-content p").textContent = data;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});
