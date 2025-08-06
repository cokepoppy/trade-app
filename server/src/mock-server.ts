import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock data
const mockMarketStatus = {
  code: 0,
  message: 'success',
  data: {
    isTradingTime: true,
    marketStatus: 'open',
    tradingHours: {
      start: '09:30',
      end: '15:00'
    },
    nextTradingDay: '2024-01-15'
  }
};

const mockIndices = {
  code: 0,
  message: 'success',
  data: [
    {
      code: '000001',
      name: '上证指数',
      price: 3123.45,
      change: 12.34,
      changePercent: 0.40,
      volume: 1234567890,
      turnover: 9876543210,
      timestamp: Date.now()
    },
    {
      code: '000002',
      name: '深证成指',
      price: 10234.56,
      change: -23.45,
      changePercent: -0.23,
      volume: 2345678901,
      turnover: 8765432109,
      timestamp: Date.now()
    },
    {
      code: '000300',
      name: '沪深300',
      price: 3456.78,
      change: 8.90,
      changePercent: 0.26,
      volume: 3456789012,
      turnover: 7654321098,
      timestamp: Date.now()
    }
  ]
};

const mockHotStocks = {
  code: 0,
  message: 'success',
  data: [
    {
      code: '000001',
      name: '平安银行',
      price: 12.34,
      change: 0.56,
      changePercent: 4.76,
      volume: 123456789,
      turnover: 987654321,
      timestamp: Date.now()
    },
    {
      code: '000002',
      name: '万科A',
      price: 23.45,
      change: -0.78,
      changePercent: -3.22,
      volume: 234567890,
      turnover: 876543210,
      timestamp: Date.now()
    },
    {
      code: '000858',
      name: '五粮液',
      price: 156.78,
      change: 3.45,
      changePercent: 2.25,
      volume: 345678901,
      turnover: 765432109,
      timestamp: Date.now()
    }
  ]
};

const mockCapitalFlow = {
  code: 0,
  message: 'success',
  data: {
    date: '2024-01-15',
    mainNetInflow: 1234567890,
    retailNetInflow: -234567890,
    institutionalNetInflow: 567890123,
    foreignNetInflow: 890123456,
    timestamp: Date.now()
  }
};

const mockMarketSentiment = {
  code: 0,
  message: 'success',
  data: {
    sentiment: 'neutral',
    score: 0.65,
    bullishRatio: 0.45,
    bearishRatio: 0.35,
    neutralRatio: 0.20,
    timestamp: Date.now()
  }
};

const mockMarketOverview = {
  code: 0,
  message: 'success',
  data: {
    totalStocks: 4500,
    risingStocks: 2345,
    fallingStocks: 1890,
    unchangedStocks: 265,
    totalVolume: 1234567890123,
    totalTurnover: 9876543210987,
    timestamp: Date.now()
  }
};

// API Routes
app.get('/api/market/status', (req, res) => {
  res.json(mockMarketStatus);
});

app.get('/api/market/indices', (req, res) => {
  res.json(mockIndices);
});

app.get('/api/market/hot-stocks', (req, res) => {
  res.json(mockHotStocks);
});

app.get('/api/market/capital-flow', (req, res) => {
  res.json(mockCapitalFlow);
});

app.get('/api/market/sentiment', (req, res) => {
  res.json(mockMarketSentiment);
});

app.get('/api/market/overview', (req, res) => {
  res.json(mockMarketOverview);
});

app.get('/api/market/ranking', (req, res) => {
  const { type, period } = req.query;
  res.json({
    code: 0,
    message: 'success',
    data: {
      type,
      period,
      stocks: mockHotStocks.data.slice(0, 10),
      timestamp: Date.now()
    }
  });
});

app.get('/api/market/news', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      list: [
        {
          id: '1',
          title: '市场动态：A股今日表现良好',
          summary: '今日A股市场整体表现良好，主要指数均有上涨',
          content: '详细内容...',
          publishTime: Date.now(),
          source: '财经网'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    }
  });
});

