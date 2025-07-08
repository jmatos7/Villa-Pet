import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', // ou a porta onde seu frontend está rodando
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Rota para criar uma marcação
app.post('/bookings', async (req, res) => {
  try {
    const booking = await prisma.booking.create({
      data: {
        nomePaiMae: req.body.nomePaiMae,
        nomeAnimal: req.body.nomeAnimal,
        tipoAnimal: req.body.tipoAnimal,
        raca: req.body.raca,
        sexo: req.body.sexo,
        email: req.body.email,
        telefone: req.body.telefone,
        alerta: req.body.alerta,
        data: req.body.data,
        hora: req.body.hora,
        servico: req.body.servico,
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