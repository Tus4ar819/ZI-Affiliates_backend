
const LeadModel = require('../models/leads');
const { ObjectId } = require('mongodb');

async function leadRoutes(fastify, opts) {
  const db = fastify.mongo.db;
  const leads = new LeadModel(db);

  // Get all leads by employeeId
  fastify.get('/by-employee/:empId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { empId } = request.params;
    if (!empId) return reply.code(400).send({ error: 'empId param required' });
    const leadsList = await leads.getLeadsByEmployeeId(empId);
    reply.send(leadsList);
  });

  // Create Lead
  fastify.post('/', { preHandler: [fastify.authenticate], schema: {
    body: {
      type: 'object',
      required: ['name', 'phone', 'email', 'status', 'date'],
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        status: { type: 'string', enum: ['hot', 'warm', 'cold'] },
        notes: { type: 'string' },
        date: { type: 'string', format: 'date' },
        employeeId: { type: 'string' }, // new field for employee id
        pin: { type: 'boolean' } // new field for pin
      }
    }
  }}, async (request, reply) => {
    const userId = request.user.userId;
    // Prefer employeeId from header, fallback to user's empId
    let employeeId = request.headers['employee-id'];
    if (!employeeId) {
      const db = fastify.mongo.db;
      const users = db.collection('users');
      const { ObjectId } = require('mongodb');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      employeeId = user ? user.empId : undefined;
    }
    const lead = await leads.createLead({ ...request.body, userId, employeeId });
    reply.code(201).send(lead);
  });

  // Update Lead (now POST, only updates the field specified in body)
  fastify.post(
  '/update',
  { preHandler: [fastify.authenticate] },
  async (request, reply) => {
    const leadId = request.headers['lead-id'] || request.body.id;
    if (!leadId) {
      return reply
        .code(400)
        .send({ error: 'Lead ID is required (header or body)' });
    }

    const newData = { ...request.body };
    delete newData.id;

    const db = fastify.mongo.db;
    const leadsDb = db.collection('leads');

    const existing = await leadsDb.findOne({ _id: new ObjectId(leadId) });
    if (!existing) {
      return reply.code(404).send({ error: 'Lead not found' });
    }

    const { userId: authUserId, role } = request.user;
    const isAdmin = role === 'admin';
    const isOwner = existing.userId === authUserId;

    if (!isAdmin && !isOwner) {
      return reply
        .code(403)
        .send({ error: 'Not authorized to update this lead' });
    }

    const toReplace = {
      ...newData,
      _id: new ObjectId(leadId),
      userId: existing.userId,
    };

    await leadsDb.replaceOne({ _id: new ObjectId(leadId) }, toReplace);

    const updated = await leadsDb.findOne({ _id: new ObjectId(leadId) });
    reply.send(updated);
  }
);

  // Delete Lead
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = request.user;
  const userId = user.userId;
  const role = user.role;

  let employeeId;

  if (role === 'admin') {
    
    const result = await fastify.mongo.db
      .collection('leads')
      .deleteOne({ leadId: request.params.id });


    return reply.send({ message: 'Lead deleted successfully (admin)' });
  }

  // For non-admin users
  employeeId = request.headers['employee-id'];
  if (!employeeId) {
    const db = fastify.mongo.db;
    const users = db.collection('users');
    const { ObjectId } = require('mongodb');
    const userDoc = await users.findOne({ _id: new ObjectId(userId) });
    employeeId = userDoc ? userDoc.empId : undefined;
  }

  // Only delete if the user owns the lead
  const result = await leads.deleteLead(request.params.id, userId);
  if (result.deletedCount === 0)
    return reply
      .code(404)
      .send({ error: 'Lead not found or not owned by user' });

  reply.send({ message: 'Lead deleted successfully' });
});


  // Get Leads by Status
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    // Get employeeId from header if provided
    let employeeId = request.headers['employee-id'];
    if (!employeeId) {
      const db = fastify.mongo.db;
      const users = db.collection('users');
      const { ObjectId } = require('mongodb');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      employeeId = user ? user.empId : undefined;
    }
    const { status } = request.query;
    if (!status) return reply.code(400).send({ error: 'Status query required' });
    // Optionally, you can filter by employeeId if needed
    const leadsList = await leads.getLeadsByStatus(userId, status);
    reply.send(leadsList);
  });

  // Dashboard Data
  fastify.get('/dashboard', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const data = await leads.getDashboardData(userId);
    reply.send(data);
  });

  // (All other test/debug APIs removed)
}

module.exports = leadRoutes;
