/**
 * Script for handling validation logic for signup form
 */

const password = document.querySelector('[name="password"]');
const confirmPassword = document.getElementById('confirm-password');
const phoneNumber = document.querySelector('[type="tel"]');

confirmPassword.addEventListener('keypress', (e) => {
    e.target.setCustomValidity('');
})

phoneNumber.addEventListener('keypress', (e) => {
    e.target.setCustomValidity('');
});

document.querySelector('[type="submit"]').addEventListener('click', (e) => {
    if ((!confirmPassword.value && e.target.attributes.getNamedItem('type').value !== 'submit') || confirmPassword.value === password.value) {
        confirmPassword.setCustomValidity('');
    } else {
        e.preventDefault();
        confirmPassword.setCustomValidity('Passwords do not match');
        confirmPassword.reportValidity();
    }
    if (/^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(phoneNumber.value)) {
        phoneNumber.setCustomValidity('');
    } else {
        e.preventDefault();
        phoneNumber.setCustomValidity('Invalid phone number format');
        phoneNumber.reportValidity();
    }
});
