import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { autenticar } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

// __filename (caminho do ficheiro atual)
const __filename = fileURLToPath(import.meta.url);

// __dirname (pasta do ficheiro atual)
const __dirname = path.dirname(__filename);



const app = express();
const prisma = new PrismaClient();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Middleware
app.use(cors({
  origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
  credentials: true
}));


// Duração dos serviços
const serviceDurations = {
  'Banho': 60,
  'Creche': 480,
  'Treino': 90,
  'Tosquia': 45,
  'Spa': 30,
  'Estadia': 1440
};

// Criar utilizador
app.post('/user', async (req, res) => {
  const { nome, email, password, telefone } = req.body;

  if (!nome || !email || !password || !telefone) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    // 1. Verificar se email já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(409).json({ error: 'Email já está em uso' });
    }

    const phoneExistes = await prisma.user.findUnique({ where: { telefone } });
    if (phoneExistes) {
      return res.status(409).json({ error: 'telefone já está em uso' });
    }
    // 2. Criar hash da senha (10 é o custo do salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Criar usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        telefone,
        password: hashedPassword // Armazena o hash, não a senha em texto puro
      }
    });

    // 4. Retornar resposta (removendo a senha hash por segurança)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});


// Criar animal
app.post('/animals', async (req, res) => {
  const { userId, nome, tipo, raca, sexo, idade } = req.body;

  try {
    const animal = await prisma.animal.create({
      data: {
        nome,
        tipo,
        raca,
        sexo,
        idade,
        dono: { connect: { id: userId } }
      }
    });
    res.status(201).json(animal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Criar marcação
app.post('/bookings', async (req, res) => {
  try {
    let { data, hora, servico, userId, animalId, alerta } = req.body;

    if (!userId || !animalId) {
      return res.status(400).json({ message: 'É necessário fornecer userId e animalId.' });
    }

    // Verificar se user e animal existem
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    const animalExists = await prisma.animal.findUnique({ where: { id: animalId } });

    if (!userExists || !animalExists) {
      return res.status(404).json({ message: 'Utilizador ou animal não encontrado.' });
    }

    data = data.split('T')[0];
    const start = new Date(`${data}T${hora}:00`);
    const duration = serviceDurations[servico] || 60;
    const end = new Date(start.getTime() + duration * 60000);

    const bookings = await prisma.booking.findMany({
      where: { servico, data }
    });

    const conflito = bookings.some(b => {
      const bStart = new Date(`${b.data}T${b.hora}:00`);
      const bDuration = serviceDurations[b.servico] || 60;
      const bEnd = new Date(bStart.getTime() + bDuration * 60000);
      return (start < bEnd) && (end > bStart);
    });

    if (conflito) {
      return res.status(409).json({ message: 'Já existe uma marcação para esse serviço nesse horário.' });
    }

    const booking = await prisma.booking.create({
      data: {
        data,
        hora,
        servico,
        alerta,
        user: { connect: { id: userId } },
        animal: { connect: { id: animalId } }
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/user', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user.id, nome: user.nome }, process.env.JWT_SECRET, { expiresIn: '1d' });
  // Enviar token em cookie HttpOnly
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });

  res.json({ nome: user.nome, message: 'Login bem-sucedido' });
});

app.post('/logout', async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sessão terminada' });
});

app.get('/me', autenticar, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      animais: {
        select: { id: true, nome: true }
      },
      bookings: {
        select:{ id :true}
      }
    }
  });

  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

  res.json(user);
});



// Listar todas as marcações com utilizador e animal
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true, animal: true }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/bookings/invalid', async (req, res) => {
  try {
    const result = await prisma.booking.deleteMany({
      where: {
        OR: [
          { userId: null },
          { animalId: null }
        ]
      }
    });
    res.json({ deleted: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar animais de um utilizador
app.get('/users/:id/animals', async (req, res) => {
  try {
    const animals = await prisma.animal.findMany({
      where: { donoId: req.params.id }
    });
    res.json(animals);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar marcações de um utilizador
app.get('/users/:id/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.params.id },
      include: { animal: true }
    });
    res.json(bookings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(3000, () => {
  console.log('Servidor a correr em http://localhost:3000');
});
