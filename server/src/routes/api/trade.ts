import { Router } from 'express';

const router = Router();

// 3.1 账户管理
router.get('/accounts', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        id: 'account1',
        name: '主账户',
        type: 'stock',
        balance: 100000.00,
        available: 95000.00,
        frozen: 5000.00,
        marketValue: 50000.00,
        totalAssets: 150000.00,
        status: 'active'
      }
    ]
  });
});

router.get('/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      id: accountId,
      name: '主账户',
      type: 'stock',
      balance: 100000.00,
      available: 95000.00,
      frozen: 5000.00,
      marketValue: 50000.00,
      totalAssets: 150000.00,
      status: 'active',
      createTime: Date.now()
    }
  });
});

router.get('/accounts/overview', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      totalAssets: 150000.00,
      totalBalance: 100000.00,
      totalMarketValue: 50000.00,
      totalProfit: 5000.00,
      totalProfitRate: 3.33,
      accountCount: 1,
      timestamp: Date.now()
    }
  });
});

// 3.2 持仓管理
router.get('/positions', (req, res) => {
  const { accountId } = req.query;
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        code: '000001',
        name: '平安银行',
        quantity: 1000,
        availableQuantity: 1000,
        frozenQuantity: 0,
        avgPrice: 12.00,
        currentPrice: 12.34,
        marketValue: 12340.00,
        profit: 340.00,
        profitRate: 2.83,
        accountId: accountId || 'account1'
      }
    ]
  });
});

router.get('/accounts/:accountId/positions/:code', (req, res) => {
  const { accountId, code } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      name: '平安银行',
      quantity: 1000,
      availableQuantity: 1000,
      frozenQuantity: 0,
      avgPrice: 12.00,
      currentPrice: 12.34,
      marketValue: 12340.00,
      profit: 340.00,
      profitRate: 2.83,
      accountId,
      timestamp: Date.now()
    }
  });
});

// 3.3 订单管理
router.get('/orders', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      list: [
        {
          id: 'order1',
          code: '000001',
          name: '平安银行',
          type: 'buy',
          priceType: 'limit',
          price: 12.00,
          volume: 1000,
          filledVolume: 0,
          status: 'pending',
          createTime: Date.now()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    }
  });
});

router.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      id: orderId,
      code: '000001',
      name: '平安银行',
      type: 'buy',
      priceType: 'limit',
      price: 12.00,
      volume: 1000,
      filledVolume: 0,
      status: 'pending',
      createTime: Date.now(),
      remark: '测试订单'
    }
  });
});

router.post('/orders', (req, res) => {
  const { accountId, code, type, priceType, price, volume, remark } = req.body;
  res.json({
    code: 0,
    message: '下单成功',
    data: {
      orderId: 'order' + Date.now(),
      accountId,
      code,
      type,
      priceType,
      price,
      volume,
      status: 'pending',
      createTime: Date.now()
    }
  });
});

router.post('/orders/:orderId/cancel', (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  res.json({
    code: 0,
    message: '撤单成功',
    data: {
      orderId,
      status: 'cancelled',
      cancelTime: Date.now(),
      reason
    }
  });
});

router.post('/orders/batch-cancel', (req, res) => {
  const { orderIds } = req.body;
  res.json({
    code: 0,
    message: '批量撤单成功',
    data: {
      cancelledOrders: orderIds,
      timestamp: Date.now()
    }
  });
});

// 3.4 成交记录
router.get('/deals', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      list: [
        {
          id: 'deal1',
          orderId: 'order1',
          code: '000001',
          name: '平安银行',
          type: 'buy',
          price: 12.00,
          volume: 1000,
          amount: 12000.00,
          commission: 5.00,
          dealTime: Date.now()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    }
  });
});

router.get('/deals/:dealId', (req, res) => {
  const { dealId } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      id: dealId,
      orderId: 'order1',
      code: '000001',
      name: '平安银行',
      type: 'buy',
      price: 12.00,
      volume: 1000,
      amount: 12000.00,
      commission: 5.00,
      dealTime: Date.now()
    }
  });
});

