import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Token em falta' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // Aqui podes aceder a user.role no handler
    next();
  });
}
