const container = document.querySelector('.menu-container'); 
const menuButton = document.querySelector('.button');
const dropdownMenu = document.getElementById('dropdown-menu');

menuButton.addEventListener('click', () => {
  dropdownMenu.classList.toggle('show');
});

container.addEventListener('mouseenter', () => {
  menuButton.classList.add('show');
});

container.addEventListener('mouseleave', () => {
  menuButton.classList.add('show');
});

container.addEventListener('mouseleave', () => {
  dropdownMenu.classList.remove('show');
});

document.querySelectorAll('.dropdown-menu li a').forEach(link => {
  link.addEventListener('mousemove', e => {
    const rect = link.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    link.style.setProperty('--mouse-y', `${y}%`);
  });
});



// Slider de imagens
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.image-container img');
  let currentIndex = 0;

  if (images.length === 0) {
    console.warn("Nenhuma imagem encontrada.");
    return;
  }

  // Garantir que só a imagem atual está visível
  images.forEach((img, i) => {
    img.classList.toggle('active', i === currentIndex);
  });

  function showNextImage() {
    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % images.length;
    images[currentIndex].classList.add('active');
  }

  setInterval(showNextImage, 3000);
});

