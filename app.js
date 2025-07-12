import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
const allowedOrigins = [
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const serviceDurations = {
  'Banho': 60,     // 60 minutos = 1 hora
  'Creche': 480,   // 2 horas
  'Treino': 90,    // 1h30
  'Tosquia': 45,   // 45 minutos
  'Spa': 30,       // 30 minutos
  'Estadia': 1440  // 24 horas = 1 dia inteira (exemplo)
};

// Rota para criar uma marcação
app.post('/bookings', async (req, res) => {
  try {
    let { data, hora, servico, ...rest } = req.body;

    // Extrai só a data (YYYY-MM-DD) se vier timestamp completo
    data = data.split('T')[0];

    const start = new Date(`${data}T${hora}:00`);
    const duration = serviceDurations[servico] || 60;
    const end = new Date(start.getTime() + duration * 60000);

    // Buscar marcações do mesmo serviço e data (apenas data)
    const bookingsOnDate = await prisma.booking.findMany({
      where: {
        servico,
        data, // só o dia, sem hora
      }
    });

    // Verificar conflito de horários
    const conflito = bookingsOnDate.some(b => {
      const bStart = new Date(`${b.data}T${b.hora}:00`);
      const bDuration = serviceDurations[b.servico] || 60;
      const bEnd = new Date(bStart.getTime() + bDuration * 60000);

      return (start < bEnd) && (end > bStart);
    });

    if (conflito) {
      return res.status(409).json({ message: 'Já existe uma marcação para esse serviço nesse horário.' });
    }

    // Criar marcação normalmente
    const booking = await prisma.booking.create({
      data: {
        ...rest,
        data,
        hora,
        servico,
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Rota para obter todas as marcações
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para testar a API
app.get('/', (req, res) => {
  res.send('Bem-vindo à API do Villa Pet!');
});

app.listen(3000, () => {
  console.log('Servidor a correr em http://localhost:3000');
});