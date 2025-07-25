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

