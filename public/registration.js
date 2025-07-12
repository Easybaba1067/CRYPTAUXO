const passwordChecker = document.getElementById("password");
const passwordConfirm = document.getElementById("confirmPassword");
const passwordText = document.querySelector(".password-text");
const btnClick = document.querySelector(".form-btn");

btnClick.addEventListener("click", (e) => {
  const password = passwordChecker.value;
  const confirmPassword = passwordConfirm.value;
  if (password === confirmPassword) {
    document.querySelector(".confirm-password").textContent = "";
  } else {
    e.preventDefault();
    document.querySelector(".confirm-password").textContent =
      "password not match";
  }
});

passwordChecker.addEventListener("input", () => {
  const password = passwordChecker.value;
  strength = calculateStrenght(password);
  displayPasswordStrength(strength);
});

function calculateStrenght(password) {
  let strength = 0;
  switch (true) {
    case password.length >= 8:
      strength += 1;
      break;

    default:
      break;
  }
  switch (true) {
    case /[A-Z]/.test(password):
      strength += 1;
      break;

    default:
      break;
  }
  switch (true) {
    case /[a-z]/.test(password):
      strength += 1;
      break;

    default:
      break;
  }
  switch (true) {
    case /\d/.test(password):
      strength += 1;
      break;

    default:
      break;
  }
  switch (true) {
    case /[^A-Za-z0-9]/.test(password):
      strength += 1;
      break;

    default:
      break;
  }
  return strength;
}
function displayPasswordStrength(strength) {
  let strengthText = "";
  let strengthColor = "";
  switch (true) {
    case strength <= 2:
      strengthText = "weak strength";
      strengthColor = "red";

      break;

    default:
      break;
  }
  switch (true) {
    case strength > 2 && strength <= 4:
      strengthText = "medium strength";
      strengthColor = "yellow";

      break;

    default:
      break;
  }
  switch (true) {
    case strength === 5:
      strengthText = "strong strength";
      strengthColor = "lightgreen";
      break;

    default:
      break;
  }
  passwordText.textContent = strengthText;
  passwordText.style.color = strengthColor;
}
