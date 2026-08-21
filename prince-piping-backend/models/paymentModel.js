// models/paymentModel.js
// All database queries for the payments table.
// Controllers call these — no raw SQL outside this file.

const { pool } = require("../config/db");

// ── Get payment by its own ID ────────────────────────────────
const getPaymentById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       p.*,
       o.order_number,
       o.status         AS order_status,
       o.payment_status AS order_payment_status,
       d.business_name,
       u.name           AS dealer_name,
       u.email          AS dealer_email
     FROM payments p
     JOIN orders  o ON p.order_id  = o.id
     JOIN dealers d ON p.dealer_id = d.id
     JOIN users   u ON d.user_id   = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0];
};

// ── Get payment by order ID ──────────────────────────────────
// Used to check if payment already submitted for an order
const getPaymentByOrderId = async (orderId) => {
  const [rows] = await pool.query(
    "SELECT * FROM payments WHERE order_id = ?",
    [orderId]
  );
  return rows[0];
};

// ── Get all payments for one dealer ─────────────────────────
const getPaymentsByDealerId = async (dealerId) => {
  const [rows] = await pool.query(
    `SELECT
       p.*,
       o.order_number,
       o.total_amount,
       o.status         AS order_status,
       o.payment_status AS order_payment_status
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     WHERE p.dealer_id = ?
     ORDER BY p.created_at DESC`,
    [dealerId]
  );
  return rows;
};

// ── Get all payments — admin view ────────────────────────────
const getAllPayments = async () => {
  const [rows] = await pool.query(
    `SELECT
       p.*,
       o.order_number,
       o.total_amount,
       o.status         AS order_status,
       o.payment_status AS order_payment_status,
       d.dealer_code,
       d.business_name,
       u.name           AS dealer_name,
       u.email          AS dealer_email
     FROM payments p
     JOIN orders  o ON p.order_id  = o.id
     JOIN dealers d ON p.dealer_id = d.id
     JOIN users   u ON d.user_id   = u.id
     ORDER BY p.created_at DESC`,
    []
  );
  return rows;
};

// ── Create a new payment submission ─────────────────────────
const createPayment = async ({ orderId, dealerId, amount, method, transactionId, proof }) => {
  const [result] = await pool.query(
    `INSERT INTO payments
       (order_id, dealer_id, amount, payment_method, transaction_id, payment_proof, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [orderId, dealerId, amount, method, transactionId, proof || null]
  );
  return result.insertId;
};

// ── Mark payment as verified ─────────────────────────────────
const verifyPayment = async (paymentId, adminUserId) => {
  await pool.query(
    `UPDATE payments
     SET status      = 'verified',
         verified_by = ?,
         verified_at = NOW(),
         updated_at  = NOW()
     WHERE id = ?`,
    [adminUserId, paymentId]
  );
};

// ── Mark payment as rejected with a remark ──────────────────
const rejectPayment = async (paymentId, adminUserId, remark) => {
  await pool.query(
    `UPDATE payments
     SET status      = 'rejected',
         verified_by = ?,
         verified_at = NOW(),
         remarks     = ?,
         updated_at  = NOW()
     WHERE id = ?`,
    [adminUserId, remark, paymentId]
  );
};

module.exports = {
  getPaymentById,
  getPaymentByOrderId,
  getPaymentsByDealerId,
  getAllPayments,
  createPayment,
  verifyPayment,
  rejectPayment,
};