// 3.5 资金管理
router.get('/fund-flows', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      list: [
        {
          id: 'flow1',
          type: 'deposit',
          amount: 10000.00,
          balance: 100000.00,
          status: 'success',
          createTime: Date.now()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    }
  });
});

router.get('/fund-flows/:flowId', (req, res) => {
  const { flowId } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      id: flowId,
      type: 'deposit',
      amount: 10000.00,
      balance: 100000.00,
      status: 'success',
      createTime: Date.now(),
      completeTime: Date.now()
    }
  });
});

router.post('/deposit', (req, res) => {
  const { amount, paymentMethod } = req.body;
  res.json({
    code: 0,
    message: '入金申请成功',
    data: {
      flowId: 'flow' + Date.now(),
      type: 'deposit',
      amount,
      paymentMethod,
      status: 'pending',
      createTime: Date.now()
    }
  });
});

router.post('/withdraw', (req, res) => {
  const { amount, bankCard } = req.body;
  res.json({
    code: 0,
    message: '出金申请成功',
    data: {
      flowId: 'flow' + Date.now(),
      type: 'withdraw',
      amount,
      bankCard,
      status: 'pending',
      createTime: Date.now()
    }
  });
});

router.post('/fund-flows/:flowId/cancel', (req, res) => {
  const { flowId } = req.params;
  res.json({
    code: 0,
    message: '取消成功',
    data: {
      flowId,
      status: 'cancelled',
      cancelTime: Date.now()
    }
  });
});

// 3.6 交易设置
router.get('/settings', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      defaultAccount: 'account1',
      defaultPriceType: 'limit',
      defaultVolume: 100,
      quickTrade: true,
      confirmTrade: true,
      showAdvancedOptions: true,
      autoSaveOrder: true,
      riskWarning: true,
      commissionDisplay: true,
      fingerprintTrade: false
    }
  });
});

router.put('/settings', (req, res) => {
  res.json({
    code: 0,
    message: '设置更新成功',
    data: req.body
  });
});

// 3.7 统计和绩效
router.get('/statistics', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      totalTrades: 100,
      winTrades: 60,
      lossTrades: 40,
      winRate: 0.6,
      totalProfit: 5000.00,
      totalLoss: -2000.00,
      netProfit: 3000.00,
      maxDrawdown: -1000.00,
      sharpeRatio: 1.2,
      timestamp: Date.now()
    }
  });
});

router.get('/performance/:period', (req, res) => {
  const { period } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      period,
      return: 0.05,
      benchmark: 0.03,
      excessReturn: 0.02,
      volatility: 0.15,
      sharpeRatio: 1.2,
      maxDrawdown: -0.08,
      timestamp: Date.now()
    }
  });
});

router.get('/history', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      list: [
        {
          date: '2024-01-15',
          trades: 5,
          profit: 100.00,
          volume: 5000,
          timestamp: Date.now()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    }
  });
});

// 3.8 风控管理
router.get('/risk-control', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      maxPositionSize: 0.1,
      maxDailyLoss: 0.05,
      maxDrawdown: 0.2,
      stopLoss: 0.1,
      takeProfit: 0.2,
      enabled: true
    }
  });
});

router.put('/risk-control', (req, res) => {
  res.json({
    code: 0,
    message: '风控设置更新成功',
    data: req.body
  });
});

// 3.9 佣金规则
router.get('/commission-rules', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      minCommission: 5.00,
      commissionRate: 0.0003,
      maxCommission: 100.00,
      stampTax: 0.001,
      transferFee: 0.00002
    }
  });
});

