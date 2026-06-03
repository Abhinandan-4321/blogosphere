import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const COFFEE_PRICE = 50; // ₹50 per coffee

// Lazy initialize Razorpay to ensure env vars are loaded
let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// @desc    Create Razorpay order for coffee purchase
// @route   POST /api/payments/create-order
export const createOrder = async (req, res, next) => {
  try {
    const { creatorId, coffeeCount = 1, message = '', isAnonymous = false, isPublic = true } = req.body;

    // Validate coffee count
    if (coffeeCount < 1 || coffeeCount > 100) {
      return sendError(res, 400, 'Coffee count must be between 1 and 100');
    }

    // Check if creator exists
    const creator = await User.findById(creatorId);
    if (!creator) {
      return sendError(res, 404, 'Creator not found');
    }

    // Prevent self-support
    if (req.user._id.toString() === creatorId) {
      return sendError(res, 400, 'You cannot support yourself');
    }

    const amount = COFFEE_PRICE * coffeeCount * 100; // Convert to paise

    // Create Razorpay order
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `coffee_${Date.now()}`,
      notes: {
        supporterId: req.user._id.toString(),
        creatorId,
        coffeeCount,
      },
    });

    // Create payment record
    const payment = await Payment.create({
      supporter: req.user._id,
      creator: creatorId,
      amount: COFFEE_PRICE * coffeeCount,
      currency: 'INR',
      coffeeCount,
      message,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      isAnonymous,
      isPublic,
    });

    return sendSuccess(res, 201, 'Order created successfully', {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    // Find payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return sendError(res, 404, 'Payment record not found');
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      payment.status = 'failed';
      await payment.save();
      return sendError(res, 400, 'Invalid payment signature');
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'completed';
    await payment.save();

    // Populate payment details
    await payment.populate('supporter', 'name avatar');
    await payment.populate('creator', 'name avatar');

    // Create notification for creator
    await createNotification({
      recipient: payment.creator._id,
      type: NOTIFICATION_TYPES.COFFEE_RECEIVED,
      message: payment.isAnonymous
        ? `Someone bought you ${payment.coffeeCount} coffee${payment.coffeeCount > 1 ? 's' : ''}!`
        : `${payment.supporter.name} bought you ${payment.coffeeCount} coffee${payment.coffeeCount > 1 ? 's' : ''}!`,
      relatedUser: payment.isAnonymous ? null : payment.supporter._id,
    });

    return sendSuccess(res, 200, 'Payment verified successfully', payment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments received by creator
// @route   GET /api/payments/received
export const getReceivedPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'completed' } = req.query;

    const query = {
      creator: req.user._id,
      status,
    };

    const payments = await Payment.find(query)
      .populate('supporter', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    // Calculate total earnings
    const totalEarnings = await Payment.aggregate([
      { $match: { creator: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const earnings = totalEarnings.length > 0 ? totalEarnings[0].total : 0;

    return sendSuccess(res, 200, 'Payments retrieved', {
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPayments: total,
      totalEarnings: earnings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments made by supporter
// @route   GET /api/payments/sent
export const getSentPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payments = await Payment.find({
      supporter: req.user._id,
      status: 'completed',
    })
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({
      supporter: req.user._id,
      status: 'completed',
    });

    // Calculate total spent
    const totalSpent = await Payment.aggregate([
      { $match: { supporter: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = totalSpent.length > 0 ? totalSpent[0].total : 0;

    return sendSuccess(res, 200, 'Payments retrieved', {
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPayments: total,
      totalSpent: spent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public supporters for a creator
// @route   GET /api/payments/supporters/:userId
export const getPublicSupporters = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const supporters = await Payment.aggregate([
      {
        $match: {
          creator: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          isPublic: true,
          isAnonymous: false,
        },
      },
      {
        $group: {
          _id: '$supporter',
          totalCoffees: { $sum: '$coffeeCount' },
          totalAmount: { $sum: '$amount' },
          lastSupport: { $max: '$createdAt' },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'supporter',
        },
      },
      { $unwind: '$supporter' },
      {
        $project: {
          'supporter.name': 1,
          'supporter.avatar': 1,
          totalCoffees: 1,
          totalAmount: 1,
          lastSupport: 1,
        },
      },
    ]);

    return sendSuccess(res, 200, 'Supporters retrieved', supporters);
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics for creator
// @route   GET /api/payments/stats
export const getPaymentStats = async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { creator: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          totalCoffees: { $sum: '$coffeeCount' },
          totalSupporters: { $addToSet: '$supporter' },
          averageAmount: { $avg: '$amount' },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalEarnings: 0,
      totalCoffees: 0,
      totalSupporters: [],
      averageAmount: 0,
    };

    // Get monthly earnings
    const monthlyEarnings = await Payment.aggregate([
      {
        $match: {
          creator: req.user._id,
          status: 'completed',
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          earnings: { $sum: '$amount' },
          coffees: { $sum: '$coffeeCount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return sendSuccess(res, 200, 'Stats retrieved', {
      totalEarnings: result.totalEarnings,
      totalCoffees: result.totalCoffees,
      totalSupporters: result.totalSupporters.length,
      averageAmount: Math.round(result.averageAmount),
      monthlyEarnings,
    });
  } catch (error) {
    next(error);
  }
};
