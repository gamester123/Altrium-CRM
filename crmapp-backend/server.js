require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ========== SCHEMAS ==========

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['rep', 'manager', 'leadership', 'marketing', 'admin'], default: 'rep' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: String,
  address: { street: String, city: String, country: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByNameSnapshot: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});
companySchema.index({ name: 'text' });
companySchema.index({ deletedAt: 1 });

const Company = mongoose.model('Company', companySchema);

const contactSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  companyNameSnapshot: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  jobTitle: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerNameSnapshot: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});

contactSchema.index({ companyId: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ ownerId: 1, deletedAt: 1 });

const Contact = mongoose.model('Contact', contactSchema);


const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  source: String,
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new' },
  temperature: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },
  lastActivityAt: { type: Date, default: Date.now },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  convertedToContactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
  convertedToDealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});
leadSchema.index({ status: 1, ownerId: 1 });
leadSchema.index({ temperature: 1 });
leadSchema.index({ deletedAt: 1 });

const Lead = mongoose.model('Lead', leadSchema);

// Minimal Deal schema — full CRUD comes in Story 6, but convert (below)
// needs to create real Deal documents now.
const dealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  value: { type: Number, default: 0 },
  stage: { type: String, enum: ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'], default: 'new' },
  temperature: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  companyNameSnapshot: String,
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  contactNameSnapshot: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerNameSnapshot: String,
  lastActivityAt: { type: Date, default: Date.now },
  expectedCloseDate: Date,
  stageHistory: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }
});
dealSchema.index({ stage: 1, ownerId: 1, deletedAt: 1 });

const Deal = mongoose.model('Deal', dealSchema);


const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['call', 'email', 'meeting', 'note', 'stage_change', 'reassignment'], required: true },
  notes: { type: String, required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loggedAt: { type: Date, default: Date.now }
});
activitySchema.index({ dealId: 1, loggedAt: -1 });
activitySchema.index({ contactId: 1, loggedAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);





const reminderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  isDone: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});
reminderSchema.index({ ownerId: 1, isDone: 1, dueDate: 1 });
reminderSchema.index({ dealId: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

// ========== MIDDLEWARE ==========

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized for this action' });
  }
  next();
};

// Central error handler — never leak raw Mongo/Mongoose errors to the client (SCRUM-5 AC13)
function sendError(res, err) {
  console.error(err); // full detail still lands in your terminal for debugging

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(400).json({ error: `That ${field} is already in use` });
  }

  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

// ========== AUTH ROUTES (Story 1) ==========

app.post('/api/auth/register', async (req, res) => {
  return res.status(403).json({ error: 'Public registration is disabled. Contact an administrator to create an account.' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deletedAt: null });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(401).json({ error: 'Account is deactivated' });

    const privilegedRoles = ['manager', 'leadership', 'admin'];
    if (privilegedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Management accounts must sign in through the management login' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    return sendError(res, err);
  }
});

// POST /api/auth/admin-login - privileged login for manager/leadership/admin only
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deletedAt: null });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const privilegedRoles = ['manager', 'leadership', 'admin'];
    if (!privilegedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized for management access' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    return sendError(res, err);
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id, deletedAt: null });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return sendError(res, err);
  }
});

// PUT /api/auth/password - any signed-in user changes their own password
app.put('/api/auth/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    const user = await User.findOne({ _id: req.user.id, deletedAt: null });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// ========== USER MANAGEMENT (Story 2 / AC3 — admin only) ==========

app.get('/api/users', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { deletedAt: null };
    const total = await User.countDocuments(query);
    const users = await User.find(query).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    res.json({
      data: users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive })),
      total
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// POST /api/users - admin creates an account for someone else
app.post('/api/users', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const validRoles = ['rep', 'manager', 'leadership', 'marketing', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, role });
    await user.save();

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return sendError(res, err);
  }
});
app.patch('/api/users/:id/role', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['rep', 'manager', 'leadership', 'marketing', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const target = await User.findOne({ _id: req.params.id, deletedAt: null });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'admin') {
      return res.status(403).json({ error: "Cannot change another admin's role" });
    }

    target.role = role;
    await target.save();
    res.json({ id: target._id, role: target.role });
  } catch (err) {
    return sendError(res, err);
  }
});

