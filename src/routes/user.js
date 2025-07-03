const UserModel = require('../models/user');
const bcrypt = require('bcryptjs');

async function userRoutes(fastify, opts) {
  const db = fastify.mongo.db;
  const users = new UserModel(db);

  // Signup
  fastify.post('/signup', {
    schema: {
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
    const { email, password, name } = request.body;
    const existing = await users.findByEmail(email);
    if (existing) return reply.code(400).send({ error: 'Email already registered' });
    const user = await users.createUser({ email, password, name });
    reply.code(201).send({ id: user._id, empId: user.empId, email: user.email, name: user.name });
  });

  // Login
  fastify.post('/login', {
    schema: {
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
      empId: user.empId
    });
  });
}

module.exports = userRoutes;