// Stock related endpoints
app.get('/api/stock/:code/quote', (req, res) => {
  const { code } = req.params;
  
  // 根据股票代码返回真实的股票名称
  const stockNames: Record<string, string> = {
    '000001': '平安银行',
    '000002': '万科A',
    '000858': '五粮液',
    '600036': '招商银行',
    '600519': '贵州茅台',
    '600887': '伊利股份',
    '000895': '双汇发展',
    '600000': '浦发银行',
    '600028': '中国石化',
    '601318': '中国平安'
  };
  
  const stockName = stockNames[code] || `股票${code}`;
  
  // 生成更真实的股票数据
  const basePrice = 10 + Math.random() * 100;
  const change = (Math.random() - 0.5) * 2;
  const changePercent = (change / basePrice) * 100;
  const volume = Math.floor(Math.random() * 100000000) + 10000000;
  const turnover = volume * basePrice;
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      code,
      name: stockName,
      price: basePrice,
      change: change,
      changePercent: changePercent,
      volume: volume,
      amount: turnover,
      high: basePrice + Math.random() * 2,
      low: basePrice - Math.random() * 2,
      open: basePrice + (Math.random() - 0.5) * 1,
      timestamp: Date.now()
    }
  });
});

app.get('/api/stock/:code/detail', (req, res) => {
  const { code } = req.params;
  
  // 根据股票代码返回真实的股票名称
  const stockNames: Record<string, string> = {
    '000001': '平安银行',
    '000002': '万科A',
    '000858': '五粮液',
    '600036': '招商银行',
    '600519': '贵州茅台',
    '600887': '伊利股份',
    '000895': '双汇发展',
    '600000': '浦发银行',
    '600028': '中国石化',
    '601318': '中国平安'
  };
  
  const stockName = stockNames[code] || `股票${code}`;
  
  // 生成更真实的股票数据
  const basePrice = 10 + Math.random() * 100;
  const change = (Math.random() - 0.5) * 2;
  const changePercent = (change / basePrice) * 100;
  const volume = Math.floor(Math.random() * 100000000) + 10000000;
  const turnover = volume * basePrice;
  const marketCap = turnover * (Math.random() * 10 + 5);
  
  // 计算均价和换手率
  const avgPrice = basePrice + (Math.random() - 0.5) * 0.5;
  const turnoverRate = (volume / (marketCap / basePrice)) * 100;
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      code,
      name: stockName,
      price: basePrice,
      change: change,
      changePercent: changePercent,
      volume: volume,
      amount: turnover,
      high: basePrice + Math.random() * 2,
      low: basePrice - Math.random() * 2,
      open: basePrice + (Math.random() - 0.5) * 1,
      avgPrice: avgPrice,
      turnoverRate: turnoverRate,
      marketCap: marketCap,
      pe: 15 + Math.random() * 30,
      pb: 1 + Math.random() * 5,
      eps: basePrice / (15 + Math.random() * 30),
      navps: basePrice / (1 + Math.random() * 5),
      totalShares: Math.floor(marketCap / basePrice),
      timestamp: Date.now()
    }
  });
});

// Mock trade data
const mockAccounts = [
  {
    id: 'acc_001',
    userId: 'user_001',
    accountName: '主账户',
    accountType: 'stock',
    accountNumber: '1234567890',
    status: 'active',
    balance: 100000,
    availableBalance: 85000,
    frozenBalance: 15000,
    totalAssets: 125000,
    marketValue: 40000,
    costAmount: 35000,
    currentAmount: 40000,
    profit: 5000,
    profitPercent: 14.29,
    todayProfit: 1200,
    todayProfitPercent: 3.09,
    margin: 0,
    marginRate: 0,
    riskLevel: 'low',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  }
];

// Mock user messages
const mockMessages = [
  {
    id: 'msg_001',
    userId: 'user_001',
    type: 'system',
    title: '系统通知',
    content: '您的账户安全验证已通过，请继续使用。',
    summary: '您的账户安全验证已通过，请继续使用。',
    priority: 'medium',
    isRead: false,
    isDeleted: false,
    createdAt: Date.now() - 3600000,
    readTime: null,
    deleteTime: null,
    relatedId: null,
    relatedType: null
  },
  {
    id: 'msg_002',
    userId: 'user_001',
    type: 'order',
    title: '订单通知',
    content: '您的限价买单已提交，请等待成交。',
    summary: '您的限价买单已提交，请等待成交。',
    priority: 'high',
    isRead: false,
    isDeleted: false,
    createdAt: Date.now() - 7200000,
    readTime: null,
    deleteTime: null,
    relatedId: 'order_001',
    relatedType: 'order'
  },
  {
    id: 'msg_003',
    userId: 'user_001',
    type: 'news',
    title: '资讯通知',
    content: '市场热点更新，请查看最新资讯。',
    summary: '市场热点更新，请查看最新资讯。',
    priority: 'low',
    isRead: true,
    isDeleted: false,
    createdAt: Date.now() - 86400000,
    readTime: Date.now() - 43200000,
    deleteTime: null,
    relatedId: null,
    relatedType: null
  }
];

