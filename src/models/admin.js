const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AdminModel {
  constructor(db) {
    if (!db) {
      throw new Error('MongoDB connection not established');
    }
    db.listCollections({ name: 'admin' }).next((err, collinfo) => {
      if (!collinfo) {
        db.createCollection('admin');
      }
    });
    this.collection = db.collection('admin');
  }

  async createAdmin({ email, password, name, role = 'admin' }) {
    // Generate unique empId
    let empId;
    let exists = true;
    while (exists) {
      empId = 'EMP' + crypto.randomBytes(3).toString('hex').toUpperCase();
      exists = await this.collection.findOne({ empId });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = { empId, email, password: hashedPassword, name, role, createdAt: new Date() };
    const result = await this.collection.insertOne(admin);
    return { ...admin, _id: result.insertedId };
  }

  async findByEmail(email) {
    return this.collection.findOne({ email, role: 'admin' });
  }

  async findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id), role: 'admin' });
  }

  async adminExists() {
    return this.collection.findOne({ role: 'admin' });
  }

  async countAdmins() {
    return this.collection.countDocuments({ role: 'admin' });
  }
}

module.exports = AdminModel;
