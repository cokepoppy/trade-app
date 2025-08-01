/**
 * 路由工具模块
 * 提供 uni-app 页面跳转的统一封装
 */

export const router = {
  /**
   * 保留当前页面，跳转到应用内的某个页面
   */
  navigateTo(url: string) {
    uni.navigateTo({ url })
  },

  /**
   * 关闭当前页面，跳转到应用内的某个页面
   */
  redirectTo(url: string) {
    uni.redirectTo({ url })
  },

  /**
   * 关闭所有页面，打开到应用内的某个页面
   */
  reLaunch(url: string) {
    uni.reLaunch({ url })
  },

  /**
   * 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面
   */
  switchTab(url: string) {
    uni.switchTab({ url })
  },

  /**
   * 关闭当前页面，返回上一页面或多级页面
   */
  navigateBack(delta = 1) {
    uni.navigateBack({ delta })
  },

  /**
   * 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面（用于登录后跳转）
   */
  replaceTab(url: string) {
    uni.reLaunch({ url })
  }
}