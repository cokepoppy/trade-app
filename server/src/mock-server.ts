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