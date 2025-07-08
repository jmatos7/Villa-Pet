
function showSidebar() {
    const sidebar = document.querySelector('.container');
    const close = document.querySelector('.close');
    const menu = document.querySelector('.menu');

    sidebar.style.display = 'flex';
    close.style.display = 'flex';
    menu.style.display = 'none';
}

function hideSidebar() {
    const sidebar = document.querySelector('.container');
    const close = document.querySelector('.close');
    const menu = document.querySelector('.menu');

    sidebar.style.display = 'none';
    close.style.display = 'none';
    menu.style.display = 'flex';
}

// Slider de imagens
document.addEventListener('DOMContentLoaded', () => { // Wrap the script in DOMContentLoaded
    const images = document.querySelectorAll('.image-container');
    let currentIndex = 0;

    // Add a check to see if images were found
    if (images.length === 0) {
        console.warn("No images found with the selector '.image-container'");
        return; // Stop execution if no images are found
    }

    // Initially display the first image and add the 'active' class
    images[currentIndex].style.display = 'block';
    images[currentIndex].classList.add('active');

    function showNextImage() {
        // First, hide the currently displayed image
        images[currentIndex].style.display = 'none';
        images[currentIndex].classList.remove('active'); // Remove the active class from the current image

        // Then, update the index to the next image
        currentIndex = (currentIndex + 1) % images.length;

        // Finally, display the next image
        images[currentIndex].style.display = 'block';
        images[currentIndex].classList.add('active'); // Add the active class to the next image
    }

    setInterval(showNextImage, 3000);
});


// FullCalendar
let selectedDate = null;

const serviceDurations = {
  'Banho': 60,     // 60 minutos = 1 hora
  'Creche': 120,   // 2 horas
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

            selectedTime = null;
            selectedService = null;

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
            const start = info.start;
            const horaFormatada = start.toISOString().split('T')[1].substring(0, 5);
            selectedDate = start.toISOString().split('T')[0];
            selectedTime = horaFormatada;
            selectedService = serviceSelect.value;

            if (!selectedService) {
                Swal.fire('Atenção', 'Por favor, selecione um serviço primeiro.', 'warning');
                return;
            }

            document.getElementById('hora-escolhida').innerHTML =
                `<span class="hora-label">Hora selecionada:</span> ${selectedTime} (${selectedService})`;

            document.getElementById('booking-form').style.display = 'block';

            // Remover fundo anterior, se houver
            calendar.getEvents().forEach(e => {
                if (e.extendedProps && e.extendedProps.temporaryHighlight) {
                    e.remove();
                }
            });

            

            // Adicionar um "evento de fundo" para destacar o slot
            calendar.addEvent({
                start: info.start,
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

        const formData = {
            nomePaiMae: document.getElementById('nome-pai-mae').value,
            nomeAnimal: document.getElementById('nome-animal').value,
            tipoAnimal: document.getElementById('tipo-animal').value,
            raca: document.getElementById('raca').value,
            sexo: document.getElementById('sexo').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            alerta: document.getElementById('alerta').value,
            data: selectedDate,
            hora: selectedTime,
            servico: selectedService,
        };

        try {
            const response = await fetch('http://localhost:3000/bookings', {  // Corrigido o endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao guardar a marcação');
            }

            const booking = await response.json();

            calendar.addEvent({
                title: booking.servico,
                start: booking.hora,
                allDay: false
            });

            Swal.fire({
                title: 'Sucesso!',
                text: 'Sua marcação foi registada.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            event.target.reset();
            document.getElementById('booking-form').style.display = 'none';
            //mostrarHorarios(selectedDate);

        } catch (error) {
            console.error(error);
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
                // Certifique-se que a hora está no formato correto
                const horaCompleta = `${booking.data}`;

                calendar.addEvent({
                    title: `${booking.servico} - ${booking.nomeAnimal}`,
                    start: horaCompleta,
                    end: horaCompleta, // Se necessário, ajuste o final para o horário correto
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