router.post('/calculate-commission', (req, res) => {
  const { price, volume } = req.body;
  const commission = Math.max(5, price * volume * 0.0003);
  res.json({
    code: 0,
    message: '成功',
    data: {
      commission,
      stampTax: price * volume * 0.001,
      transferFee: price * volume * 0.00002,
      total: commission + price * volume * 0.001 + price * volume * 0.00002
    }
  });
});

// 3.10 订单验证
router.post('/validate-order', (req, res) => {
  const { accountId, code, type, priceType, price, volume } = req.body;
  res.json({
    code: 0,
    message: '验证通过',
    data: {
      valid: true,
      warnings: [],
      estimatedCost: price * volume,
      estimatedCommission: Math.max(5, price * volume * 0.0003)
    }
  });
});

// 3.11 市场深度
router.get('/order-book/:code', (req, res) => {
  const { code } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      bids: [
        { price: 12.33, volume: 1000 },
        { price: 12.32, volume: 2000 }
      ],
      asks: [
        { price: 12.35, volume: 1500 },
        { price: 12.36, volume: 2500 }
      ],
      timestamp: Date.now()
    }
  });
});

router.get('/market-depth/:code', (req, res) => {
  const { code } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      depth: [
        { price: 12.30, bidVolume: 5000, askVolume: 0 },
        { price: 12.31, bidVolume: 4000, askVolume: 0 },
        { price: 12.32, bidVolume: 3000, askVolume: 0 },
        { price: 12.33, bidVolume: 2000, askVolume: 0 },
        { price: 12.34, bidVolume: 1000, askVolume: 1000 },
        { price: 12.35, bidVolume: 0, askVolume: 2000 },
        { price: 12.36, bidVolume: 0, askVolume: 3000 },
        { price: 12.37, bidVolume: 0, askVolume: 4000 },
        { price: 12.38, bidVolume: 0, askVolume: 5000 }
      ],
      timestamp: Date.now()
    }
  });
});

// 3.12 交易日历
router.get('/calendar', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      tradingDays: ['2024-01-15', '2024-01-16', '2024-01-17'],
      holidays: [
        {
          date: '2024-01-01',
          name: '元旦',
          description: '新年假期'
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 3.13 账户报表
router.get('/accounts/:accountId/statements', (req, res) => {
  const { accountId } = req.params;
  res.json({
    code: 0,
    message: '成功',
    data: {
      accountId,
      statements: [
        {
          date: '2024-01-15',
          balance: 100000.00,
          marketValue: 50000.00,
          totalAssets: 150000.00,
          profit: 5000.00,
          profitRate: 3.33
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 3.14 数据导出
router.get('/export/orders', (req, res) => {
  res.json({
    code: 0,
    message: '导出成功',
    data: {
      downloadUrl: '/download/orders.csv',
      filename: 'orders.csv',
      timestamp: Date.now()
    }
  });
});

router.get('/export/deals', (req, res) => {
  res.json({
    code: 0,
    message: '导出成功',
    data: {
      downloadUrl: '/download/deals.csv',
      filename: 'deals.csv',
      timestamp: Date.now()
    }
  });
});

router.get('/export/positions', (req, res) => {
  res.json({
    code: 0,
    message: '导出成功',
    data: {
      downloadUrl: '/download/positions.csv',
      filename: 'positions.csv',
      timestamp: Date.now()
    }
  });
});

router.get('/export/fund-flows', (req, res) => {
  res.json({
    code: 0,
    message: '导出成功',
    data: {
      downloadUrl: '/download/fund-flows.csv',
      filename: 'fund-flows.csv',
      timestamp: Date.now()
    }
  });
});

// 3.15 交易限制
router.get('/trading-limits', (req, res) => {
  const { accountId } = req.query;
  res.json({
    code: 0,
    message: '成功',
    data: {
      accountId: accountId || 'account1',
      maxOrderAmount: 100000.00,
      maxPositionValue: 500000.00,
      maxDailyTrades: 100,
      maxDailyVolume: 1000000,
      enabled: true,
      timestamp: Date.now()
    }
  });
});

export default router; 