console.log('简单测试开始');

import express from 'express';
console.log('express 导入成功');

const app = express();
console.log('app 创建成功');

app.listen(3000, () => {
  console.log('服务器启动成功 - 端口 3000');
});