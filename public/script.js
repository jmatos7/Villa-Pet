// FullCalendar
let selectedDate = null;

const serviceDurations = {
    'Banho': 60,     // 60 minutos = 1 hora
    'Creche': 480,   // 2 horas
    'Treino': 90,    // 1h30
    'Tosquia': 45,   // 45 minutos
    'Spa': 30,       // 30 minutos
    'Estadia': 1440  // 24 horas = 1 dia inteira (exemplo)
};

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

document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');
    const user = await getCookie();

    const animalSelect = document.getElementById('myanimal-select');
    const serviceSelect = document.getElementById('service-select');
    const timeList = document.getElementById('time-list'); // Lista UL onde vais mostrar os horários
    let selectedDate = null;
    let selectedTime = null;

    if (!user || !user.animais) {
        Swal.fire({
            title: 'Atenção',
            text: 'Por favor, faça o seu login.',
            icon: 'warning',
            confirmButtonText: 'OK'
        }).then(() => abrirModalLogin());
        return;
    }

    user.animais.forEach(animal => {
        const option = document.createElement('option');
        option.value = animal.id;
        option.textContent = animal.nome;
        animalSelect.appendChild(option);
    });

    async function getBookings() {
        const user = await getCookie();
        console.log("Utilizador atual:", user);
        try {
            const res = await fetch(`http://localhost:3000/users/${user.id}/bookings`, {
                method: 'GET',
            });
            if (!res.ok) throw new Error('Erro ao buscar marcações');
            return await res.json();
        } catch (error) {
            console.error('Erro ao obter bookings:', error);
            return [];
        }
    }


    async function inicializarCalendario() {
        const calendarEl = document.getElementById('calendar');
        const bookings = await getBookings();

        // Transformar marcações para eventos do FullCalendar
        const eventos = bookings.map(b => ({
            title: '', // vazio porque vamos personalizar manualmente
            start: `${b.data}T${b.hora}`,
            allDay: false,
            extendedProps: {
                servico: b.servico,
                animal: b.animal.nome
            }
        }));


        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            selectable: false,
            validRange: {
                start: new Date().toISOString().split('T')[0]
            },
            events: eventos,
            eventDidMount: function (info) {
                const { servico, animal } = info.event.extendedProps;
                info.el.innerHTML = `<div><strong>${servico}</strong><br><span style="font-size: 0.9em;">${animal}</span></div>`;
            },
            dateClick: function (info) {
                const hoje = new Date();
                const dataClicada = new Date(info.dateStr);
                const diaSemana = dataClicada.getDay();

                if (dataClicada < hoje.setHours(0, 0, 0, 0)) {
                    Swal.fire('Data inválida', 'Não é possível marcar para dias anteriores.', 'warning');
                    return;
                }

                if (diaSemana === 0) {
                    Swal.fire('Domingo indisponível', 'Não é possível marcar aos domingos.', 'info');
                    return;
                }

                selectedDate = info.dateStr;
                mostrarHorariosDisponiveis(selectedDate);
            }
        });

        calendar.render();
    }

    inicializarCalendario();

    async function mostrarHorariosDisponiveis(dataSelecionada) {
        const timeList = document.getElementById('time-list');
        timeList.innerHTML = '';

        function gerarHorarios(intervaloMinutos = 30, inicio = '08:00', fim = '17:00') {
            const horarios = [];
            let [hora, minuto] = inicio.split(':').map(Number);
            const [horaFim, minutoFim] = fim.split(':').map(Number);

            while (hora < horaFim || (hora === horaFim && minuto <= minutoFim)) {
                const h = String(hora).padStart(2, '0');
                const m = String(minuto).padStart(2, '0');
                horarios.push(`${h}:${m}`);

                minuto += intervaloMinutos;
                if (minuto >= 60) {
                    minuto -= 60;
                    hora += 1;
                }
            }
            return horarios;
        }


        // Obter marcações existentes
        const response = await fetch('http://localhost:3000/bookings');
        const bookings = await response.json();

        // Filtrar marcações do dia
        const ocupados = bookings
            .filter(b => b.data === dataSelecionada)
            .map(b => b.hora);

        // Horários disponíveis no dia
        const horariosPossiveis = gerarHorarios(30, '08:00', '20:00');


        horariosPossiveis.forEach(hora => {
            const li = document.createElement('li');
            li.classList.add('horario-item');
            li.innerHTML = `<strong>${hora}</strong>`;

            if (ocupados.includes(hora)) {
                li.classList.add('ocupado');
                li.innerHTML += `<span class="estado">Ocupado</span>`;
            } else {
                li.classList.add('disponivel');
                li.innerHTML += `<span class="estado">Disponível</span>`;
                li.addEventListener('click', () => {
                    selectedTime = hora;
                    document.querySelectorAll('#time-list li').forEach(e => e.classList.remove('selected'));
                    li.classList.add('selected');
                });
            }

            timeList.appendChild(li);
        });

        document.getElementById('booking-form').style.display = 'block';
    }


    document.getElementById('booking-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const selectedAnimalId = animalSelect.value;
        const selectedService = serviceSelect.value;

        if (!selectedAnimalId || !selectedTime || !selectedDate || !selectedService) {
            Swal.fire('Atenção', 'Preencha todos os campos.', 'warning');
            return;
        }

        const formData = {
            userId: user.id,
            animalId: selectedAnimalId,
            data: selectedDate,
            hora: selectedTime,
            servico: selectedService,
        };

        try {
            const response = await fetch('http://localhost:3000/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                Swal.fire('Erro!', error.message || 'Não foi possível guardar a marcação.', 'error');
                return;
            }

            Swal.fire('Sucesso!', 'Sua marcação foi registada.', 'success');
            event.target.reset();
            document.getElementById('booking-form').style.display = 'none';
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Falha na marcação.', 'error');
        }
    });
});

