const container = document.querySelector('.menu-container');
const menuButton = document.querySelector('.button');
const dropdownMenu = document.getElementById('dropdown-menu');

// Mostrar o botão ao passar com o rato
container.addEventListener('mouseenter', () => {
  menuButton.classList.add('show');
});

container.addEventListener('mouseleave', () => {
  menuButton.classList.remove('show');
  dropdownMenu.classList.remove('show');
});

// Mostrar ou esconder o menu ao clicar no botão
menuButton.addEventListener('click', (e) => {
  e.preventDefault(); // se o botão for um <a>
  dropdownMenu.classList.toggle('show');
});

// Efeito visual ao mover o rato sobre os links
document.querySelectorAll('.dropdown-menu li a').forEach(link => {
  link.addEventListener('mousemove', e => {
    const rect = link.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    link.style.setProperty('--mouse-y', `${y}%`);
  });
});

document.querySelectorAll('.dropdown-menu li a, .paw-button').forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();

    const href = link.tagName === 'A' ? link.href : link.dataset.link;

    if (!document.startViewTransition) {
      window.location.href = href;
      return;
    }

    const pata = document.createElement('div');
    pata.className = 'pata-view';
    document.body.appendChild(pata);

    // Espera a animação terminar (800ms)
    await new Promise(resolve => setTimeout(resolve, 670));

    // Agora inicia a transição
    document.startViewTransition(() => {
      window.location.href = href;
    });
  });
});

async function fetchDogBreeds() {
  const res = await fetch('https://api.thedogapi.com/v1/breeds');
  return await res.json();
}

async function fetchCatBreeds() {
  const res = await fetch('https://api.thecatapi.com/v1/breeds');
  return await res.json();
}

let dogBreeds = [];
let catBreeds = [];

async function loadBreeds() {
  dogBreeds = await fetchDogBreeds();
  catBreeds = await fetchCatBreeds();
}

const breedInput = document.getElementById('animal-race');
const suggestionsBox = document.getElementById('breed-suggestions');


async function tryImageFormats(referenceId, domain) {
  const extensions = ['jpg', 'png', 'webp'];

  for (const ext of extensions) {
    const url = `https://cdn2.${domain}.com/images/${referenceId}.${ext}`;
    try {
      const response = await fetch(url, { method: 'HEAD' }); // HEAD para não descarregar toda a imagem
      if (response.ok) return url;
    } catch (err) {
      console.error(`Erro ao tentar ${url}`);
    }
  }

  return 'https://via.placeholder.com/50'; // fallback
}

function showSuggestions(breeds, query) {
  suggestionsBox.innerHTML = '';

  const selectedType = document.getElementById('tipo-animal').value;

  const filtered = breeds.filter(breed =>
    breed.name.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  filtered.forEach(breed => {
    const div = document.createElement('div');
    div.classList.add('suggestion-item');


    const domain = selectedType === 'cão' ? 'thedogapi' : 'thecatapi';

    const img = document.createElement('img');
    img.src = `https://cdn2.${domain}.com/images/${breed.reference_image_id}.jpg`;
    img.alt = breed.name;
    img.classList.add('breed-image');

    // Nome da raça
    const span = document.createElement('span');
    span.textContent = breed.name;

    div.appendChild(img);
    div.appendChild(span);

    div.addEventListener('click', () => {
      breedInput.value = breed.name;
      suggestionsBox.style.display = 'none';
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = 'block';
}

breedInput.addEventListener('input', () => {
  const selectedType = document.getElementById('tipo-animal').value;
  let breedsToSearch = [];

  if (selectedType === 'cao') {
    breedsToSearch = dogBreeds;
  } else if (selectedType === 'gato') {
    breedsToSearch = catBreeds;
  }

  if (breedInput.value.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  showSuggestions(breedsToSearch, breedInput.value);
});

document.addEventListener('click', (e) => {
  if (e.target !== breedInput && e.target.parentNode !== suggestionsBox) {
    suggestionsBox.style.display = 'none';
  }
});


async function updateProfileInfo() {
  try {
    const res = await fetch('http://localhost:3000/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      } // necessário para enviar cookies
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById('nome').textContent = data.nome || 'N/A';
      document.getElementById('email').textContent = data.email || 'N/A';
      document.getElementById('numero').textContent = data.telefone || 'N/A';
      console.log("Utilizador autenticado:", data);
      return true;
    } else if (res.status === 401) {
      console.warn("Utilizador não autenticado");
      return null;
    } else {
      console.error("Erro inesperado:", res.status);
      return null;
    }
  } catch (err) {
    console.error("Erro na verificação de autenticação:", err);
    return null;
  }
}

window.addEventListener('load', async () => {
  loadBreeds();
  await updateProfileInfo();
});
