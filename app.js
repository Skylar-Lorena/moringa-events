/* ==========================================================
   Moringa School Events Hub - script.js
   1. "Explore event" buttons show and hide extra details
   2. "Book now" buttons open a DEMO checkout (no real payments)
   ========================================================== */

/* ---------- 1. Explore buttons ---------- */

// Find every Explore button on the page
const exploreButtons = document.querySelectorAll('.explore-btn');

// Do the same thing for each button
exploreButtons.forEach(function (button) {
  // When the button is clicked...
  button.addEventListener('click', function () {
    // Find the hidden details panel this button controls (its id is stored in aria-controls)
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    // Check whether the panel is open right now
    const isOpen = button.getAttribute('aria-expanded') === 'true';

    // Tell screen readers the new state (open or closed)
    button.setAttribute('aria-expanded', String(!isOpen));
    // Show the panel if it was closed, hide it if it was open
    panel.hidden = isOpen;
    // Change the button text to match
    button.textContent = isOpen ? 'Explore event' : 'Show less';
  });
});

/* ---------- 2. Demo checkout ---------- */

// Grab the checkout elements we need (each id is in index.html)
const dialog = document.getElementById('checkout');
const form = document.getElementById('checkout-form');
const eventNameEl = document.getElementById('checkout-event');
const priceEl = document.getElementById('checkout-price');
const noteEl = document.getElementById('checkout-note');
const quantityLabel = document.getElementById('quantity-label');
const quantityInput = document.getElementById('quantity');
const paymentOptions = document.getElementById('payment-options');
const mobileFields = document.getElementById('mobile-fields');
const phoneInput = document.getElementById('phone');
const totalEl = document.getElementById('checkout-total');
const statusEl = document.getElementById('checkout-status');
const submitButton = document.getElementById('checkout-submit');
const resultBox = document.getElementById('checkout-result');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultCode = document.getElementById('result-code');

// Remembers which event the person is booking (filled in when they click "Book now")
let currentEvent = null;

// Turn a number into text like "KES 1,500" (or "Free" for zero)
function formatMoney(amount) {
  if (amount === 0) {
    return 'Free';
  }
  return 'KES ' + amount.toLocaleString('en-KE');
}

// Read the quantity box safely: always a whole number from 1 to 5
function getQuantity() {
  const number = parseInt(quantityInput.value, 10) || 1;
  return Math.min(5, Math.max(1, number));
}

// Work out the total price
function getTotal() {
  return currentEvent.price * getQuantity();
}

// Is this event free?
function isFree() {
  return currentEvent.price === 0;
}

// Which payment method is selected: "gate" or "mobile"
function getMethod() {
  return form.elements['method'].value;
}

// Make a fake booking code such as MSH-4821
function makeCode() {
  return 'MSH-' + Math.floor(1000 + Math.random() * 9000);
}

// Refresh the total, the phone box and the button text to match the choices made
function updateForm() {
  const total = getTotal();
  const useMobile = !isFree() && getMethod() === 'mobile';

  // Show the total
  totalEl.textContent = formatMoney(total);

  // Show the phone box only for mobile pay, and only require it then
  mobileFields.hidden = !useMobile;
  phoneInput.required = useMobile;

  // Change the main button text to match what will happen
  if (isFree()) {
    submitButton.textContent = 'Reserve my spot';
  } else if (useMobile) {
    submitButton.textContent = 'Pay ' + formatMoney(total) + ' (demo)';
  } else {
    submitButton.textContent = 'Reserve and pay at the gate';
  }
}

// Show the final confirmation message instead of the form
function showResult(title, message, code) {
  form.hidden = true;
  resultBox.hidden = false;
  resultTitle.textContent = title;
  resultMessage.textContent = message;
  resultCode.textContent = code;
  // Move keyboard and screen reader focus to the confirmation heading
  resultTitle.focus();
}

// When any "Book now" button is clicked, open the checkout for that event
document.querySelectorAll('.book-btn').forEach(function (button) {
  button.addEventListener('click', function () {
    // Read the event details stored on the button (data-event, data-price, data-unit, data-note)
    currentEvent = {
      name: button.dataset.event,
      price: Number(button.dataset.price),
      unit: button.dataset.unit || 'ticket',
      note: button.dataset.note || ''
    };

    // Start with a clean form each time
    form.reset();
    form.hidden = false;
    resultBox.hidden = true;
    statusEl.textContent = '';
    submitButton.disabled = false;

    // Fill in the event details
    eventNameEl.textContent = currentEvent.name;
    priceEl.textContent = isFree() ? 'Free event' : formatMoney(currentEvent.price) + ' per ' + currentEvent.unit;
    quantityLabel.textContent = 'Number of ' + currentEvent.unit + 's';
    noteEl.textContent = currentEvent.note;
    noteEl.hidden = currentEvent.note === '';

    // Free events do not need a payment method
    paymentOptions.hidden = isFree();

    updateForm();
    // Open the pop-up (showModal also dims the page behind it)
    dialog.showModal();
  });
});

// Update the total and button whenever the quantity or payment method changes
form.addEventListener('input', updateForm);
form.addEventListener('change', updateForm);

// When the form is submitted (the browser has already checked required fields and the phone pattern)
form.addEventListener('submit', function (event) {
  // Stop the page from reloading, because this is only a demo
  event.preventDefault();

  const total = getTotal();
  const code = makeCode();

  if (isFree()) {
    // Free event: just reserve the spot
    showResult('Spot reserved!', 'See you at the event. Show your booking code at the entrance.', code);
  } else if (getMethod() === 'gate') {
    // Pay at the gate: reserve now, pay later
    showResult(
      'Spot reserved!',
      'Please pay ' + formatMoney(total) + ' at the gate when you arrive. Show your booking code at the entrance.',
      code
    );
  } else {
    // Mobile pay: pretend to send a prompt, wait 2 seconds, then confirm
    submitButton.disabled = true;
    statusEl.textContent = 'Sending a demo payment request to your phone...';

    setTimeout(function () {
      showResult(
        'Demo payment received!',
        'Pretend ' + formatMoney(total) + ' was paid from the phone number you entered. No real money moved. Show your booking code at the entrance.',
        code
      );
    }, 2000);
  }
});

// Any element with data-close closes the checkout
document.querySelectorAll('[data-close]').forEach(function (button) {
  button.addEventListener('click', function () {
    dialog.close();
  });
});

// Clicking the dimmed area outside the white box also closes it
dialog.addEventListener('click', function (event) {
  if (event.target === dialog) {
    dialog.close();
  }
});