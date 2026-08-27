export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // 1. Validate Name
  if (!name || name.trim() === '') {
    errors.push({
      path: 'name',
      msg: 'Name is required'
    });
  }

  // 2. Simple Email check
  if (!email || !email.includes('@')) {
    errors.push({
      path: 'email',
      msg: 'Please provide a valid email'
    });
  }

  // 3. Validate Password length
  if (!password || password.length < 6) {
    errors.push({
      path: 'password',
      msg: 'Password must be at least 6 characters long'
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({ errors: errors });
  }

  next();
};
