const body = document.querySelector('body');


const button = document.createElement('button');
button.setAttribute('class', 'button');
button.innerText = 'click me!';


button.addEventListener(('mouseenter'), () => {
    button.style.backgroundColor = 'green';
    button.style.marginLeft = button.style.marginLeft + '20px';
    return;
});


button.addEventListener(('mouseleave'), () => {
    button.style.backgroundColor = 'crimson';
    button.style.marginLeft = '400px';
    return;
});


body.appendChild(button);

console.log(body, button, 'children')
