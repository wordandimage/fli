/*
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
*/