const mockPositions = [
  {
    id: 'pos_001',
    userId: 'user_001',
    accountId: 'acc_001',
    code: '000001',
    name: '平安银行',
    volume: 1000,
    availableVolume: 1000,
    availableShares: 1000,
    buyPrice: 11.50,
    currentPrice: 12.34,
    marketValue: 12340,
    costAmount: 11500,
    currentAmount: 12340,
    profit: 840,
    profitPercent: 7.30,
    todayProfit: 120,
    todayProfitPercent: 0.98,
    turnoverRate: 0.5,
    pe: 8.5,
    pb: 1.2,
    eps: 1.45,
    navps: 10.28,
    totalShares: 1000000000,
    marketCap: 12340000000,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now()
  }
];

const mockOrders = [
  {
    id: 'order_001',
    userId: 'user_001',
    accountId: 'acc_001',
    code: '000001',
    name: '平安银行',
    type: 'buy',
    priceType: 'limit',
    price: 11.50,
    volume: 1000,
    filledVolume: 1000,
    amount: 11500,
    filledAmount: 11500,
    status: 'filled',
    orderTime: Date.now() - 3600000,
    filledTime: Date.now() - 1800000,
    cancelTime: null,
    rejectReason: null,
    remark: '测试买入',
    fee: 5.75,
    tax: 0,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000
  },
  {
    id: 'order_002',
    userId: 'user_001',
    accountId: 'acc_001',
    code: '000858',
    name: '五粮液',
    type: 'buy',
    priceType: 'limit',
    price: 155.00,
    volume: 100,
    filledVolume: 0,
    amount: 15500,
    filledAmount: 0,
    status: 'pending',
    orderTime: Date.now() - 300000,
    filledTime: null,
    cancelTime: null,
    rejectReason: null,
    remark: '测试限价单',
    fee: 0,
    tax: 0,
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000
  }
];

const mockDeals = [
  {
    id: 'deal_001',
    userId: 'user_001',
    orderId: 'order_001',
    accountId: 'acc_001',
    code: '000001',
    name: '平安银行',
    type: 'buy',
    price: 11.50,
    volume: 1000,
    amount: 11500,
    dealTime: Date.now() - 1800000,
    fee: 5.75,
    tax: 0,
    createdAt: Date.now() - 1800000
  }
];

const mockFundFlows = [
  {
    id: 'flow_001',
    userId: 'user_001',
    accountId: 'acc_001',
    type: 'deposit',
    amount: 50000,
    status: 'completed',
    paymentMethod: 'bank_transfer',
    description: '银行转账入金',
    createTime: Date.now() - 86400000 * 2,
    completeTime: Date.now() - 86400000 * 2,
    fee: 0,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'flow_002',
    userId: 'user_001',
    accountId: 'acc_001',
    type: 'withdraw',
    amount: 10000,
    status: 'completed',
    paymentMethod: 'bank_card',
    description: '银行卡出金',
    createTime: Date.now() - 86400000 * 10,
    completeTime: Date.now() - 86400000 * 10,
    fee: 5,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10
  }
];

const mockSettings = {
  id: 'settings_001',
  userId: 'user_001',
  defaultAccountId: 'acc_001',
  tradeMode: 'normal',
  riskLevel: 'medium',
  marginTrading: false,
  shortSelling: false,
  optionsTrading: false,
  futuresTrading: false,
  autoConfirm: false,
  tradePassword: true,
  biometricAuth: false,
  notifications: {
    orderFilled: true,
    orderCancelled: true,
    priceAlert: true,
    newsAlert: false,
    systemAlert: true
  },
  tradingLimits: {
    maxSingleOrder: 1000000,
    maxDailyOrders: 100,
    maxPositionValue: 500000,
    maxLeverage: 1
  },
  createdAt: Date.now() - 86400000 * 30,
  updatedAt: Date.now()
};

