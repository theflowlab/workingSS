$(document).ready(function () {
  // Define the sandbox endpoint URL
  var endpoint = "https://api.demo.ezidebit.com.au/V3-5/public-rest";
  
  // Find the payNowButton element
  var payNowButton = document.getElementById('payNowButton');

  // Initialize the ChargeCard method with the provided public key
  eziDebit.init("3A3815DE-0662-47A0-4B7E-1183785995CC", {
    submitAction: "ChargeCard",
    submitButton: "payNowButton",
    submitCallback: displaySubmitCallback,
    submitError: displaySubmitError,
    nameOnCard: "nameOnCard",
    cardNumber: "cardNumber",
    cardExpiryMonth: "cardExpiryMonth",
    cardExpiryYear: "cardExpiryYear",
    cardCCV: "cardCCV",
    paymentAmount: "paymentAmount",
    paymentReference: "paymentReference"
  }, endpoint);

  // Add an event listener to the payNowButton click event to change the button text
  payNowButton.addEventListener('click', function() {
    payNowButton.textContent = "Processing...";
  });

  // Callback function for successful transactions
  function displaySubmitCallback(data) {
    console.log("Successful transaction response:", data);
    window.location.href = '/order-confirmation';
    payNowButton.textContent = "Confirm & Pay"; // Reset the button text
  }

  // Callback function for errors
  function displaySubmitError(errorMessage, element) {
    var cleanedErrorMessage = errorMessage.replace(/Ezidebit API Error \(\d+\): /, '');
    document.getElementById("results").innerHTML = `<div class="error-message">${cleanedErrorMessage}</div>`;
    if (element) {
      document.getElementById(element).style.border = "1px solid red";
      document.getElementById(element).style.background = "#F5E4E6";
    }
    payNowButton.textContent = "Confirm & Pay"; // Reset the button text
  }

  // List of input fields that need validation
  var inputFields = [
    "nameOnCard",
    "cardNumber",
    "cardExpiryMonth",
    "cardExpiryYear",
    "cardCCV",
    "paymentAmount",
    "paymentReference"
  ];

  // Add an event listener to each input field
  inputFields.forEach(function (fieldId) {
    var inputField = document.getElementById(fieldId);
    if (inputField) {
      inputField.addEventListener('input', function() {
        // Reset the border and background styles when the input value changes
        inputField.style.border = "";
        inputField.style.background = "";
      });
    }
  });
});