// controllers/paymentController.js
// Handles payment submissions and review workflows.
// For this phase, digital methods are processed like real-time payments
// without changing the existing database schema.

const {
  getPaymentById,
  getPaymentByOrderId,
  getPaymentsByDealerId,
  getAllPayments,
  createPayment,
  verifyPayment,
  rejectPayment,
} = require("../models/paymentModel");

const {
  createDelivery,
  getDeliveryByOrderId,
} = require("../models/deliveryModel");

const {
  getOrderById,
  getDealerByUserId,
} = require("../models/orderModel");

const { pool } = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const hasRazorpayConfig = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const INSTANT_PAYMENT_METHODS = ["upi", "bank_transfer"];
const MANUAL_PAYMENT_METHODS = ["cash", "cheque"];
const VALID_METHODS = [...INSTANT_PAYMENT_METHODS, ...MANUAL_PAYMENT_METHODS];

const generateTransactionId = (method) => {
  const methodPrefix = String(method || "txn")
    .replace(/[^a-z]/gi, "")
    .slice(0, 4)
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-8);
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${methodPrefix || "TXN"}-${timestamp}-${randomPart}`;
};

const getRazorpayErrorMessage = (error) =>
  error?.error?.description ||
  error?.error?.reason ||
  error?.description ||
  error?.message ||
  "Could not create Razorpay order";

// Keeps orders.payment_status and orders.status aligned with payment activity.
const updateOrderAfterPayment = async (orderId, paymentStatus, orderStatus, adminUserId) => {
  await pool.query(
    `UPDATE orders
     SET payment_status = ?,
         status         = ?,
         approved_by    = ?,
         approved_at    = IF(? = 'confirmed', NOW(), approved_at),
         updated_at     = NOW()
     WHERE id = ?`,
    [paymentStatus, orderStatus, adminUserId, orderStatus, orderId]
  );
};

// POST /api/payments
// Dealer submits or completes payment for an order.
const submitPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, method, transaction_id, proof } = req.body;

    if (!order_id || !method) {
      return res.status(400).json({
        success: false,
        message: "order_id and method are required",
      });
    }

    if (!VALID_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        message: `method must be one of: ${VALID_METHODS.join(", ")}`,
      });
    }

    const dealer = await getDealerByUserId(userId);
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      });
    }

    const order = await getOrderById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${order_id} not found`,
      });
    }

    if (order.dealer_id !== dealer.id) {
      return res.status(403).json({
        success: false,
        message: "You can only pay for your own orders",
      });
    }

    const existingPayment = await getPaymentByOrderId(order_id);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Payment already submitted for order ${order.order_number}. Current status: ${existingPayment.status}`,
      });
    }

    if (order.status === "cancelled" || order.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: `Cannot submit payment for an order with status "${order.status}"`,
      });
    }

    const resolvedTransactionId =
      transaction_id && String(transaction_id).trim()
        ? String(transaction_id).trim()
        : generateTransactionId(method);

    const newPaymentId = await createPayment({
      orderId: order_id,
      dealerId: dealer.id,
      amount: order.total_amount,
      method,
      transactionId: resolvedTransactionId,
      proof: proof || null,
    });

    let newPayment = await getPaymentById(newPaymentId);

    if (INSTANT_PAYMENT_METHODS.includes(method)) {
      // Instant methods simulate a live gateway and complete immediately.
      await verifyPayment(newPaymentId, null);
      await updateOrderAfterPayment(order_id, "verified", "confirmed", null);
      
      // Create delivery record if applicable
      const existingDelivery = await getDeliveryByOrderId(order_id);
      if (!existingDelivery) {
          await createDelivery({
            orderId: order_id,
            pickupAddress: "Main Warehouse",
            deliveryAddress: order.delivery_address,
          });
        }
      
      newPayment = await getPaymentById(newPaymentId);

      return res.status(201).json({
        success: true,
        message: `Payment completed successfully via ${method.replace("_", " ")}.`,
        data: newPayment,
        meta: {
          flow: "instant",
          transaction_id: resolvedTransactionId,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment submitted successfully. Waiting for admin verification.",
      data: newPayment,
      meta: {
        flow: "manual",
        transaction_id: resolvedTransactionId,
      },
    });
  } catch (error) {
    console.error("Submit payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting payment",
    });
  }
};

// GET /api/payments/my
// Dealer payment history.
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const dealer = await getDealerByUserId(userId);
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      });
    }

    const payments = await getPaymentsByDealerId(dealer.id);

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get my payments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching payments",
    });
  }
};

// GET /api/payments
// Admin payment history.
const getAllPaymentsHandler = async (req, res) => {
  try {
    const payments = await getAllPayments();

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get all payments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching payments",
    });
  }
};

// PUT /api/payments/:id/verify
// Admin verifies a pending payment.
const verifyPaymentHandler = async (req, res) => {
  try {
    const { id: paymentId } = req.params;
    const adminUserId = req.user.id;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment with ID ${paymentId} not found`,
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Payment is already "${payment.status}". Only pending payments can be verified.`,
      });
    }

    await verifyPayment(paymentId, adminUserId);
    await updateOrderAfterPayment(
      payment.order_id,
      "verified",
      "confirmed",
      adminUserId
    );

    // Create delivery record if applicable
    const order = await getOrderById(payment.order_id);
    if (order) {
      const existingDelivery = await getDeliveryByOrderId(payment.order_id);
      if (!existingDelivery) {
        await createDelivery({
          orderId: payment.order_id,
          pickupAddress: "Main Warehouse",
          deliveryAddress: order.delivery_address,
        });
      }
    }

    const updatedPayment = await getPaymentById(paymentId);

    return res.status(200).json({
      success: true,
      message: `Payment verified. Order ${payment.order_number} has been approved.`,
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying payment",
    });
  }
};

// PUT /api/payments/:id/reject
// Admin rejects a pending payment.
const rejectPaymentHandler = async (req, res) => {
  try {
    const { id: paymentId } = req.params;
    const adminUserId = req.user.id;
    const { remark } = req.body;

    if (!remark || !remark.trim()) {
      return res.status(400).json({
        success: false,
        message: "remark is required when rejecting a payment",
      });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment with ID ${paymentId} not found`,
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Payment is already "${payment.status}". Only pending payments can be rejected.`,
      });
    }

    await rejectPayment(paymentId, adminUserId, remark.trim());
    await updateOrderAfterPayment(
      payment.order_id,
      "unpaid",
      "pending",
      adminUserId
    );

    const updatedPayment = await getPaymentById(paymentId);

    return res.status(200).json({
      success: true,
      message: "Payment rejected. Dealer can resubmit payment.",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Reject payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting payment",
    });
  }
};

// POST /api/payments/create-order
// Initialize Razorpay order.
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!hasRazorpayConfig()) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured",
      });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount must be a positive number in paise",
      });
    }

    const options = {
      amount: Math.round(normalizedAmount), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(201).json({
      success: true,
      data: {
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return res.status(500).json({
      success: false,
      message: getRazorpayErrorMessage(error),
    });
  }
};

// POST /api/payments/verify
// Verify Razorpay signature and update order.
const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!hasRazorpayConfig()) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured",
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Payment is valid, update the order
    const userId = req.user.id;
    const dealer = await getDealerByUserId(userId);

    const order = await getOrderById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create a payment record in our DB
    const newPaymentId = await createPayment({
      orderId: order_id,
      dealerId: dealer.id,
      amount: order.total_amount,
      method: "razorpay",
      transactionId: razorpay_payment_id,
      proof: `Razorpay Order ID: ${razorpay_order_id}`,
    });

    // Mark as verified and order as paid/approved
    await verifyPayment(newPaymentId, null);
    await updateOrderAfterPayment(order_id, "paid", "confirmed", null);

    // Create delivery record if applicable
    const existingDelivery = await getDeliveryByOrderId(order_id);
    if (!existingDelivery) {
        await createDelivery({
          orderId: order_id,
          pickupAddress: "Main Warehouse",
          deliveryAddress: order.delivery_address,
        });
      }
    
    return res.status(200).json({
      success: true,
      message: "Payment verified and order updated successfully",
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

module.exports = {
  submitPayment,
  getMyPayments,
  getAllPaymentsHandler,
  verifyPaymentHandler,
  rejectPaymentHandler,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
