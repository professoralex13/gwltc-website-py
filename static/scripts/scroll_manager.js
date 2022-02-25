const links = Array.from(document.getElementsByClassName('header-link'));
const [nav] = document.getElementsByTagName('nav');
const navLogo = document.getElementById('nav-logo');
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
    if(window.scrollY >= Math.min(window.innerHeight, window.innerWidth * 0.54) - window.innerWidth * 0.039) {
        nav.classList.add('nav-scrolled');
        navLogo.style.opacity = '1';
    } else {
        nav.classList.remove('nav-scrolled');
        navLogo.classList.remove('nav-logo-active');
        navLogo.style.opacity = '';
    }

    for (const link of links) {
        link.classList.remove('active');
    }
    let index = targets.length - [...targets].reverse().findIndex((section) => window.scrollY >= section.offsetTop - window.innerWidth * 0.039);
    if(index === targets.length + 1) index = 0;
    links[index].classList.add('active');
});