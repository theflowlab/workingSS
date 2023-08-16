<script>
  // Function to handle the change in the data-items attribute
  function handleDataItemsChange() {
    const cartItemsElement = document.getElementById("cartItems");
    const cartItemsJSON = cartItemsElement.getAttribute("data-items");

    if (cartItemsJSON) {
      try {
        const quickSaleLines = JSON.parse(cartItemsJSON);
        console.log("Parsed cart items:", quickSaleLines);
      } catch (error) {
        console.error("Error parsing cart items:", error);
      }
    }
  }
  
  function getReceiptTypeCode(cardNumber) {
  if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) {
    return 'CREDIT_CARD_AMEX';
  } else if (cardNumber.startsWith('36')) {
    return 'CREDIT_CARD_DINERS';
  } else if (cardNumber.startsWith('51') || cardNumber.startsWith('52') || cardNumber.startsWith('53') || cardNumber.startsWith('54') || cardNumber.startsWith('55')) {
    return 'CREDIT_CARD_MCARD';
  } else if (cardNumber.startsWith('4')) {
    return 'CREDIT_CARD_VISA';
  } else {
    // Handle unknown card type, if necessary
    return null;
  }
}


  // Function to map the quickSaleLines
  function mapQuickSaleLines(quickSaleLines) {
    return quickSaleLines.map(line => ({
      item_code: String(line["SKU (from Product)"]),
      item_description: String(line["Name (from Product)"]),
      item_net_amt: parseFloat(line.Net_Amount),
      item_qty: line.Quantity, 
      item_tax_amt: parseFloat(line["Tax_Amount (from Product)"]),
      item_total_amt: parseFloat(line["Price (from Product)"])
    }));
  }

  // Function to set up the MutationObserver
  function observeDataItemsAttribute() {
    const cartItemsElement = document.getElementById("cartItems");
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-items') {
          handleDataItemsChange(); // Call the function when the attribute changes
        }
      });
    });

    // Start observing changes to the data-items attribute
    observer.observe(cartItemsElement, { attributes: true });
  }

  // Function to override setAttribute for the cartItemsElement
  function overrideSetAttribute() {
    const cartItemsElement = document.getElementById("cartItems");
    const originalSetAttribute = cartItemsElement.setAttribute;

    cartItemsElement.setAttribute = function(name, value) {
      if (name === 'data-items' && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      originalSetAttribute.call(this, name, value);
    };
  }

  // Call the functions when the document is ready
  $(document).ready(function () {
    overrideSetAttribute();
    observeDataItemsAttribute();

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
    
     // Check if the quick sale was successful
    if (data.success) {
        // Extract record IDs from cart items
        const cartItemsElement = document.getElementById("cartItems");
        const cartItemsJSON = cartItemsElement.getAttribute("data-items");
        const cartItems = JSON.parse(cartItemsJSON);
        const recordIds = cartItems.map(item => item.Record_ID);

        // Delete the corresponding records in the Airtable 'Cart Items' table
        var Airtable = require('airtable');
        var base = new Airtable({apiKey: 'YOUR_SECRET_API_TOKEN'}).base('appXons1wPs6UbioT');
        base('Cart Items').destroy(recordIds, function(err, deletedRecords) {
          if (err) {
            console.error(err);
            return;
          }
          console.log('Deleted', deletedRecords.length, 'records');
        });
    }
    
      console.log("Ezidebit response:", data);
      const cardNumber = document.getElementById("cardNumber").value;
      const receipt_payment_amount = parseFloat(document.getElementById("paymentAmount").value);
  		const receiptTypeCode = getReceiptTypeCode(cardNumber);
        
        // Extracting user details from input fields
        const firstName = document.getElementById("First-Name-2").value;
        const lastName = document.getElementById("Last-Name-2").value;
        const email = document.getElementById("Email-3").value;
        const phone = document.getElementById("Phone-2").value;
        const address = document.getElementById("Home-or-Office-Address-2").value;
        const city = document.getElementById("City-2").value;
        const postcode = document.getElementById("Postcode-2").value;
        const state = document.getElementById("State-2").value;
        const deliveryInst = document.getElementById("Delivery-Instructions-2").value;
        const yourOrderId = document.getElementById("cartID").value;
  
        // Extracting the quick_sale_lines from the hidden input field
        const cartItemsElement = document.getElementById("cartItems");
        const quickSaleLinesJSON = JSON.parse(cartItemsElement.getAttribute("data-items"));
        const quickSaleLines = mapQuickSaleLines(quickSaleLinesJSON); // Apply the mapping function
  
        // Log the quickSaleLines to the console
        console.log("quickSaleLines:", quickSaleLines);
  
        // Quick Sale data
        const quickSaleData = {
          trx_date: new Date().toISOString().split("T")[0],
          your_order_id: yourOrderId,
          delivery_type: "PICKUP",
          receipt_type_code: receiptTypeCode, // Extracted from Ezidebit response
          receipt_amount: receipt_payment_amount,
          bank_payment_reference: data.BankReceiptID,
          bank_auth_reference: data.TransactionID, // Extracted from Ezidebit response
          bill_to_name: `${firstName} ${lastName}`,
          bill_to_address: address,
          bill_to_suburb: city,
          bill_to_region: state,
          bill_to_post_code: postcode,
          bill_to_country: "Australia",
          bill_to_email: email,
          ship_to_phone: phone,
          delivery_instruction: deliveryInst,
          quick_sale_lines: quickSaleLines,
        };
  
 // URL for the Quick Sale endpoint
 const quickSaleUrl = "https://cloud.storman.com/api/v1/facility/SPOGH/quick-sales";

 // Headers for the request
 const headers = {
   "Content-Type": "application/json",
   "Accept": "application/json",
   "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYzJjNzg0YThmMGI2MDY0OGZlNjQxYWIwYjQyYzNjOTM3ZDE1MmIxMDEwYzBmMWJiZjJkNjQyNTA0N2MyZjI2NWFhOTJjYTMyMDI1MTVjZjIiLCJpYXQiOjE2OTA5NTg4MTMuMzk5MDQ3LCJuYmYiOjE2OTA5NTg4MTMuMzk5MDQ5LCJleHAiOjE3MjI1ODEyMTMuMzg5NDg0LCJzdWIiOiIyMzg0Iiwic2NvcGVzIjpbXX0.wJmb5njA7VwPQpiDFsQr0v0FvHB_i0DsrgT6o9kgdqDmflt4VESW89t3p1E7bGpSUNK2XyFS-lvLEVazgD0bSLzZIHyZYoeaSRqPggUTFMm6ZtqR5S53D_rwdA5rTKW-Fn4zgrcUIsdXaEIWigkyn-FqykRsicetsPME9VRyRkSyjIjsmpLcfnZbfc_DTBcmk-WOB3KYBTt5aU4MIR_UQ7TQIJJVs6Bs8wXjv2VBk6r8lx6N-QgtkS9eHG7jA1nCJFQHAGu9d76y-tkaoU56Q-PF76J9PAkB3CGaop3oeEheljZh0tZdxMmFf4BvgXlPnPQnWQF8WGEsxAAmR4XIefpJf-T9fB8NEGqvMd4Lrb6Vyku3pl5pHlLPE902ClziUkrI0h7UB9Vbc6hNbXHDKJcu5Pu_h06xY0qaOol3zZ0qvnBu_S4wzd0BrgEQMJT09blaLBYxA6pIZjoW_LbR7ON8NuOeaVUCUpP9S5HaE5MOtuqd5uRUKWTpDroK79rDCeoJH3_abP1COE2kbyIPDZy9sBin4LmZsqJdUfQ1bXM87vuMbW80nWY_YFGWccGGa-12ip7gBqYCqVpNAz7DRvGvt30EpUWsihlQC6qipw57w0CJecf2ETX57l9xyb2MKhyXF3j0B_LSAayQwfMThKiAWBmtF-6Jmo6EYOOi5c4"
 };

 // Making the POST request to Quick Sale
 fetch(quickSaleUrl, {
   method: "POST",
   headers: headers,
   body: JSON.stringify(quickSaleData)
 })
   .then((response) => response.json())
   .then((data) => {
     // Handle the successful response here
     console.log("Quick Sale successful:", data);
    // Click the hidden success button
    document.getElementById('hiddenSuccessButton').click();
    // Redirect to order confirmation or other actions
    //window.location.href = "/order-confirmation";
   })
   .catch((error) => {
     // Handle any errors here
     console.error("An error occurred:", error);
   });

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
  </script>