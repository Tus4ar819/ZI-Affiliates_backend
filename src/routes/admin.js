const AdminModel = require('../models/admin');
const UserModel = require('../models/user');
const leads = require('../models/lead');
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



  // GET all leads
  fastify.get( '/all-leads',
  { preHandler: [fastify.authenticate] },
  async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied' });
    }
    const leads = await fastify.mongo.db
      .collection('leads')
      .find({})
      .toArray();
    reply.send(leads);
  }
);

fastify.get(
  '/all-status-leads',
  { preHandler: [fastify.authenticate] },
  async (request, reply) => {
    const user = request.user;
    
    // 1. Enforce admin-only access
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied' });
    }

    // 2. Ensure status query is provided
    const { status } = request.query;
    if (!status) {
      return reply.code(400).send({ error: 'Status query required' });
    }

    // 3. Fetch and respond
    try {
      const leadsList = await leads.getLeadsByStatus(user.userId, status);
      reply.send(leadsList);
    } catch (err) {
      request.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
);

  // Update Admin (open, only if no admin exists)

  // other routes...
}

module.exports = adminRoutes;
