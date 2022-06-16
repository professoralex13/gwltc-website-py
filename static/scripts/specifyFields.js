const errorText = document.getElementById('error');
const fields = [...document.getElementsByTagName('input')].filter((field) => field.attributes.getNamedItem('type').value !== 'submit' && field.attributes.getNamedItem('name'));
const [form] = document.getElementsByTagName('form');
form.addEventListener('submit', (e) => {
    const empty = [];
    fields.forEach((field) => {
        if(field.value === '') {
            empty.push(field.attributes.getNamedItem('name').value);
        }
    });
    if(empty.length === 0) {
        errorText.innerHTML = '&nbsp;'
    } else {
        errorText.innerText = `Please Specify ${empty.join(', ')}`
        e.preventDefault();
    }
});
