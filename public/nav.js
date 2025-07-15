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

const modal = document.getElementById('loginModal');
const openModalBtn = document.querySelector('.paw-button');
const closeModalBtn = document.getElementById('closeModal');

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Abrir modal no click do botão "paw-button"
openModalBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
});

// Fechar modal no X
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
});

// Fechar modal clicando fora do conteúdo
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
});

// Alternar tabs
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginTab.setAttribute('aria-selected', 'true');
  registerTab.setAttribute('aria-selected', 'false');
  loginForm.classList.add('active');
  registerForm.classList.remove('active');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerTab.setAttribute('aria-selected', 'true');
  loginTab.setAttribute('aria-selected', 'false');
  registerForm.classList.add('active');
  loginForm.classList.remove('active');
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const telefone = document.getElementById('registerPhone').value; // Certifique-se que esse campo existe!

  console.log("Dados a serem enviados:", { nome, email, password, telefone }); // Verifique no console

  try {
    const res = await fetch('http://localhost:3000/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password, telefone })
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Erro do servidor:", errorData);
      alert(`Erro: ${errorData.error || "Falha no registro"}`);
      return;
    }

    const data = await res.json();
    console.log("Sucesso:", data);
    alert("Registro efetuado com sucesso!");
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    registerForm.reset();

  } catch (err) {
    console.error("Erro na requisição:", err);
    alert("Erro ao conectar ao servidor");
  }
});


loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;


  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Erro do servidor:", errorData);
      alert(`Erro: ${errorData.error || "Falha no Login"}`);
      return;
    }

    const data = await res.json();
    alert("Login efetuado com sucesso!");
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    loginForm.reset();

  } catch (err) {
    console.error("Erro na requisição:", err);
    alert("Erro ao conectar ao servidor");
  }

});
