const container = document.querySelector('.menu-container');
const menuButton = document.querySelector('.button-menu');
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

const inputDate = document.getElementById('procura-dia');
const listaHorarios = document.querySelector('.lista-horarios-do-dia');

function setToday() {
    const hoje = new Date().toISOString().split('T')[0];
    inputDate.value = hoje;
    carregarHorarios(hoje);
}

async function carregarHorarios(data) {
    listaHorarios.innerHTML = '';

    let reservasDoDia = [];

    try {
        const res = await fetch(`/bookings/${data}`);
        if (res.ok) {
            reservasDoDia = await res.json();
        } else {
            console.warn('Falha ao buscar marcações do dia.');
        }
    } catch (err) {
        console.error('Erro ao carregar marcações:', err);
    }

    const inicioHora = 8;
    const fimHora = 20;

    for (let hora = inicioHora; hora < fimHora; hora++) {
        for (let min = 0; min < 60; min += 30) {
            const horaStr = hora.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0');
            const reservasNoHorario = reservasDoDia.filter(r => r.hora === horaStr);
            const ocupado = reservasNoHorario.length > 0;

            const li = document.createElement('li');
            li.classList.add('horario-item');
            li.innerHTML = `
    <span class="horario-servico">${horaStr} - ${formatHora(hora, min + 30)} | ${ocupado ? 'Ocupado' : 'Livre'}</span>
`;

            li.addEventListener('click', async () => {
                if (ocupado) {
                    mostrarDetalhesMarcacao(reservasNoHorario);
                } else {
                    li.innerHTML = `
                    <span class="horario-servico">${horaStr} - ${formatHora(hora, min + 30)} | Livre</span>
                `;

                    const { value: clienteInput } = await Swal.fire({
                        title: `Nova marcação às ${horaStr}`,
                        input: 'text',
                        inputLabel: 'Email ou número do cliente',
                        inputPlaceholder: 'Introduz o email ou número',
                        showCancelButton: true,
                        confirmButtonText: 'Continuar'
                    });

                    if (!clienteInput) return;

                    try {
                        const userRes = await fetch('/users/findByEmailOrNumero', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: clienteInput.trim() })
                        });

                        if (!userRes.ok) throw new Error('Cliente não encontrado');

                        const userData = await userRes.json();
                        const userId = userData.id;
                        const animais = userData.animais;

                        if (!animais.length) {
                            Swal.fire('Erro', 'Este cliente não tem animais registados.', 'error');
                            return;
                        }

                        const animalOptions = animais.map(animal =>
                            `<option value="${animal.id}">${animal.nome}</option>`
                        ).join('');

                        const { value: formValues } = await Swal.fire({
                            title: 'Preencher dados da marcação',
                            html: `
                                <label for="swal-select-animal">Animal:</label>
                                <select id="swal-select-animal" class="swal2-select">
                                    ${animalOptions}
                                </select>
                                <label for="swal-input-servico">Selecione um Serviço:</label>
                                <select id="swal-input-servico" required>
                                    <option value="">-- Escolha um serviço --</option>
                                    <option value="Banho">Banho</option>
                                    <option value="Creche">Creche</option>
                                    <option value="Treino">Treino</option>
                                    <option value="Tosquia">Tosquia</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Estadia">Estadia</option>
                                </select>`,
                            focusConfirm: false,
                            preConfirm: () => {
                                return {
                                    animalId: document.getElementById('swal-select-animal').value,
                                    servico: document.getElementById('swal-input-servico').value.trim()
                                };
                            }
                        });

                        if (!formValues.animalId || !formValues.servico) {
                            Swal.fire('Erro', 'Preencha todos os campos.', 'error');
                            return;
                        }

                        const res = await fetch('/bookings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                data: data,
                                hora: horaStr,
                                userId: userId,
                                animalId: formValues.animalId,
                                servico: formValues.servico
                            })
                        });

                        if (res.ok) {
                            Swal.fire('Sucesso!', 'Marcação criada com sucesso.', 'success');
                            carregarHorarios(data); // Atualiza lista
                        } else {
                            Swal.fire('Erro', 'Falha ao criar a marcação.', 'error');
                        }

                    } catch (error) {
                        Swal.fire('Erro', error.message || 'Erro ao processar a marcação.', 'error');
                    }

                }
            });
            listaHorarios.appendChild(li);
        }
    }
}

function mostrarDetalhesMarcacao(reservas) {
    const painelDetalhes = document.querySelector('.detalhes-marcacao');
    if (!painelDetalhes) return;

    if (reservas.length === 0) {
        painelDetalhes.innerHTML = `<p>Nenhuma marcação neste horário.</p>`;
        return;
    }

    let html = `<h3>Detalhes das Marcações (${reservas.length})</h3>`;

    reservas.forEach((reserva, i) => {
        html += `
            <div class="detalhe-marcacao-item" style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                <p><strong>Hora:</strong> ${reserva.hora}</p>
                <p><strong>Serviço:</strong> ${reserva.servico}</p>
                <p><strong>Animal:</strong> ${reserva.animal}</p>
                <p><strong>Dono:</strong> ${reserva.dono}</p>
                <button class="btn-eliminar" style="background-color: #b30000; color: white; border: none;
                border-radius: 8px; margin: 5px; padding: 5px 10px; cursor: pointer;">
                    Eliminar
                </button>
            </div>
        `;
    });

    painelDetalhes.innerHTML = html;
}

function formatHora(hora, min) {
    // Ajusta minutos e horas para o fim do slot (ex: 8:30, 9:00)
    if (min === 60) {
        hora += 1;
        min = 0;
    }
    return hora.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0');
}

