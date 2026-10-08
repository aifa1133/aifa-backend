import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student — get my conversation for this bootcamp
router.get('/:bootcampId/mine', protect, async (req, res) => {
  try {
    const msgs = await Message.find({
      bootcampId: req.params.bootcampId,
      studentId:  req.user._id,
    }).sort({ createdAt: 1 });
    await Message.updateMany(
      { bootcampId: req.params.bootcampId, studentId: req.user._id, isAdminReply: true, readByStudent: false },
      { readByStudent: true }
    );
    res.json(msgs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Student — unread count
router.get('/:bootcampId/unread', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      bootcampId:    req.params.bootcampId,
      studentId:     req.user._id,
      isAdminReply:  true,
      readByStudent: false,
    });
    res.json({ count });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Student — send a message
router.post('/:bootcampId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
    const msg = await Message.create({
      bootcampId:    req.params.bootcampId,
      studentId:     req.user._id,
      fromUser:      req.user._id,
      isAdminReply:  false,
      content:       content.trim(),
      readByAdmin:   false,
      readByStudent: true,
    });
    res.status(201).json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin — all conversations for a bootcamp
router.get('/:bootcampId/conversations', protect, adminOnly, async (req, res) => {
  try {
    const bcOid = new mongoose.Types.ObjectId(req.params.bootcampId);
    const convos = await Message.aggregate([
      { $match: { bootcampId: bcOid } },
      { $sort:  { createdAt: -1 } },
      { $group: {
        _id:         '$studentId',
        lastMessage: { $first: '$$ROOT' },
        unread:      { $sum: { $cond: [{ $and: [{ $eq: ['$isAdminReply', false] }, { $eq: ['$readByAdmin', false] }] }, 1, 0] } },
      }},
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
    const populated = await Promise.all(convos.map(async c => {
      const student = await User.findById(c._id).select('name email');
      return { studentId: c._id, student, lastMessage: c.lastMessage, unread: c.unread };
    }));
    res.json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin — unread count across all students
router.get('/:bootcampId/admin-unread', protect, adminOnly, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      bootcampId:   req.params.bootcampId,
      isAdminReply: false,
      readByAdmin:  false,
    });
    res.json({ count });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin — full conversation with a student
router.get('/:bootcampId/student/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const msgs = await Message.find({
      bootcampId: req.params.bootcampId,
      studentId:  req.params.studentId,
    }).sort({ createdAt: 1 });
    await Message.updateMany(
      { bootcampId: req.params.bootcampId, studentId: req.params.studentId, isAdminReply: false, readByAdmin: false },
      { readByAdmin: true }
    );
    res.json(msgs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin — reply to a student
router.post('/:bootcampId/reply/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
    const msg = await Message.create({
      bootcampId:    req.params.bootcampId,
      studentId:     req.params.studentId,
      fromUser:      req.user._id,
      isAdminReply:  true,
      content:       content.trim(),
      readByAdmin:   true,
      readByStudent: false,
    });
    res.status(201).json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
