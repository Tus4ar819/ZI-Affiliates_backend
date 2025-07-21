const LeadModel = require('../models/leads');

async function dashboardRoutes(fastify, opts) {
  const db = fastify.mongo.db;
  const leads = new LeadModel(db);

  // Dashboard summary
  fastify.get('/getdata', { preHandler: [fastify.authenticate] }, async (request, reply) => {
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
    const data = await leads.getDashboardData(userId, employeeId);
    reply.send(data);
  });
}

module.exports = dashboardRoutes;