inputDate.addEventListener('change', (e) => {
    carregarHorarios(e.target.value);
});


setToday();


document.addEventListener('DOMContentLoaded', () => {
    const staffContainer = document.querySelector('.staff-list-container');
    const searchInput = document.getElementById('search-user');

    // Função simulada para buscar os utilizadores
    async function fetchUsers() {
        try {
            const res = await fetch('http://localhost:3000/user', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Erro ao buscar utilizadores');
            }

            const users = await res.json();
            return users // função que vais criar para mostrar os utilizadores no HTML
        } catch (err) {
            console.error('Erro ao buscar utilizadores:', err);
            return []
        }
    }

    async function loadAndRenderUsers() {
        const users = await fetchUsers(); // users deve vir de fetchUsers()
        renderUsers(users); // usa a função correta
    }

    async function getUser() {
        try {
            const res = await fetch('http://localhost:3000/me', {
                method: 'GET',
                credentials: 'include', // Isto é importante se usares cookies HttpOnly
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Falha ao obter utilizador');
            }

            const currentUser = await res.json();
            return currentUser;

        } catch (error) {
            console.error('Erro ao obter utilizador:', error);
            return null;
        }
    }




    // Função para renderizar os utilizadores
    async function renderUsers(users) {

        const currentUser = await getUser();
        console.log('Current user:', currentUser); // Verifica se está definido

        staffContainer.innerHTML = '';
        users.forEach(user => {
            const card = document.createElement('div');
            card.classList.add('staff-card');
            card.setAttribute('data-user-id', user.id);

            let innerHTML = `
            <p><strong>Nome:</strong> ${user.nome}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Telefone:</strong> ${user.telefone}</p>
            <p><strong>Animais:</strong> <ul>${user.animais.map(animal => `<li>${animal.nome} (${animal.tipo})</li>`).join('')}</ul></p>
            <p><strong>Cargo:</strong> <span class="user-role">${user.staffLevel || user.role}</span></p>
        `;

            const isCurrentUserAdminOrBoss = currentUser && (currentUser.role === 'ADMIN' || currentUser.staffLevel === 'BOSS');
            const isTargetUserAdminOrBoss = user.role === 'ADMIN' || user.staffLevel === 'BOSS';

            if (isCurrentUserAdminOrBoss && !isTargetUserAdminOrBoss) {
                innerHTML += `
                <div class="staff-card-actions">
                    <button class="btn btn-delete">Eliminar</button>
                    <button class="btn btn-change-role">Mudar Cargo</button>
                </div>
            `;
            }

            card.innerHTML = innerHTML;

            if (isCurrentUserAdminOrBoss && !isTargetUserAdminOrBoss) {
                card.querySelector('.btn-delete').addEventListener('click', () => deleteUser(user.id));
                card.querySelector('.btn-change-role').addEventListener('click', () => changeUserRole(user));
            }

            staffContainer.appendChild(card);
        });
    }




    // Função para eliminar utilizador (simulada)
    async function deleteUser(userId) {
        const confirmDelete = window.confirm('Tens a certeza que queres eliminar este utilizador?');
        if (!confirmDelete) return;

        try {
            const res = await fetch(`http://localhost:3000/user/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Erro ao eliminar utilizador');
            }

            console.log(`Utilizador com ID ${userId} eliminado com sucesso.`);

            // Atualizar UI
            loadAndRenderUsers();
        } catch (err) {
            console.error('Erro ao eliminar utilizador:', err);
        }
    }


    // Função para mudar role
    async function changeUserRole(user) {
        const { value: newRole } = await Swal.fire({
            title: `Mudar cargo de ${user.nome}`,
            input: 'select',
            inputOptions: {
                'USER': 'Utilizador',
                'FUNCIONARIO': 'Funcionário',
                'BOSS': 'Boss'
            },
            inputPlaceholder: 'Seleciona o novo cargo',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Tens de escolher um cargo!';
                }
            }
        });

        if (!newRole) return; // Cancelado

        // Define os dados para enviar no PATCH
        let bodyData = {};

        if (newRole === 'USER') {
            // Para user, só altera role e remove staffLevel
            bodyData = { role: 'USER', staffLevel: null };
        } else {
            // Para funcionario ou boss, role fica STAFF e staffLevel o escolhido
            bodyData = { role: 'STAFF', staffLevel: newRole };
        }

        try {
            const res = await fetch(`http://localhost:3000/user/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });

            if (!res.ok) {
                throw new Error('Erro ao mudar o cargo');
            }

            Swal.fire('Alterado!', `O cargo de ${user.nome} foi alterado para ${newRole}.`, 'success');
            loadAndRenderUsers();

        } catch (error) {
            console.error('Erro ao mudar o cargo:', error);
            Swal.fire('Erro!', 'Ocorreu um erro ao tentar mudar o cargo.', 'error');
        }
    }


    // Função de pesquisa
    searchInput.addEventListener('input', async () => {
        const termo = searchInput.value.toLowerCase();
        const allUsers = await fetchUsers();
        const filtrados = allUsers.filter(user =>
            (user.nome && user.nome.toLowerCase().includes(termo)) ||
            (user.email && user.email.toLowerCase().includes(termo)) ||
            (user.telefone && user.telefone.toLowerCase().includes(termo))
        );
        renderUsers(filtrados);
    });

    // Carrega e mostra os utilizadores
    async function loadAndRenderUsers() {
        const users = await fetchUsers();
        renderUsers(users);
    }

    loadAndRenderUsers();
});
