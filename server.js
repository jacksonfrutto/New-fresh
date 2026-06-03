const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for orders (replace with database in production)
let orders = [];
let orderIdCounter = 1000;

// GET all orders
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: orders,
    count: orders.length
  });
});

// POST - Create new order
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, totalAmount, paymentMethod, businessNumber } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerName, customerEmail, customerPhone, items, totalAmount'
      });
    }

    // Create new order
    const newOrder = {
      orderId: `FRT-${orderIdCounter++}`,
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'M-Pesa',
      businessNumber: businessNumber || 'Not provided',
      status: 'pending',
      paymentStatus: 'awaiting_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save order
    orders.push(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder,
      paymentInstructions: {
        method: newOrder.paymentMethod,
        businessNumber: newOrder.businessNumber,
        amount: newOrder.totalAmount,
        reference: newOrder.orderId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// GET - Get specific order by ID
app.get('/api/orders/:orderId', (req, res) => {
  try {
    const order = orders.find(o => o.orderId === req.params.orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving order',
      error: error.message
    });
  }
});

// PUT - Update order payment status
app.put('/api/orders/:orderId/payment', (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
    const order = orders.find(o => o.orderId === req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = paymentStatus || 'completed';
    order.transactionId = transactionId;
    order.status = paymentStatus === 'completed' ? 'confirmed' : order.status;
    order.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Payment status updated',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
});

// DELETE - Cancel order
app.delete('/api/orders/:orderId', (req, res) => {
  try {
    const orderIndex = orders.findIndex(o => o.orderId === req.params.orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const deletedOrder = orders.splice(orderIndex, 1)[0];

    res.json({
      success: true,
      message: 'Order cancelled',
      order: deletedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍎 FRUTTO Backend Server running on http://localhost:${PORT}`);
  console.log(`📍 API Documentation:`);
  console.log(`   POST   /api/orders - Create new order`);
  console.log(`   GET    /api/orders - Get all orders`);
  console.log(`   GET    /api/orders/:orderId - Get specific order`);
  console.log(`   PUT    /api/orders/:orderId/payment - Update payment status`);
  console.log(`   DELETE /api/orders/:orderId - Cancel order`);
});
