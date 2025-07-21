
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const formbody = require('@fastify/formbody');
const userRoutes = require('./routes/user');
const leadRoutes = require('./routes/leads');
const LeadModel = require('./models/leads');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const jwt = require('@fastify/jwt');
const mongodb = require('@fastify/mongodb');
require('dotenv').config();


fastify.register(cors, {
  origin: true, // allow any URL
  methods: ["GET", "POST", "DELETE"]
});

// Register formbody to support x-www-form-urlencoded
fastify.register(formbody);

fastify.register(mongodb, {
  forceClose: true,
  url: 'mongodb+srv://admin:admin@ziaffiliatebackend.zjspneb.mongodb.net/zi-affiliates',
});

fastify.register(jwt, {
  secret: 'your_jwt_secret',
  sign: { expiresIn: process.env.JWT_EXPIRES_IN || '3d' },
});

fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
});
fastify.after(() => {
  const LeadModel = require('./models/leads');
  fastify.decorate('leadModel', new LeadModel(fastify.mongo.db)); // ✅ db now safely available
});

fastify.register(adminRoutes, { prefix: '/admin' });
fastify.register(userRoutes, { prefix: '/user' });
fastify.register(leadRoutes, { prefix: '/leads' });
fastify.register(dashboardRoutes);


fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
  if (err) throw err;
  fastify.log.info(`Server running on port 3000}`);
});
// http://localhost:3000/user/login
// http://localhost:3000/user/register
// http://localhost:3000/user/get-user-by-id
// http://localhost:3000/user/get-all-users
// http://localhost:3000/user/update-user
// http://localhost:3000/user/delete-user