// Trade API endpoints
app.get('/api/trade/accounts', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: mockAccounts
  });
});

app.get('/api/trade/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  const account = mockAccounts.find(acc => acc.id === accountId);
  
  if (account) {
    res.json({
      code: 0,
      message: 'success',
      data: account
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '账户不存在',
      data: null
    });
  }
});

// Additional endpoint for getAccountInfo that returns availableFunds
app.get('/api/trade/accounts/:accountId/info', (req, res) => {
  const { accountId } = req.params;
  const account = mockAccounts.find(acc => acc.id === accountId);
  
  if (account) {
    res.json({
      code: 0,
      message: 'success',
      data: {
        ...account,
        availableFunds: account.availableBalance
      }
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '账户不存在',
      data: null
    });
  }
});

// Also update the main accounts endpoint to include availableFunds
app.get('/api/trade/accounts', (req, res) => {
  const accountsWithFunds = mockAccounts.map(account => ({
    ...account,
    availableFunds: account.availableBalance
  }));
  
  res.json({
    code: 0,
    message: 'success',
    data: accountsWithFunds
  });
});

app.get('/api/trade/positions', (req, res) => {
  const { accountId } = req.query;
  let positions = mockPositions;
  
  if (accountId) {
    positions = positions.filter(pos => pos.accountId === accountId);
  }
  
  res.json({
    code: 0,
    message: 'success',
    data: positions
  });
});

app.get('/api/trade/orders', (req, res) => {
  const { accountId, status, limit } = req.query;
  let orders = mockOrders;
  
  if (accountId) {
    orders = orders.filter(order => order.accountId === accountId);
  }
  
  if (status) {
    orders = orders.filter(order => order.status === status);
  }
  
  if (limit) {
    orders = orders.slice(0, parseInt(limit as string));
  }
  
  res.json({
    code: 0,
    message: 'success',
    data: orders
  });
});

app.get('/api/trade/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = mockOrders.find(o => o.id === orderId);
  
  if (order) {
    res.json({
      code: 0,
      message: 'success',
      data: order
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '订单不存在',
      data: null
    });
  }
});

app.post('/api/trade/orders', (req, res) => {
  const newOrder = {
    id: `order_${Date.now()}`,
    userId: 'user_001',
    accountId: req.body.accountId || 'acc_001',
    code: req.body.code,
    name: req.body.name,
    type: req.body.type,
    priceType: req.body.priceType,
    price: req.body.price,
    volume: req.body.volume,
    filledVolume: 0,
    amount: req.body.price * req.body.volume,
    filledAmount: 0,
    status: 'pending',
    orderTime: Date.now(),
    filledTime: null,
    cancelTime: null,
    rejectReason: null,
    remark: req.body.remark || '',
    fee: 0,
    tax: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  mockOrders.unshift(newOrder);
  
  res.json({
    code: 0,
    message: 'success',
    data: newOrder
  });
});

app.post('/api/trade/orders/:orderId/cancel', (req, res) => {
  const { orderId } = req.params;
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  
  if (orderIndex !== -1) {
    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      status: 'cancelled',
      cancelTime: Date.now(),
      updatedAt: Date.now()
    };
    
    res.json({
      code: 0,
      message: 'success',
      data: mockOrders[orderIndex]
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '订单不存在',
      data: null
    });
  }
});

app.get('/api/trade/deals', (req, res) => {
  const { accountId, limit } = req.query;
  let deals = mockDeals;
  
  if (accountId) {
    deals = deals.filter(deal => deal.accountId === accountId);
  }
  
  if (limit) {
    deals = deals.slice(0, parseInt(limit as string));
  }
  
  res.json({
    code: 0,
    message: 'success',
    data: deals
  });
});

app.get('/api/trade/fund-flows', (req, res) => {
  const { accountId, type, limit } = req.query;
  let flows = mockFundFlows;
  
  if (accountId) {
    flows = flows.filter(flow => flow.accountId === accountId);
  }
  
  if (type) {
    flows = flows.filter(flow => flow.type === type);
  }
  
  if (limit) {
    flows = flows.slice(0, parseInt(limit as string));
  }
  
  res.json({
    code: 0,
    message: 'success',
    data: flows
  });
});

