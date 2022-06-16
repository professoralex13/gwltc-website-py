const password = document.querySelector('[name="password"]');
const confirmPassword = document.getElementById('confirm-password');
const error = document.getElementById('error');
const check = (e) => {
    if(!confirmPassword.value || confirmPassword.value === password.value) {
        confirmPassword.style.borderColor = '';
        error.innerHTML = '&nbsp;'
    } else {
        e.preventDefault();
        confirmPassword.style.borderColor = 'red';
        error.innerText = 'Passwords do not match!'
    }
}
password.addEventListener('change', check);
document.querySelector('[type="submit"]').addEventListener('click', check);
confirmPassword.addEventListener('change', check);
