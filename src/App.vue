<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
/* 引入移动端适配样式 */
@import './styles/mobile.css';

/* App全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

/* PC端容器适配 */
@media (min-width: 769px) {
  .app-container {
    max-width: 414px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    min-height: 100vh;
    position: relative;
    background-color: #fff;
  }
}

/* 移动端样式 */
@media (max-width: 768px) {
  .app-container {
    width: 100%;
    min-height: 100vh;
  }
}
</style>
