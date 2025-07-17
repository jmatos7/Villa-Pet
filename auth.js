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

