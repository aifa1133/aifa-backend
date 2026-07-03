import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import Course from "../models/Course.js";
import Workshop from "../models/Workshop.js";
import Bootcamp from "../models/Bootcamp.js";
import User from "../models/User.js";

function razorpayConfigured() {
  const k = process.env.RAZORPAY_KEY_ID;
  const s = process.env.RAZORPAY_KEY_SECRET;
  return k && !k.includes("your_razorpay") && s && !s.includes("your_razorpay");
}

async function getRazorpay() {
  if (!razorpayConfigured()) return null;
  try {
    const { default: Razorpay } = await import("razorpay");
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  } catch {
    return null;
  }
}

const MODELS = { course: Course, workshop: Workshop, bootcamp: Bootcamp };

export const createOrder = async (req, res) => {
  const { itemType, itemId } = req.body;
  try {
    const Model = MODELS[itemType];
    if (!Model) return res.status(400).json({ message: "Invalid item type" });

    const item = await Model.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const amountPaise = Math.round(item.price * 100);

    const razorpay = await getRazorpay();
    if (!razorpay) {
      // Dev fallback — return a fake order so frontend can be tested
      const tx = await Transaction.create({
        user: req.user._id, itemType, itemId,
        itemTitle: item.title, amount: item.price, status: "pending",
        orderId: `dev_order_${Date.now()}`,
      });
      return res.json({
        orderId: tx.orderId, amount: amountPaise, currency: "INR",
        keyId: "razorpay_not_configured", txId: tx._id,
        _devMode: true,
      });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise, currency: "INR",
      receipt: `tx_${Date.now()}`,
      notes: { itemType, itemId: itemId.toString(), userId: req.user._id.toString() },
    });

    const tx = await Transaction.create({
      user: req.user._id, itemType, itemId,
      itemTitle: item.title, amount: item.price,
      orderId: order.id, status: "pending",
    });

    res.json({ orderId: order.id, amount: amountPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, txId: tx._id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id:   orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature:  signature,
    txId,
  } = req.body;
  try {
    const razorpay = await getRazorpay();

    if (razorpay) {
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      if (expected !== signature) {
        await Transaction.findByIdAndUpdate(txId, { status: "failed" });
        return res.status(400).json({ message: "Payment verification failed" });
      }
    }

    const tx = await Transaction.findByIdAndUpdate(
      txId, { paymentId, signature, status: "paid" }, { new: true }
    );
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Enroll user in the purchased item
    const user = await User.findById(req.user._id);
    if (tx.itemType === "course" && !user.enrolledCourses.includes(tx.itemId)) {
      user.enrolledCourses.push(tx.itemId);
    } else if (tx.itemType === "workshop" && !user.enrolledWorkshops.includes(tx.itemId)) {
      user.enrolledWorkshops.push(tx.itemId);
      await Workshop.findByIdAndUpdate(tx.itemId, { $addToSet: { registrations: user._id } });
    } else if (tx.itemType === "bootcamp" && !user.enrolledBootcamps.includes(tx.itemId)) {
      user.enrolledBootcamps.push(tx.itemId);
      await Bootcamp.findByIdAndUpdate(tx.itemId, { $addToSet: { enrollments: user._id } });
    }
    await user.save();

    res.json({ message: "Payment verified and enrollment confirmed", transaction: tx });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(txs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(txs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
