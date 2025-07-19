const AdminModel = require('../models/admin');
const UserModel = require('../models/user');
const bcrypt = require('bcryptjs');

async function adminRoutes(fastify, opts) {
  const admins = new AdminModel(fastify.mongo.db);

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
    // Allow up to 3 admins
    const adminCount = await admins.countAdmins();
    if (adminCount >= 3) {
      return reply.code(403).send({ error: 'Maximum number of admins reached' });
    }
    const { email, password, name } = request.body;
    const existing = await admins.findByEmail(email);
    if (existing) return reply.code(400).send({ error: 'Email already registered' });
    const admin = await admins.createAdmin({ email, password, name });
    reply.code(201).send({
      id: admin._id,
      empId: admin.empId,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });
  });
  
}

module.exports = adminRoutes;
