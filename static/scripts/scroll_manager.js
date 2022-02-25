const links = Array.from(document.getElementsByClassName('header-link'));
let targets = [];

links.forEach((link, i) => {
    if(link.attributes.getNamedItem('href').value.length > 1) {
        targets.push(document.getElementById(link.attributes.getNamedItem('href').value.substring(1)));
    }
    link.addEventListener('click', (event) => {
        window.scrollTo({
            top: targets[i - 1].offsetTop - window.innerWidth * 0.03854
        });
        event.preventDefault();
    });
});

window.addEventListener('scroll', () => {
    for (const link of links) {
        link.classList.remove('active');
    }
    let index = targets.length - [...targets].reverse().findIndex((section) => window.scrollY >= section.offsetTop - window.innerWidth * 0.041);
    if(index === targets.length + 1) index = 0;
    links[index].classList.add('active');
});