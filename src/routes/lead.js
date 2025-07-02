const LeadModel = require('../models/lead');

async function leadRoutes(fastify, opts) {
  const db = fastify.mongo.db;
  const leads = new LeadModel(db);

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
        employeeId: { type: 'string' } // new field for employee id
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
  fastify.post('/update', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id, field, value } = request.body;
    if (!id || !field || typeof value === 'undefined') {
      return reply.code(400).send({ error: 'id, field, and value are required in body' });
    }
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
    // Only update the specified field
    const updateObj = { [field]: value };
    const updated = await leads.updateLead(id, userId, { ...updateObj, employeeId }, employeeId);
    if (updated && updated.error === 'not_found') {
      return reply.code(404).send({ error: 'Lead not found (invalid leadId or _id)' });
    }
    if (updated && updated.error === 'ownership') {
      return reply.code(403).send({ error: 'Lead exists but not owned by this employeeId or user' });
    }
    if (!updated) {
      return reply.code(404).send({ error: 'Lead not found or not owned by user/employee' });
    }
    reply.send(updated);
  });

  // Delete Lead
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
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
    // Optionally, you can use employeeId for extra validation or logging
    const result = await leads.deleteLead(request.params.id, userId);
    if (result.deletedCount === 0) return reply.code(404).send({ error: 'Lead not found or not owned by user' });
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
