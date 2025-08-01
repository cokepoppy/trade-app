import { Router } from 'express';

const router = Router();

// 2.1 市场状态
router.get('/status', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      isTradingDay: true,
      isTradingTime: true,
      marketPhase: 'open',
      nextTradingDay: '2024-01-02',
      previousTradingDay: '2023-12-29',
      tradingDaysThisMonth: 20,
      tradingDaysThisYear: 240,
      holidays: [
        {
          date: '2024-01-01',
          name: '元旦',
          description: '新年假期',
          affectedMarkets: ['SH', 'SZ']
        }
      ]
    }
  });
});

// 2.2 指数数据
router.get('/indices', (req, res) => {
  const { market, type, page, pageSize } = req.query;
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        code: '000001',
        name: '上证指数',
        price: 2967.25,
        change: 15.42,
        changePercent: 0.52,
        volume: 245680000,
        amount: 2894560000,
        high: 2975.32,
        low: 2950.18,
        open: 2960.45,
        preClose: 2951.83,
        timestamp: 1640995200000,
        market: 'SH',
        type: 'index',
        description: '上海证券交易所综合指数',
        constituentCount: 1600,
        totalMarketValue: 45678900000000,
        pe: 15.8,
        pb: 1.6,
        dividendYield: 2.3
      }
    ]
  });
});

// 2.3 热门股票
router.get('/hot-stocks', (req, res) => {
  const { market, limit } = req.query;
  res.json({
    code: 0,
    message: '成功',
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
      }
    ]
  });
});

// 2.4 资金流向
router.get('/capital-flow', (req, res) => {
  const { date } = req.query;
  res.json({
    code: 0,
    message: '成功',
    data: {
      date: date || '2024-01-15',
      mainNetInflow: 1234567890,
      retailNetInflow: -234567890,
      institutionalNetInflow: 567890123,
      foreignNetInflow: 890123456,
      timestamp: Date.now()
    }
  });
});

// 2.5 市场情绪
router.get('/sentiment', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      sentiment: 'neutral',
      score: 0.65,
      bullishRatio: 0.45,
      bearishRatio: 0.35,
      neutralRatio: 0.20,
      timestamp: Date.now()
    }
  });
});

// 2.6 市场概览
router.get('/overview', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      totalStocks: 4500,
      risingStocks: 2345,
      fallingStocks: 1890,
      unchangedStocks: 265,
      totalVolume: 1234567890123,
      totalTurnover: 9876543210987,
      timestamp: Date.now()
    }
  });
});

// 2.7 市场排名
router.get('/ranking', (req, res) => {
  const { type, period, market, limit } = req.query;
  res.json({
    code: 0,
    message: '成功',
    data: {
      type,
      period,
      market,
      stocks: [
        {
          code: '000001',
          name: '平安银行',
          price: 12.34,
          change: 0.56,
          changePercent: 4.76,
          volume: 123456789,
          turnover: 987654321,
          timestamp: Date.now()
        }
      ].slice(0, parseInt(limit as string) || 10),
      timestamp: Date.now()
    }
  });
});

// 2.8 市场新闻
router.get('/news', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
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

// 2.11 股票筛选器
router.get('/screener', (req, res) => {
  const {
    market, type, industry, area, priceMin, priceMax,
    marketValueMin, marketValueMax, peMin, peMax,
    pbMin, pbMax, volumeMin, volumeMax, changeMin,
    changeMax, turnoverRateMin, turnoverRateMax,
    sortBy, sortOrder, page, pageSize
  } = req.query;
  
  res.json({
    code: 0,
    message: '成功',
    data: {
      list: [],
      total: 0,
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 20,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  });
});

// 2.12 板块和概念
router.get('/sectors', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        code: 'BK0001',
        name: '银行',
        change: 0.5,
        changePercent: 1.2,
        stocks: 42,
        timestamp: Date.now()
      }
    ]
  });
});

router.get('/concepts', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        code: 'GN0001',
        name: '人工智能',
        change: 2.1,
        changePercent: 3.5,
        stocks: 156,
        timestamp: Date.now()
      }
    ]
  });
});

// 2.13 市场日历
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

// 2.14 经济日历
router.get('/economic-calendar', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        id: '1',
        date: '2024-01-15',
        time: '10:00',
        country: 'CN',
        event: 'CPI数据',
        importance: 'high',
        previous: '2.1%',
        forecast: '2.0%',
        actual: '2.0%',
        impact: 'neutral'
      }
    ]
  });
});

// 2.18 市场分析
router.get('/trends', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      trends: [
        {
          period: 'day',
          direction: 'up',
          strength: 0.7,
          description: '短期趋势向上'
        }
      ],
      timestamp: Date.now()
    }
  });
});

router.get('/analysis', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      analysis: '市场整体表现稳定，建议关注科技板块',
      timestamp: Date.now()
    }
  });
});

router.get('/alerts', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: [
      {
        id: '1',
        type: 'price_alert',
        stock: '000001',
        price: 12.50,
        condition: 'above',
        status: 'active',
        timestamp: Date.now()
      }
    ]
  });
});

router.get('/statistics', (req, res) => {
  res.json({
    code: 0,
    message: '成功',
    data: {
      totalStocks: 4500,
      activeStocks: 4200,
      suspendedStocks: 300,
      timestamp: Date.now()
    }
  });
});

export default router; 