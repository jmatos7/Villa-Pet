export function isAdmin(req, res, next) {
  const user = req.user;

  if (user && user.role === 'ADMIN') {
    next(); // Permite acesso
  } else {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
}

export function hasRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role?.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ error: 'Acesso não autorizado' });
  };
}

