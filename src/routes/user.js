const UserModel = require('../models/user');
const bcrypt = require('bcryptjs');

async function userRoutes(fastify, opts) {
  const users = new UserModel(fastify.mongo.db);
 
// Signup (admin only)
fastify.post('/signup', {
  preHandler: [fastify.authenticate],
  schema: {
    consumes: ['application/x-www-form-urlencoded'],
    body: {
      type: 'object',
      required: ['email', 'password', 'name', 'role'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string', minLength: 1 },
        role: { type: 'string', enum: ['user', 'admin'] }
      }
    }
  }
}, async (request, reply) => {
  // Only allow admin to create users
  const requester = await users.findById(request.user?.userId);
  if (!requester || requester.role !== 'admin') {
    return reply.code(403).send({ error: 'Only admin can create users' });
  }
  const { email, password, name, role } = request.body;
  const existing = await users.findByEmail(email);
  if (existing) return reply.code(400).send({ error: 'Email already registered' });
  const user = await users.createUser({ email, password, name, role });
  reply.code(201).send({
    id: user._id,
    empId: user.empId,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

// Login
fastify.post('/login', {
  schema: {
    consumes: ['application/x-www-form-urlencoded'],
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { email, password } = request.body;
  const user = await users.findByEmail(email);
  if (!user) return reply.code(401).send({ error: 'User Not Found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return reply.code(401).send({ error: 'Password is incorrect' });
  const token = fastify.jwt.sign({ userId: user._id });
  reply.send({
    token,
    expiresIn: 259200,
    empId: user.empId,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

// Create Admin (open, only if no admin exists)
fastify.post('/create-admin', {
  schema: {
    consumes: ['application/x-www-form-urlencoded'],
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string', minLength: 1 }
      }
    }
  }
}, async (request, reply) => {
  // Check if any admin exists
  const adminExists = await users.collection.findOne({ role: 'admin' });
  if (adminExists) {
    return reply.code(403).send({ error: 'Admin already exists' });
  }
  const { email, password, name } = request.body;
  const existing = await users.findByEmail(email);
  if (existing) return reply.code(400).send({ error: 'Email already registered' });
  const user = await users.createUser({ email, password, name, role: 'admin' });
  reply.code(201).send({
    id: user._id,
    empId: user.empId,
    email: user.email,
    name: user.name,
    role: user.role
  });
});
}

module.exports = userRoutes;
