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

本功能提供了注册热键的便捷方法和基础实现。具体的热键动作需要使用方自定义函数。

## 基本使用

1. 在需要使用热键的组件容器上，增加生命周期函数处理
    ```typescript
       componentDidMount() {
        const {rootStore} = this.props;
        this.domain = new Domain(
          findDOMNode(this),
          rootStore,
          this.context as IScopedContext
        );
        this.domain.installHotKey();
      }
    
      componentWillUnmount() {
        this.domain.unInstallHotKey();
      }

    ``` 

表示开启热键功能

2. 需要对组件进行热键处理的，实现handleHotkey方法, 如

    ```typescript
        @autobind
        handleHotkey(event: HotKeyEvent) {
        const {onHotkey} = this.props;
        if (event.key === 'Enter'.toLowerCase()) {
         NavigateDomainAction(true)(event);
        } else if (event.key === 'ArrowUp'.toLowerCase()) {
          NavigateDomainAction(false)(event);
        } else {
         onHotkey?.(event);
        }
        }
    ``` 

3. 如果每个组件实现一遍handleHotkey稍显麻烦的话，可以在注册组件的装饰器@Renderer上，增加hotkeyActions的配置，如

    ```typescript
    @Renderer({
      type: 'form',
      storeType: FormStore.name,
      isolateScope: true,
      hotkeyActions: [{key: 'F4', action: 'handleSubmit'}] //表示在form上按F4的时候执行的是form的handleSubmit方法 
     //其他代码 ***********************************
    ```
   其含义是： 当前组件，在遇到F4的热键时，去执行组件的handleSubmit方法。  
   如果form上没有注册F4热键，会去form的父组件上看有没有注册F4事件（或者有没有重写handleHotkey方法），如有则执行
   一直冒泡到根节点（热键注册的根元素节点）。

4. 热键处理方法，可以通过event.eat=true表示拦截了这个热键，不再向上冒泡且不执行组件默认的动作。

## 基本原理

在需要开启热键功能的组件上（一般是root），注册dom的keydown监听，由于react的事件冒泡机制，
会首先到热键监听的listener上，然后再到react的事件处理机制，换句话说，就是先处理热键，热键没有拦截的话，再走react的事件。

在执行热键的时候，首先寻找当前焦点组件，看焦点组件有没有实现对应的热键方法，如果有，交由方法处理。如果没有注册，则寻找其父组件是否注册
了相应的处理函数，直到根节点（注册热键功能的根组件）。

比如，同样是`CTLR+T`热键，如果焦点在表格上，可以先执行表格注册的方法（比如打印表格），如果表格没处理，找父容器注册的`CTRL+T`
事件（比如是打印屏幕内容）

同时提供了全局热键导航功能，比如在焦点组件按`Enter`的时候，该组件没有处理，一直冒泡到根组件，发现根组件注册了处理函数，就会执行该处理函数，
进行焦点的导航（类似Tab的功能），方便在特定业务领域实现全键盘操作。

有种特例情况，因为热键动作优先于react事件，所以假设当在文本框上按`Enter`的时候，会默认执行导航事件，焦点转移到下一个组件。但是某些情况下
在文本框上按`Enter`的时候，业务动作是清空当前域，并再次输入，以便比对两次输入的值是否相同。这种情况下，热键动作需要知道，哪些组件上需要忽略
哪些热键（比如文本框忽略enter键）等，在热键运行时会放弃热键，进而处理react事件。
可以通过在运行时动态给组件设置`__IGNORE_HOTKEY__`屬性，或者在
@Renderer時，增加ignoreHotkeys配置。







   
    


