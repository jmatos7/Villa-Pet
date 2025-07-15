import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: ['http://127.0.0.1:8080', 'http://127.0.0.1:5500','http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

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
  const { userId, nome, tipo } = req.body;

  if (!userId || !nome || !tipo) {
    return res.status(400).json({ error: 'userId, nome e tipo são obrigatórios.' });
  }

  try {
    const animal = await prisma.animal.create({
      data: {
        nome,
        tipo,
        user: { connect: { id: userId } }
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

  // Aqui podes gerar token ou sessão
  res.json({ message: 'Login bem-sucedido', user: { id: user.id, nome: user.nome } });
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
      where: { userId: req.params.id }
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
  res.send('API Villa Pet a funcionar!');
});

app.listen(3000, () => {
  console.log('Servidor a correr em http://localhost:3000');
});
