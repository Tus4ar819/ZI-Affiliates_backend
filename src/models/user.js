const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class UserModel {
  constructor(db) {
    if (!db) {
      throw new Error('MongoDB connection not established');
    }
    // Create collection if it doesn't exist
    db.listCollections({ name: 'users' }).next((err, collinfo) => {
      if (!collinfo) {
        db.createCollection('users');
      }
    });
    this.collection = db.collection('users');
  }

  async createUser({ email, password, name, role = 'user' }) {
    // Generate unique empId
    let empId;
    let exists = true;
    while (exists) {
      empId = 'EMP' + crypto.randomBytes(3).toString('hex').toUpperCase();
      exists = await this.collection.findOne({ empId });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { empId, email, password: hashedPassword, name,role, createdAt: new Date() };
    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email) {
    return this.collection.findOne({ email });
  }

  async findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }
}

module.exports = UserModel;
