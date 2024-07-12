---
title: HotKey 热键
description:
type: 0
group: ⚙ 组件
menuName: HotKey 热键
icon:
order: 40
---

用来做全局热键，作为hotkeyjs的辅助。hotkeyjs是为某个组件或者动作提供热键，但是在某种情况下，不适合触发。
比如，当前页面弹出了一个dialog对话框，此时页面注册的热键不应该再次被执行，而是针对当前最顶端的dialog的热键才会生效。

本功能提供了4种类型的快捷键：

* 组件类型：即当前焦点在哪个组件上，就先执行哪个组件定义的快捷键（比如可以在下拉框上注册回车键展开下拉选项）
* 父容器类型： 组件没处理热键，则交由父组件处理，递归到最root的组件。
* 多页签类型： 只对当前active的页签生效，非活动页签不生效。
* App级别： 针对整个应用的热键，比如ALT+F4关闭等。

## 基本使用

```schema

{
  "type": "page",
  "body": {
    "type": "form",
    "api": "/amis/api/mock2/form/saveForm",
    "body": [
      {
        "name": "text",
        "type": "input-text",
        "label": "text"
      },{
      }
    ]
  }
}
```
