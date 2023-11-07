let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);

// We listen to the resize event
window.addEventListener('resize', () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

const threshold = 0.9 * window.innerHeight;
console.log(window.innerHeight);
console.log(threshold);
console.log(-threshold);

function updateOpacity() {
  const top = document.querySelector('.container');
  const back = document.querySelectorAll('.back');

  if (top.getBoundingClientRect().top < threshold) {
    for (const element of back) {
      element.style.opacity = 0.4;
    }
  } else {
    for (const element of back) {
      element.style.opacity = 1;
    }
  }
}

window.addEventListener('scroll', updateOpacity);
window.addEventListener('load', updateOpacity);