app.get('/api/trade/settings', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: mockSettings
  });
});

app.get('/api/trade/statistics', (req, res) => {
  const stats = {
    totalProfit: mockAccounts.reduce((sum, acc) => sum + acc.profit, 0),
    totalProfitPercent: mockAccounts.length > 0 ? 
      mockAccounts.reduce((sum, acc) => sum + acc.profitPercent, 0) / mockAccounts.length : 0,
    todayProfit: mockAccounts.reduce((sum, acc) => sum + acc.todayProfit, 0),
    totalAssets: mockAccounts.reduce((sum, acc) => sum + acc.totalAssets, 0),
    totalPositions: mockPositions.length,
    totalOrders: mockOrders.length,
    totalDeals: mockDeals.length,
    winRate: mockDeals.length > 0 ? 0.65 : 0,
    avgProfit: mockDeals.length > 0 ? 850 : 0,
    maxDrawdown: -5.2,
    sharpeRatio: 1.45,
    period: '1M',
    timestamp: Date.now()
  };
  
  res.json({
    code: 0,
    message: 'success',
    data: stats
  });
});

// User message endpoints
app.get('/api/user/messages/unread', (req, res) => {
  const unreadMessages = mockMessages.filter(msg => !msg.isRead);
  
  res.json({
    code: 0,
    message: 'success',
    data: unreadMessages,
    timestamp: Date.now()
  });
});

app.get('/api/user/messages', (req, res) => {
  const { page = 1, pageSize = 20, type, isRead, priority } = req.query;
  
  let filteredMessages = [...mockMessages];
  
  if (type) {
    filteredMessages = filteredMessages.filter(msg => msg.type === type);
  }
  
  if (isRead !== undefined) {
    const readStatus = isRead === 'true';
    filteredMessages = filteredMessages.filter(msg => msg.isRead === readStatus);
  }
  
  if (priority) {
    filteredMessages = filteredMessages.filter(msg => msg.priority === priority);
  }
  
  const pageNum = parseInt(page as string);
  const sizeNum = parseInt(pageSize as string);
  const startIndex = (pageNum - 1) * sizeNum;
  const endIndex = startIndex + sizeNum;
  
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      list: paginatedMessages,
      total: filteredMessages.length,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(filteredMessages.length / sizeNum),
      hasNext: endIndex < filteredMessages.length,
      hasPrev: pageNum > 1
    },
    timestamp: Date.now()
  });
});

app.get('/api/user/messages/:messageId', (req, res) => {
  const { messageId } = req.params;
  const message = mockMessages.find(msg => msg.id === messageId);
  
  if (message) {
    res.json({
      code: 0,
      message: 'success',
      data: message,
      timestamp: Date.now()
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '消息不存在',
      data: null
    });
  }
});

app.post('/api/user/messages/:messageId/read', (req, res) => {
  const { messageId } = req.params;
  const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex !== -1) {
    mockMessages[messageIndex] = {
      ...mockMessages[messageIndex],
      isRead: true,
      readTime: Date.now()
    };
    
    res.json({
      code: 0,
      message: 'success',
      data: mockMessages[messageIndex],
      timestamp: Date.now()
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '消息不存在',
      data: null
    });
  }
});

app.post('/api/user/messages/mark-all-read', (req, res) => {
  mockMessages.forEach(msg => {
    if (!msg.isRead) {
      msg.isRead = true;
      msg.readTime = Date.now();
    }
  });
  
  res.json({
    code: 0,
    message: 'success',
    data: null,
    timestamp: Date.now()
  });
});

app.delete('/api/user/messages/:messageId', (req, res) => {
  const { messageId } = req.params;
  const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex !== -1) {
    mockMessages[messageIndex] = {
      ...mockMessages[messageIndex],
      isDeleted: true,
      deleteTime: Date.now()
    };
    
    res.json({
      code: 0,
      message: 'success',
      data: null,
      timestamp: Date.now()
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '消息不存在',
      data: null
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'Trade App Mock Server',
    version: '1.0.0',
    environment: 'development',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API 路由不存在',
    timestamp: Date.now(),
    path: req.originalUrl,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    timestamp: Date.now(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log(`📡 API base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

export default app; 