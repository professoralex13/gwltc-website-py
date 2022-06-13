const password = document.querySelector('[name="password"]');
const confirmPassword = document.getElementById('confirm-password');
const error = document.getElementById('error');
const check = () => {
    if(!confirmPassword.value || confirmPassword.value === password.value) {
        confirmPassword.style.borderColor = '';
        error.style.visibility = 'hidden';
    } else {
        confirmPassword.style.borderColor = 'red';
        error.style.visibility = 'visible';
        error.innerText = 'Passwords do not match!'
    }
}
password.addEventListener('change', check);
confirmPassword.addEventListener('change', check);
