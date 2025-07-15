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

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    let selectedTime = null;
    let selectedService = null;

    const selectedDateElement = document.getElementById('selected-date');
    const serviceSelect = document.getElementById('service-select');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt',
        selectable: true,
        selectMirror: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotMinTime: '08:00:00',  // Começa às 9h
        slotMaxTime: '20:00:00',  // Termina às 17h
        businessHours: {          // Destacar horário comercial
            daysOfWeek: [1, 2, 3, 4, 5], // Segunda a sexta
            startTime: '08:00',   // Começa às 9h
            endTime: '20:00'      // Termina às 17h
        },
        validRange: {
            start: new Date().toISOString().split('T')[0] // restringe a data mínima para hoje
        },
        dateClick: function (info) {
            selectedDate = info.dateStr;
            calendar.gotoDate(info.date);
            calendar.changeView('timeGridDay');

            const horarioISO = `${selectedDate}T${toString().padStart(2, '0')}:00`;
            const horaFormatada = horarioISO.split('T')[1].substring(0, 5);

            const eventos = calendar.getEvents();
            const ocupado = eventos.some(evento =>
                evento.startStr === horaFormatada ||
                (evento.start && evento.start.toISOString().startsWith(horarioISO)
                ));

            if (!ocupado) {

                textContent = horaFormatada;
                horario = horarioISO;

                // Remove seleção anterior
                document.querySelectorAll('#time-list li.selected').forEach(item => {
                    item.classList.remove('selected');
                });

                // Adiciona seleção
                selectedTime = horaFormatada;
                console.log(selectedTime);
                selectedService = serviceSelect.value;

                if (!selectedService) {
                    Swal.fire('Atenção', 'Por favor, selecione um serviço primeiro.', 'warning');
                    return;
                }

            }
        },
        select: function (info) {
            if (!info.start || !info.end) {
                Swal.fire('Atenção', 'Por favor, selecione um horário válido.', 'warning');
                return;
            }
            const start = info.start;
            console.log("Data selecionada:", start);
            const horaFormatada = start.toISOString().split('T')[1].substring(0, 5);
            selectedDate = start.toISOString().split('T')[0];
            selectedTime = horaFormatada;
            selectedService = serviceSelect.value;

            if (!selectedService) {
                Swal.fire('Atenção', 'Por favor, selecione um serviço primeiro.', 'warning');
                return;
            }

            document.getElementById('booking-form').style.display = 'block';

            // Remover fundo anterior, se houver
            calendar.getEvents().forEach(e => {
                if (e.extendedProps && e.extendedProps.temporaryHighlight) {
                    e.remove();
                }
            });

            const durationMinutes = serviceSelect.value
                ? serviceDurations[selectedService]
                : 60; // valor padrão 60 minutos (1 hora) se não tiver seleção

            const durationHours = durationMinutes / 60;

            const endTime = new Date(start);
            endTime.setHours(endTime.getHours() + durationHours);

            endTime.setMinutes(endTime.getMinutes() + (serviceDurations[selectedService] % 60));
            // Adicionar um "evento de fundo" para destacar o slot
            calendar.addEvent({
                start: info.start,
                end: endTime,
                display: 'background',
                color: '#FFD700', // Amarelo ouro
                temporaryHighlight: true
            });
        },

        dayMaxEvents: true
    });

    calendar.render();

    document.getElementById('booking-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        console.log("Data selecionada:", selectedDate);

        const userId = localStorage.getItem('userId');
        const animalId = document.getElementById('animal-select').value;

        const formData = {
            userId: userId,
            animalId: animalId,
            data: selectedDate,
            hora: selectedTime,
            servico: selectedService,
        };

        try {
            if (!selectedDate || !selectedTime || !selectedService) {
                Swal.fire('Atenção', 'Por favor, selecione data, hora e serviço.', 'warning');
                return;
            }
            const response = await fetch('http://localhost:3000/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                Swal.fire('Erro!', error.message || 'Não foi possível guardar a marcação.', 'error');
                return;
            }

            const booking = await response.json();
            const data = booking.data;
            const hora = booking.hora;
            const servico = booking.servico;

            const start = new Date(`${data}T${hora}:00`);
            const duration = serviceDurations[servico] || 60;
            const end = new Date(start.getTime() + duration * 60000);

            calendar.addEvent({
                title: booking.servico,
                start: start,
                end: end,
                allDay: false,
                color: getServiceColor(booking.servico)
            });


            Swal.fire({
                title: 'Sucesso!',
                text: 'Sua marcação foi registada.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            event.target.reset();
            document.getElementById('booking-form').style.display = 'none';

        } catch (error) {
            console.error(error);
            console.log(error.message);
            Swal.fire('Erro!', error.message || 'Não foi possível guardar a marcação.', 'error');
        }
    });

    fetch('http://localhost:3000/bookings')
        .then(res => {
            if (!res.ok) throw new Error('Erro ao carregar marcações');
            return res.json();
        })
        .then(bookings => {
            bookings.forEach(booking => {
                const data = booking.data;
                const hora = booking.hora;
                const servico = booking.servico;

                const start = new Date(`${data}T${hora}:00`);
                const duration = serviceDurations[servico] || 60;
                const end = new Date(start.getTime() + duration * 60000);

                calendar.addEvent({
                    title: `${booking.servico}`,
                    start: start,
                    end: end,
                    allDay: false,
                    color: getServiceColor(booking.servico), // Adiciona cor conforme o serviço
                    extendedProps: {
                        details: booking // Guarda todos os detalhes
                    }
                });
            });
        })
        .catch(err => {
            console.error('Erro:', err);
            Swal.fire('Erro', 'Não foi possível carregar as marcações', 'error');
        });

    function getServiceColor(servico) {
        const colors = {
            'Banho': '#FF5733',
            'Creche': '#33FF57',
            'Treino': '#3357FF',
            'Tosquia': '#F033FF',
            'Spa': '#33FFF3',
            'Estadia': '#FF33F5'
        };
        return colors[servico] || '#940000'; // Cor padrão se não encontrado
    }
});