// Soft delete (deactivate) — admin only
app.delete('/api/users/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

    const target = await User.findOne({ _id: req.params.id, deletedAt: null });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete or deactivate another admin' });
    }

    target.deletedAt = new Date();
    target.isActive = false;
    await target.save();
    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// Hard delete (permanent) — admin only
app.delete('/api/users/:id/permanent', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete or deactivate another admin' });
    }

    const [dealCount, contactCount, leadCount] = await Promise.all([
      Deal.countDocuments({ ownerId: target._id }),
      Contact.countDocuments({ ownerId: target._id }),
      Lead.countDocuments({ ownerId: target._id })
    ]);
    const ownedRecordCount = dealCount + contactCount + leadCount;

    if (ownedRecordCount > 0) {
      const { reassignTo } = req.body;

      if (!reassignTo) {
        return res.status(400).json({
          error: `This user owns ${ownedRecordCount} record(s) (${dealCount} deals, ${contactCount} contacts, ${leadCount} leads). Provide "reassignTo" with another user's id to transfer ownership before deleting.`
        });
      }

      if (reassignTo === target._id.toString()) {
        return res.status(400).json({ error: 'Cannot reassign records to the user being deleted' });
      }

      const newOwner = await User.findOne({ _id: reassignTo, deletedAt: null });
      if (!newOwner) {
        return res.status(400).json({ error: 'reassignTo user not found or inactive' });
      }

      await Deal.updateMany(
        { ownerId: target._id },
        { ownerId: newOwner._id, ownerNameSnapshot: newOwner.name }
      );
      await Contact.updateMany({ ownerId: target._id }, { ownerId: newOwner._id });
      await Lead.updateMany({ ownerId: target._id }, { ownerId: newOwner._id });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// ========== COMPANY MANAGEMENT (Story 3) ==========

app.get('/api/companies', authMiddleware, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = { deletedAt: null };
    if (search) query.name = { $regex: search, $options: 'i' };
    const total = await Company.countDocuments(query);
    const companies = await Company.find(query).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
        res.json({
      data: companies.map(c => ({
        id: c._id, name: c.name, industry: c.industry, address: c.address,
        createdBy: c.createdBy, createdByNameSnapshot: c.createdByNameSnapshot
      })),
      total
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.get('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({
      id: company._id, name: company.name, industry: company.industry, address: company.address,
      createdAt: company.createdAt, createdBy: company.createdBy, createdByNameSnapshot: company.createdByNameSnapshot
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.post('/api/companies', authMiddleware, async (req, res) => {
  try {
    const { name, industry, address } = req.body;
    const creator = await User.findById(req.user.id);
    const company = new Company({
      name, industry, address,
      createdBy: req.user.id,
      createdByNameSnapshot: creator ? creator.name : ''
    });
    await company.save();
    res.json({
      id: company._id, name: company.name, industry: company.industry,
      createdBy: company.createdBy, createdByNameSnapshot: company.createdByNameSnapshot
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const { name, industry, address } = req.body;
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { name, industry, address, updatedAt: new Date() },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ id: company._id, name: company.name, industry: company.industry });
  } catch (err) {
    return sendError(res, err);
  }
});

// Soft delete — admin only, cascades to the company's contacts and deals
app.delete('/api/companies/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const now = new Date();
    await Contact.updateMany({ companyId: company._id, deletedAt: null }, { deletedAt: now });
    await Deal.updateMany({ companyId: company._id, deletedAt: null }, { deletedAt: now });

    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// Hard delete (permanent) — admin only, fully cascades: contacts, deals, and their activities/reminders
app.delete('/api/companies/:id/permanent', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const contacts = await Contact.find({ companyId: company._id }, '_id');
    const contactIds = contacts.map(c => c._id);

    const deals = await Deal.find({ companyId: company._id }, '_id');
    const dealIds = deals.map(d => d._id);

    // Activities can reference a dealId, a contactId, or both — catch all of them
    await Activity.deleteMany({
      $or: [
        { dealId: { $in: dealIds } },
        { contactId: { $in: contactIds } }
      ]
    });

    // Same for reminders
    await Reminder.deleteMany({
      $or: [
        { dealId: { $in: dealIds } },
        { contactId: { $in: contactIds } }
      ]
    });

    await Contact.deleteMany({ companyId: company._id });
    await Deal.deleteMany({ companyId: company._id });

    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// ========== CONTACT MANAGEMENT (Story 4) ==========

app.get('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const { companyId, search = '', ownerId, page = 1, limit = 20 } = req.query;
    const query = { deletedAt: null };
    if (companyId) query.companyId = companyId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (canViewAllDeals(req.user.role)) {
      if (ownerId) query.ownerId = ownerId;
    } else {
      query.ownerId = req.user.id;
    }
    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
       res.json({
      data: contacts.map(c => ({
        id: c._id, name: c.name, email: c.email, phone: c.phone,
        jobTitle: c.jobTitle, companyId: c.companyId,
        ownerId: c.ownerId, ownerNameSnapshot: c.ownerNameSnapshot
      })),
      total
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.get('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, deletedAt: null });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (!canViewAllDeals(req.user.role) && String(contact.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

        res.json({
      id: contact._id, name: contact.name, email: contact.email,
      phone: contact.phone, jobTitle: contact.jobTitle, companyId: contact.companyId,
      ownerId: contact.ownerId, ownerNameSnapshot: contact.ownerNameSnapshot
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.post('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, jobTitle, companyId } = req.body;

    const company = await Company.findOne({ _id: companyId, deletedAt: null });
    if (!company) return res.status(400).json({ error: 'Company not found' });

       const owner = await User.findById(req.user.id);
    const contact = new Contact({
      name, email, phone, jobTitle, companyId,
      companyNameSnapshot: company.name,
      ownerId: req.user.id,
      ownerNameSnapshot: owner ? owner.name : ''
    });
    await contact.save();
    res.json({
      id: contact._id, name: contact.name, email: contact.email,
      phone: contact.phone, jobTitle: contact.jobTitle,
      companyId: contact.companyId, companyNameSnapshot: contact.companyNameSnapshot,
      ownerId: contact.ownerId, ownerNameSnapshot: contact.ownerNameSnapshot
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.put('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, deletedAt: null });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (!canViewAllDeals(req.user.role) && String(contact.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    const { name, email, phone, jobTitle } = req.body;
    if (name !== undefined) contact.name = name;
    if (email !== undefined) contact.email = email;
    if (phone !== undefined) contact.phone = phone;
    if (jobTitle !== undefined) contact.jobTitle = jobTitle;
    contact.updatedAt = new Date();
    await contact.save();

    res.json({ id: contact._id, name: contact.name, email: contact.email });
  } catch (err) {
    return sendError(res, err);
  }
});

// Soft delete
app.delete('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, deletedAt: null });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (!canViewAllDeals(req.user.role) && String(contact.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    contact.deletedAt = new Date();
    await contact.save();
    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// Hard delete (permanent) — admin only
app.delete('/api/contacts/:id/permanent', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

app.get('/api/companies/:id/contacts', authMiddleware, async (req, res) => {
  try {
    const query = { companyId: req.params.id, deletedAt: null };
    if (!canViewAllDeals(req.user.role)) query.ownerId = req.user.id;
    const contacts = await Contact.find(query);
        res.json({
      data: contacts.map(c => ({
        id: c._id, name: c.name, email: c.email, phone: c.phone,
        jobTitle: c.jobTitle, companyId: c.companyId,
        ownerId: c.ownerId, ownerNameSnapshot: c.ownerNameSnapshot
      }))
    });
  } catch (err) {
    return sendError(res, err);
  }
});


// ========== LEAD MANAGEMENT (Story 5) ==========

// GET /api/leads - list, filterable by status, with pagination
app.get('/api/leads', authMiddleware, async (req, res) => {
  try {
    const { status, ownerId, page = 1, limit = 20 } = req.query;
    const query = { deletedAt: null };
    if (status) query.status = status;
    if (canViewAllDeals(req.user.role)) {
      if (ownerId) query.ownerId = ownerId;
    } else {
      query.ownerId = req.user.id;
    }
    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

        res.json({
      data: leads.map(l => ({
        id: l._id, name: l.name, status: l.status, source: l.source, temperature: l.temperature,
        convertedToContactId: l.convertedToContactId, convertedToDealId: l.convertedToDealId
      })),
      total
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// POST /api/leads - create
app.post('/api/leads', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, source } = req.body;
   const lead = new Lead({ name, email, phone, source, ownerId: req.user.id, temperature: 'hot' });
    await lead.save();
    res.json({ id: lead._id, name: lead.name, status: lead.status, source: lead.source });
  } catch (err) {
    return sendError(res, err);
  }
});

// PUT /api/leads/:id - update status
app.put('/api/leads/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const now = new Date();
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { status, updatedAt: now, lastActivityAt: now, temperature: calculateTemperature(now) },
      { new: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ id: lead._id, status: lead.status, temperature: lead.temperature });
  } catch (err) {
    return sendError(res, err);
  }
});

// POST /api/leads/:id/convert - creates a Contact + Deal, marks lead qualified
app.post('/api/leads/:id/convert', authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.body;

    const lead = await Lead.findOne({ _id: req.params.id, deletedAt: null });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const company = await Company.findOne({ _id: companyId, deletedAt: null });
    if (!company) return res.status(400).json({ error: 'Company not found' });

    const owner = await User.findById(lead.ownerId);
    const contact = new Contact({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      companyId: company._id,
      companyNameSnapshot: company.name,
      ownerId: lead.ownerId,
      ownerNameSnapshot: owner ? owner.name : ''
    });
    await contact.save();
    const deal = new Deal({
      title: `${company.name} - ${lead.name}`,
      companyId: company._id,
      companyNameSnapshot: company.name,
      contactId: contact._id,
      contactNameSnapshot: contact.name,
      ownerId: lead.ownerId,
      ownerNameSnapshot: owner ? owner.name : '',
      stage: 'new'
    });
    await deal.save();

        lead.status = 'converted';
    lead.convertedToContactId = contact._id;
    lead.convertedToDealId = deal._id;
    lead.updatedAt = new Date();
    await lead.save();

    res.json({ contactId: contact._id, dealId: deal._id });
  } catch (err) {
    return sendError(res, err);
  }
});

// DELETE /api/leads/:id/permanent - hard delete, admin only
app.delete('/api/leads/:id/permanent', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// ========== DEAL PIPELINE (Story 6) ==========

// Helper: does this role see everything, or just their own?
const canViewAllDeals = (role) => ['manager', 'leadership', 'admin'].includes(role);

// Shared helper — creates a system-generated activity entry.
// Reused by: stage changes (below), and later by SCRUM-14 (reassignment) + lead conversion.
async function logSystemActivity(dealId, type, message, actingUserId) {
  const activity = new Activity({
    type,
    notes: message,
    dealId,
    loggedBy: actingUserId,
    loggedAt: new Date()
  });
  await activity.save();
  return activity;
}

// GET /api/deals - list, scoped by role (AC1 + AC2)
app.get('/api/deals', authMiddleware, async (req, res) => {
  try {
    const { companyId, stage, ownerId, page = 1, limit = 20 } = req.query;
    const query = { deletedAt: null };

    if (companyId) query.companyId = companyId;

    if (canViewAllDeals(req.user.role)) {
      if (ownerId) query.ownerId = ownerId;
    } else {
      query.ownerId = req.user.id;
    }

    if (stage) query.stage = stage;

    const total = await Deal.countDocuments(query);
    const deals = await Deal.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      data: deals.map(d => ({
        id: d._id, title: d.title, value: d.value, stage: d.stage,
        temperature: d.temperature,
        companyId: d.companyId, companyNameSnapshot: d.companyNameSnapshot,
        contactId: d.contactId, contactNameSnapshot: d.contactNameSnapshot,
        ownerId: d.ownerId, ownerNameSnapshot: d.ownerNameSnapshot
      })),
      total
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.get('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, deletedAt: null });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (!canViewAllDeals(req.user.role) && String(deal.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    res.json({
      id: deal._id, title: deal.title, value: deal.value, stage: deal.stage,
      temperature: deal.temperature,
      companyId: deal.companyId, companyNameSnapshot: deal.companyNameSnapshot,
      contactId: deal.contactId, contactNameSnapshot: deal.contactNameSnapshot,
      ownerId: deal.ownerId, ownerNameSnapshot: deal.ownerNameSnapshot,
      stageHistory: deal.stageHistory, expectedCloseDate: deal.expectedCloseDate
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// POST /api/deals - create
app.post('/api/deals', authMiddleware, async (req, res) => {
  try {
    const { title, value, companyId, contactId, ownerId } = req.body;

    const company = await Company.findOne({ _id: companyId, deletedAt: null });
    if (!company) return res.status(400).json({ error: 'Company not found' });

    const contact = await Contact.findOne({ _id: contactId, deletedAt: null });
    if (!contact) return res.status(400).json({ error: 'Contact not found' });

    // Reps can only create deals owned by themselves; managers+ can assign to anyone
    const finalOwnerId = canViewAllDeals(req.user.role) && ownerId ? ownerId : req.user.id;
    const owner = await User.findById(finalOwnerId);

  const deal = new Deal({
      title, value,
      companyId, companyNameSnapshot: company.name,
      contactId, contactNameSnapshot: contact.name,
      ownerId: finalOwnerId, ownerNameSnapshot: owner ? owner.name : '',
      stage: 'new',
      temperature: 'hot',
      stageHistory: [{ stage: 'new', changedAt: new Date(), changedBy: req.user.id }]
    });
    await deal.save();

    res.json({
      id: deal._id, title: deal.title, value: deal.value, stage: deal.stage,
      temperature: deal.temperature,
      companyId: deal.companyId, companyNameSnapshot: deal.companyNameSnapshot,
      contactId: deal.contactId, contactNameSnapshot: deal.contactNameSnapshot,
      ownerId: deal.ownerId, ownerNameSnapshot: deal.ownerNameSnapshot,
      stageHistory: deal.stageHistory
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// PATCH /api/deals/:id/stage - move a deal through the pipeline
app.patch('/api/deals/:id/stage', authMiddleware, async (req, res) => {
  try {
    const { stage } = req.body;
    const validStages = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const deal = await Deal.findOne({ _id: req.params.id, deletedAt: null });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (!canViewAllDeals(req.user.role) && String(deal.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    const oldStage = deal.stage;
    const now = new Date();

    deal.stage = stage;
    deal.lastActivityAt = now;
    deal.temperature = calculateTemperature(now);
    deal.updatedAt = now;
    deal.stageHistory.push({ stage, changedAt: now, changedBy: req.user.id });
    await deal.save();

    await logSystemActivity(deal._id, 'stage_change', `Deal moved from ${oldStage} to ${stage}`, req.user.id);

    res.json({ id: deal._id, stage: deal.stage });
  } catch (err) {
    return sendError(res, err);
  }
});


// PATCH /api/deals/:id/reassign - manager/leadership/admin only
app.patch('/api/deals/:id/reassign', authMiddleware, requireRole(['manager', 'leadership', 'admin']), async (req, res) => {
  try {
    const { ownerId } = req.body;
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    const deal = await Deal.findOne({ _id: req.params.id, deletedAt: null });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const newOwner = await User.findOne({ _id: ownerId, deletedAt: null });
    if (!newOwner) return res.status(400).json({ error: 'New owner not found' });
    if (!newOwner.isActive) return res.status(400).json({ error: 'New owner is not active' });

    const oldOwnerName = deal.ownerNameSnapshot;

    deal.ownerId = newOwner._id;
    deal.ownerNameSnapshot = newOwner.name;
    deal.updatedAt = new Date();
    await deal.save();

    await logSystemActivity(
      deal._id,
      'reassignment',
      `Deal reassigned from ${oldOwnerName} to ${newOwner.name}`,
      req.user.id
    );

    res.json({
      id: deal._id, title: deal.title, value: deal.value, stage: deal.stage,
      temperature: deal.temperature,
      companyId: deal.companyId, companyNameSnapshot: deal.companyNameSnapshot,
      contactId: deal.contactId, contactNameSnapshot: deal.contactNameSnapshot,
      ownerId: deal.ownerId, ownerNameSnapshot: deal.ownerNameSnapshot,
      stageHistory: deal.stageHistory
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// Calculates hot/warm/cold based on how recently something happened
const calculateTemperature = (lastActivityAt) => {
  const daysSince = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 3) return 'hot';
  if (daysSince <= 13) return 'warm';
  return 'cold';
};




// PUT /api/deals/:id - edit title/value only (stage changes use the dedicated route)
app.put('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const { title, value } = req.body;

    const deal = await Deal.findOne({ _id: req.params.id, deletedAt: null });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (!canViewAllDeals(req.user.role) && String(deal.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    if (title !== undefined) deal.title = title;
    if (value !== undefined) deal.value = value;
    deal.updatedAt = new Date();
    await deal.save();

    res.json({ id: deal._id, title: deal.title, value: deal.value });
  } catch (err) {
    return sendError(res, err);
  }
});

// DELETE /api/deals/:id - soft delete
app.delete('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, deletedAt: null });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (!canViewAllDeals(req.user.role) && String(deal.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    deal.deletedAt = new Date();
    await deal.save();

    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});

// DELETE /api/deals/:id/permanent - hard delete, admin only, cascades to activities/reminders
app.delete('/api/deals/:id/permanent', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    await Activity.deleteMany({ dealId: deal._id });
    await Reminder.deleteMany({ dealId: deal._id });

    res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
});




// ========== ACTIVITY LOGGING (Story 7) ==========

// POST /api/activities - log an activity, updates parent deal's lastActivityAt
app.post('/api/activities', authMiddleware, async (req, res) => {
  try {
    const { type, notes, dealId, contactId } = req.body;

    if (!dealId && !contactId) {
      return res.status(400).json({ error: 'Must provide dealId or contactId' });
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const activity = new Activity({
      type, notes,
      dealId: dealId || null,
      contactId: contactId || null,
      loggedBy: req.user.id
    });
    await activity.save();

    // Side effect: keep the parent deal's lastActivityAt current (drives Story 9 temperature)
    // Side effect: keep the parent deal's lastActivityAt + temperature current
    if (dealId) {
      const now = new Date();
      await Deal.findByIdAndUpdate(dealId, {
        lastActivityAt: now,
        temperature: calculateTemperature(now)
      });
    }

    res.json({
      id: activity._id, type: activity.type, notes: activity.notes,
      dealId: activity.dealId, contactId: activity.contactId,
      loggedBy: activity.loggedBy, loggedAt: activity.loggedAt
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// GET /api/activities - timeline for a deal or contact, newest first
app.get('/api/activities', authMiddleware, async (req, res) => {
  try {
    const { dealId, contactId } = req.query;

    if (!dealId && !contactId) {
      return res.status(400).json({ error: 'Must provide dealId or contactId' });
    }

    const query = {};
    if (dealId) query.dealId = dealId;
    if (contactId) query.contactId = contactId;

    const activities = await Activity.find(query).sort({ loggedAt: -1 });

    res.json({
      data: activities.map(a => ({
        id: a._id, type: a.type, notes: a.notes, loggedAt: a.loggedAt
      }))
    });
  } catch (err) {
    return sendError(res, err);
  }
});


// ========== FOLLOW-UP REMINDERS (Story 8) ==========

// POST /api/reminders - create
app.post('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const { title, dueDate, dealId, contactId } = req.body;

    if (!dealId && !contactId) {
      return res.status(400).json({ error: 'Must provide dealId or contactId' });
    }

    const reminder = new Reminder({
      title, dueDate,
      dealId: dealId || null,
      contactId: contactId || null,
      ownerId: req.user.id
    });
    await reminder.save();

    res.json({ id: reminder._id, title: reminder.title, dueDate: reminder.dueDate, isDone: reminder.isDone });
  } catch (err) {
    return sendError(res, err);
  }
});

// GET /api/reminders - list, scoped by role (same pattern as Deals), optional overdue filter
app.get('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const { overdue, ownerId } = req.query;
    const query = {};

    if (canViewAllDeals(req.user.role)) {
      // manager/leadership/admin can optionally filter to a specific rep
      if (ownerId) query.ownerId = ownerId;
    } else {
      // rep: always scoped to themselves
      query.ownerId = req.user.id;
    }

    if (overdue === 'true') {
      query.isDone = false;
      query.dueDate = { $lt: new Date() };
    }

    const reminders = await Reminder.find(query).sort({ dueDate: 1 });

    res.json({
      data: reminders.map(r => ({
        id: r._id, title: r.title, dueDate: r.dueDate, isDone: r.isDone,
        dealId: r.dealId, contactId: r.contactId
      }))
    });
  } catch (err) {
    return sendError(res, err);
  }
});

// PATCH /api/reminders/:id/done - mark complete
app.patch('/api/reminders/:id/done', authMiddleware, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    // Same ownership rule as viewing — a rep can't complete someone else's reminder
    if (!canViewAllDeals(req.user.role) && String(reminder.ownerId) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }

    reminder.isDone = true;
    reminder.completedAt = new Date();
    await reminder.save();

    res.json({ id: reminder._id, isDone: reminder.isDone, completedAt: reminder.completedAt });
  } catch (err) {
    return sendError(res, err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));