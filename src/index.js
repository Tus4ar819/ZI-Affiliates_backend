const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const userRoutes = require('./routes/user');
const leadRoutes = require('./routes/lead');
const dashboardRoutes = require('./routes/dashboard');
const jwt = require('@fastify/jwt');
const mongodb = require('@fastify/mongodb');
require('dotenv').config();

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

fastify.register(userRoutes, { prefix: '/user' });
fastify.register(leadRoutes, { prefix: '/leads' });
fastify.register(dashboardRoutes);

fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
  if (err) throw err;
  fastify.log.info(`Server running on port 3000}`);
});
