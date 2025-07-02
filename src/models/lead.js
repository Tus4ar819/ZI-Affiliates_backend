const { ObjectId } = require('mongodb');
const crypto = require('crypto');

class LeadModel {
  constructor(db) {
    if (!db) {
      throw new Error('MongoDB connection not established');
    }
    // Create collection if it doesn't exist
    db.listCollections({ name: 'leads' }).next((err, collinfo) => {
      if (!collinfo) {
        db.createCollection('leads');
      }
    });
    this.collection = db.collection('leads');
  }

  async createLead(lead) {
    // Generate unique leadId
    let leadId;
    let exists = true;
    while (exists) {
      leadId = 'LEAD' + crypto.randomBytes(4).toString('hex').toUpperCase();
      exists = await this.collection.findOne({ leadId });
    }
    // Ensure leadId is a string and not undefined
    const doc = { ...lead, leadId: String(leadId), createdAt: new Date(), updatedAt: new Date() };
    const result = await this.collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async updateLead(id, userId, update, employeeId) {
    // Accept both MongoDB ObjectId and string leadId
    let leadQuery;
    if (ObjectId.isValid(id) && id.length === 24) {
      leadQuery = { $or: [
        { _id: new ObjectId(id) },
        { leadId: id }
      ] };
    } else {
      leadQuery = { leadId: id };
    }
    // Find the lead first
    const lead = await this.collection.findOne(leadQuery);
    if (!lead) {
      return { error: 'not_found' };
    }
    // Check ownership
    if (lead.userId !== userId || lead.employeeId !== employeeId) {
      return { error: 'ownership' };
    }
    // Update
    const result = await this.collection.findOneAndUpdate(
      { ...leadQuery, userId, employeeId },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    // If result.value is null, fetch the document again to check if update happened
    if (!result.value) {
      const updatedDoc = await this.collection.findOne({ ...leadQuery, userId, employeeId });
      if (updatedDoc) return updatedDoc;
    }
    return result.value;
  }

  async deleteLead(id, userId) {
    // Accept both MongoDB ObjectId and string leadId
    let query;
    if (ObjectId.isValid(id)) {
      query = { $or: [
        { _id: new ObjectId(id), userId },
        { leadId: id, userId }
      ] };
    } else {
      query = { leadId: id, userId };
    }
    return this.collection.deleteOne(query);
  }

  async getLeadsByStatus(userId, status) {
    return this.collection.find({ userId, status }).toArray();
  }

  async getLeadById(id, userId) {
    return this.collection.findOne({ _id: new ObjectId(id), userId });
  }

  async getDashboardData(userId, employeeId) {
    // Aggregation for dashboard, filter by both userId and employeeId if provided
    const filter = { userId };
    if (employeeId) filter.employeeId = employeeId;
    const totalLeads = await this.collection.countDocuments(filter);
    const hotCount = await this.collection.countDocuments({ ...filter, status: 'hot' });
    const warmCount = await this.collection.countDocuments({ ...filter, status: 'warm' });
    const coldCount = await this.collection.countDocuments({ ...filter, status: 'cold' });
    // Monthly reach and profit can be added here
    return { totalLeads, hotCount, warmCount, coldCount };
  }
}

module.exports = LeadModel;
