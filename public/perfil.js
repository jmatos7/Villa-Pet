const container = document.querySelector('.menu-container');
const menuButton = document.querySelector('.button-menu');
const dropdownMenu = document.getElementById('dropdown-menu');
const logoutbtn = document.getElementById('logout');

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


    const domain = selectedType === 'cao' ? 'thedogapi' : 'thecatapi';

    const img = document.createElement('img');
    img.src = `https://cdn2.${domain}.com/images/${breed.reference_image_id}.jpg`;
    console.log(img.src);
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


async function getCookie() {
  try {
    const res = await fetch('http://localhost:3000/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      } // necessário para enviar cookies
    });
    if (res.ok) {
      const data = await res.json()
      return data;
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


logoutbtn.addEventListener('click', async () => {
  try {
    const res = await fetch('http://localhost:3000/logout', {
      method: 'POST', // <-- aqui estava vazio
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      // Redirecionar para a página de login ou homepage
      window.location.href = 'index.html';
    } else {
      console.error('Erro ao fazer logout');
    }
  } catch (err) {
    console.error('Erro na requisição de logout:', err);
  }
});


async function updateProfileInfo() {
  const user = await getCookie();

  document.getElementById('nome').textContent = user.nome || 'N/A';
  document.getElementById('email').textContent = user.email || 'N/A';
  document.getElementById('numero').textContent = user.telefone || 'N/A';

}


async function adicionarAnimal() {

  const user = await getCookie();

  const animalForm = document.getElementById('animal-form');

  animalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nomeanimal = document.getElementById('animal-name').value;
    const tipoanimal = document.getElementById('tipo-animal').value;
    const raca = document.getElementById('animal-race').value;
    const sexo = document.getElementById('sexo').value;
    const idade = parseInt(document.getElementById('animal-age').value, 10);
    const userId = user.id;

    console.log(nomeanimal, tipoanimal, raca, sexo);

    try {
      const res = await fetch('http://localhost:3000/animals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, nome: nomeanimal, tipo: tipoanimal, raca, sexo, idade })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Erro do servidor:", errorData);
        alert(`Erro: ${errorData.error || "Falha no registro"}`);
        return;
      }

      const data = await res.json();

      Swal.fire({
        title: '✅ Animal adicionado!',
        html: `
    <p>Você adicionou o seu animal com sucesso!</p>
    <p style="margin-top: 8px;">Bem vindo <strong>${nomeanimal}</strong></p>
  `,
        icon: 'success',
        imageUrl: './img/bc7d5d5a-d61e-4540-bd0c-8e391be445f0-removebg-preview.png',
        imageWidth: 150,
        confirmButtonText: 'Vamos lá!',
        confirmButtonColor: '#940000',
        background: '#fff',
        color: '#333',
        customClass: {
          title: 'swal2-title-custom',
          popup: 'swal2-popup-custom'
        }
      });

      animalForm.reset();
      await animalList();

    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro ao conectar ao servidor");
    }

  });
}


async function animalList() {
  const user = await getCookie();

  try {
    const res = await fetch(`http://localhost:3000/users/${user.id}/animals`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Erro na resposta do servidor: ${res.status}`);
    }

    const data = await res.json();

    const ul = document.getElementById('animal-ul');
    ul.innerHTML = ''; // limpa lista

    data.forEach(animal => {
      const li = document.createElement('li');

      // Escolher ícone baseado no tipo
      const pawIcon = document.createElement('i');
      pawIcon.style.color = '#940000';
      pawIcon.style.marginRight = '8px';
      pawIcon.style.verticalAlign = 'middle';

      if (animal.tipo.toLowerCase() === 'gato') {
        pawIcon.className = 'fa-solid fa-cat';  // ícone de gato
      } else if (animal.tipo.toLowerCase() === 'cao' || animal.tipo.toLowerCase() === 'cachorro' || animal.tipo.toLowerCase() === 'dog') {
        pawIcon.className = 'fa-solid fa-dog';  // ícone de cachorro
      } else {
        pawIcon.className = 'fa-solid fa-paw';  // ícone padrão
      }

      const name = document.createElement('div');
      name.className = 'animal-name';
      name.textContent = animal.nome;

      const nameContainer = document.createElement('div');
      nameContainer.style.display = 'flex';
      nameContainer.style.alignItems = 'center';
      nameContainer.appendChild(pawIcon);
      nameContainer.appendChild(name);

      const details = document.createElement('div');
      details.className = 'animal-details';
      details.textContent = `Raça:  ${animal.raca} - Sexo: ${animal.sexo} - Idade: ${animal.idade} anos`;

      li.appendChild(nameContainer);
      li.appendChild(details);
      ul.appendChild(li);
    });



    return data;
  } catch (err) {
    console.error("Erro na busca de animal:", err.message);
    return [];
  }
}




window.addEventListener('load', async () => {
  loadBreeds();
  await updateProfileInfo();
  await animalList();
  adicionarAnimal();
});
