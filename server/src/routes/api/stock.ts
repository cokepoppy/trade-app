import { Router } from 'express';

const router = Router();

// 2.9 股票详情
router.get('/:code/quote', (req, res) => {
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
    message: '成功',
    data: {
      code,
      name: stockName,
      price: basePrice,
      change: change,
      changePercent: changePercent,
      volume: volume,
      turnover: turnover,
      high: basePrice + Math.random() * 2,
      low: basePrice - Math.random() * 2,
      open: basePrice + (Math.random() - 0.5) * 1,
      preClose: basePrice - change,
      timestamp: Date.now()
    }
  });
});

router.get('/:code/detail', (req, res) => {
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
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      name: stockName,
      price: basePrice,
      change: change,
      changePercent: changePercent,
      volume: volume,
      turnover: turnover,
      marketCap: marketCap,
      pe: 15 + Math.random() * 30,
      pb: 1 + Math.random() * 5,
      dividendYield: 1 + Math.random() * 4,
      eps: basePrice / (15 + Math.random() * 30),
      bps: basePrice / (1 + Math.random() * 5),
      roe: 5 + Math.random() * 15,
      roa: 1 + Math.random() * 5,
      debtRatio: 30 + Math.random() * 40,
      timestamp: Date.now()
    }
  });
});

// 2.9.3 获取股票K线数据
router.get('/:code/kline', (req, res) => {
  const { code } = req.params;
  const { period, type, indicators, startDate, endDate } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      period,
      type,
      data: [
        {
          time: 1640995200000,
          open: 12.10,
          high: 12.50,
          low: 12.00,
          close: 12.34,
          volume: 123456789
        }
      ],
      indicators: indicators ? (indicators as string).split(',') : [],
      timestamp: Date.now()
    }
  });
});

// 2.9.4 获取股票分时图
router.get('/:code/timeshare', (req, res) => {
  const { code } = req.params;
  const { date } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      date: date || '2024-01-15',
      data: [
        {
          time: '09:30',
          price: 12.10,
          volume: 123456,
          amount: 1234567
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.9.5 获取股票买卖盘
router.get('/:code/orderbook', (req, res) => {
  const { code } = req.params;
  const { depth } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      depth: parseInt(depth as string) || 5,
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

// 2.9.6 获取股票成交明细
router.get('/:code/transactions', (req, res) => {
  const { code } = req.params;
  const { date, limit } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      date: date || '2024-01-15',
      transactions: [
        {
          time: '14:30:15',
          price: 12.34,
          volume: 1000,
          amount: 12340,
          type: 'buy'
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.9.7 获取股票财务数据
router.get('/:code/financial', (req, res) => {
  const { code } = req.params;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      financials: {
        revenue: 1234567890,
        netProfit: 123456789,
        totalAssets: 9876543210,
        totalLiabilities: 4567890123,
        cashFlow: 234567890
      },
      timestamp: Date.now()
    }
  });
});

// 2.9.8 获取股票新闻
router.get('/:code/news', (req, res) => {
  const { code } = req.params;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      news: [
        {
          id: '1',
          title: '公司发布重要公告',
          summary: '公司发布关于重大事项的公告',
          publishTime: Date.now(),
          source: '公司公告'
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.9.9 获取股票公告
router.get('/:code/announcements', (req, res) => {
  const { code } = req.params;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      announcements: [
        {
          id: '1',
          title: '关于公司重大事项的公告',
          content: '公告详细内容...',
          publishTime: Date.now(),
          type: 'important'
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.10 股票搜索
router.get('/search', (req, res) => {
  const { keyword, market, type, limit } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        code: '000001',
        name: '平安银行',
        market: 'SZ',
        type: 'stock',
        price: 12.34,
        change: 0.56,
        changePercent: 4.76
      }
    ]
  });
});

// 2.15 历史数据
router.get('/:code/historical', (req, res) => {
  const { code } = req.params;
  const { startDate, endDate, period } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      period: period || 'day',
      data: [
        {
          date: '2024-01-15',
          open: 12.10,
          high: 12.50,
          low: 12.00,
          close: 12.34,
          volume: 123456789
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.15.2 获取分红历史
router.get('/:code/dividends', (req, res) => {
  const { code } = req.params;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      dividends: [
        {
          date: '2023-12-31',
          amount: 0.5,
          type: 'cash',
          exDate: '2023-12-29'
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.15.3 获取拆股历史
router.get('/:code/splits', (req, res) => {
  const { code } = req.params;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      code,
      splits: [
        {
          date: '2023-06-30',
          ratio: '2:1',
          description: '每2股送1股'
        }
      ],
      timestamp: Date.now()
    }
  });
});

// 2.16 批量操作
router.post('/batch-quotes', (req, res) => {
  const { codes } = req.body;
  
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
  
  res.json({
    code: 0,
    message: '成功',
    data: codes.map((code: string) => {
      const stockName = stockNames[code] || `股票${code}`;
      const basePrice = 10 + Math.random() * 100;
      const change = (Math.random() - 0.5) * 2;
      const changePercent = (change / basePrice) * 100;
      
      return {
        code,
        name: stockName,
        price: basePrice,
        change: change,
        changePercent: changePercent,
        timestamp: Date.now()
      };
    })
  });
});

router.post('/batch-details', (req, res) => {
  const { codes } = req.body;
  
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
  
  res.json({
    code: 0,
    message: '成功',
    data: codes.map((code: string) => {
      const stockName = stockNames[code] || `股票${code}`;
      const basePrice = 10 + Math.random() * 100;
      const change = (Math.random() - 0.5) * 2;
      const changePercent = (change / basePrice) * 100;
      const volume = Math.floor(Math.random() * 100000000) + 10000000;
      const turnover = volume * basePrice;
      const marketCap = turnover * (Math.random() * 10 + 5);
      
      return {
        code,
        name: stockName,
        price: basePrice,
        change: change,
        changePercent: changePercent,
        marketCap: marketCap,
        pe: 15 + Math.random() * 30,
        pb: 1 + Math.random() * 5,
        timestamp: Date.now()
      };
    })
  });
});

// 2.17 实时订阅
router.post('/subscribe-quotes', (req, res) => {
  const { codes } = req.body;
  
  res.json({
    code: 0,
    message: '订阅成功',
    data: {
      subscribedCodes: codes,
      timestamp: Date.now()
    }
  });
});

router.post('/unsubscribe-quotes', (req, res) => {
  const { codes } = req.body;
  
  res.json({
    code: 0,
    message: '取消订阅成功',
    data: {
      unsubscribedCodes: codes,
      timestamp: Date.now()
    }
  });
});

export default router; 