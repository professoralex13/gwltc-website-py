/**
 *   Script for handling Account dropdown menu logic
 */

const button = document.getElementById('account-button');
const dropdown = document.getElementById('account-dropdown');

let open = false;

button.addEventListener('click', (event) => {
   open = !open;
   dropdown.style.opacity = open ? '1' : '0';
   dropdown.style.pointerEvents = 'auto';
   event.preventDefault();
});

document.addEventListener('click', (event) => {
   if (event.target !== dropdown && event.target !== button) {
      open = false;
      dropdown.style.opacity = '0';
      dropdown.style.pointerEvents = 'none';
   }
});