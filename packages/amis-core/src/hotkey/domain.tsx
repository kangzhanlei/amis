import {action} from 'mobx';
import {RendererAction} from '../actions';
import {
  FormItemStore,
  FormStore,
  IFormItemStore,
  IRendererStore,
  ModalStore,
  RendererStore,
  StoreNode
} from '../store';
import {IScopedContext} from '../Scoped';
import KeyStroke from './keyboard';
import {ModalManager} from 'amis-ui';

/**
 * 热键事件
 */
export class HotKeyEvent {
  key: string;
  scope?: string;
  eat: boolean = false;
  focusComponent?: React.Component; //焦点的组件实例
  focusStore?: IFormItemStore; //焦点的store
}

/**
 * 热键的绑定
 */
export interface HotkeyBinding {
  key: string;
  scope?: string;
  action?: RendererAction;
}

/**
 * 主要针对页面的一些设置
 */
export class Domain {
  /**
   * 构造domain实例
   * @param targetElement 挂载到哪个html的元素上
   * @param store 对应的rootStore数据，用于查找数据
   * @param scoped 对应的scoped范围，用于查找组件
   */
  constructor(
    targetElement: HTMLElement,
    store: IRendererStore,
    scoped: IScopedContext
  ) {
    this.targetElement = targetElement;
    this.store = store;
    this.scoped = scoped;
  }

  //当前激活的对话框
  activeDialog: any;
  //当前激活的抽屉
  activeDrawer: any;

  //表示当前domain是否处于busy状态（也就是业务处理状态），该状态不允许执行热键
  busy: boolean = false;

  /**
   * 当前激活的组件
   */
  listener: any;

  //根store,用于查找数据
  store: IRendererStore;

  //scoped，用于查找对象
  scoped: IScopedContext;

  //挂载到哪个元素下
  targetElement: HTMLElement;

  findFocusComponent(store): any {
    let children = null;
    if (store.storeType === RendererStore.name) {
      children = Object.values(store.stores);
    } else {
      children = store.children;
    }
    if (!children) {
      return null;
    }
    for (let child of children) {
      if (child.storeType === FormStore.name) {
        let result = this.findFocusComponent(child);
        if (result) {
          return result;
        }
      } else if (child.storeType === FormItemStore.name) {
        if ((child as IFormItemStore).isFocused) {
          return child;
        }
      }
    }
    return null;
  }

  keyPressed = () => {
    return (event: HotKeyEvent): boolean => {
      if (!this.scoped) {
        return false;
      }
      if (this.isBusy()) {
        return false;
      }
      if (
        ModalManager.current() > 0 &&
        ModalManager.currentModal().domain != this
      ) {
        //如果有弹框，忽略
        return false;
      }
      if (this.store) {
        const focusStore = this.findFocusComponent(this.store);
        event.focusStore = focusStore as IFormItemStore;
      }
      let componentId = event.focusStore?.itemId;
      if (!componentId) {
        let active = document.activeElement;
        if (active) {
          componentId = active.getAttribute('id');
          if (!componentId) {
            componentId = active.getAttribute('name');
          }
        }
      }
      if (!componentId) {
        return false;
      }

      const component =
        this.scoped.getComponentByIdUnderCurrentScope(componentId);
      event.focusComponent = component;
      component?.handleHotkey?.call(component, event);
      return event.eat;
    };
  };

  /**
   * 设置当前业务处于busy状态，busy状态下不执行热键
   * @param busy
   */
  @action.bound
  setBusy(busy: boolean) {
    this.busy = busy;
  }

  isBusy() {
    return this.busy;
  }

  /**
   * 在domain中执行业务逻辑，自动增加busy状态的处理
   * @param fn
   */
  @action.bound
  async doInDomain(fn: Function) {
    this.busy = true;
    try {
      await fn();
    } catch (err) {
      console.log(err);
    }
    this.busy = false;
  }

  /**
   * 注册热键功能
   */
  @action.bound installHotKey() {
    const fn = this.keyPressed();
    this.listener = function (keyEvent: KeyboardEvent) {
      let hotkeyEvent = {
        key: KeyStroke.getKeyStroke(keyEvent),
        eat: false
      } as HotKeyEvent;
      fn(hotkeyEvent) && keyEvent.preventDefault();
    };
    //处理绑定热键
    this.targetElement?.addEventListener('keydown', this.listener);
  }

  /**
   * 关闭热键功能
   */
  @action.bound
  unInstallHotKey() {
    this.targetElement?.removeEventListener('keydown', this.listener);
    this.listener = null;
  }
}

function focusable(element: Element | null) {
  if (!element) {
    return false;
  }
  return (element as HTMLElement).tabIndex !== -1;
}

/**
 * 从当前焦点组件，获取下一个可以获得焦点的组件
 * @param currentFocusingElement
 */
function getNextFocusableElement(
  currentFocusingElement: Element | null | undefined
): Element | null {
  const sourceElement = currentFocusingElement
    ? currentFocusingElement
    : document.activeElement;
  //本身就是空，返回空
  if (!sourceElement) {
    return null;
  }
  let targetElement: Element | null = null;
  //element是不是容器节点，如果是容器，首先找容器的第一个节点
  if (sourceElement?.childElementCount > 0) {
    //如果有孩子就找孩子
    targetElement = sourceElement?.firstElementChild;
  } else {
    //如果不是容器，就找自己的兄弟节点，看看下一个能不能接受
    targetElement = sourceElement.nextElementSibling;
  }
  //如果有兄弟节点，问她是不是能获取焦点
  if (targetElement) {
    //先看目标element是否可以接受焦点
    return focusable(targetElement)
      ? targetElement
      : getNextFocusableElement(targetElement);
  }
  //如果没有兄弟节点，说明父节点已经遍历完毕了，找叔叔节点
  targetElement = sourceElement.parentElement;
  while (targetElement) {
    let sibling = targetElement.nextElementSibling;
    if (sibling) {
      return focusable(sibling) ? sibling : getNextFocusableElement(sibling);
    } else {
      targetElement = targetElement.parentElement;
    }
  }
  return null;
}

/**
 * 从当前焦点组件，获取上一个可以获得焦点的组件
 * @param currentFocusingElement
 */
function getPreviousFocusableElement(
  currentFocusingElement: Element | null | undefined
): Element | null {
  const sourceElement = currentFocusingElement
    ? currentFocusingElement
    : document.activeElement;
  //本身就是空，返回空
  if (!sourceElement) {
    return null;
  }
  let targetElement: Element | null = null;
  //element是不是容器节点，如果是容器，首先找容器的第一个节点
  if (sourceElement?.childElementCount > 0) {
    //如果有孩子就找孩子
    targetElement = sourceElement?.lastElementChild;
  } else {
    //如果不是容器，就找自己的兄弟节点，看看下一个能不能接受
    targetElement = sourceElement.previousElementSibling;
  }
  //如果有兄弟节点，问她是不是能获取焦点
  if (targetElement) {
    //先看目标element是否可以接受焦点
    return focusable(targetElement)
      ? targetElement
      : getPreviousFocusableElement(targetElement);
  }
  //如果没有兄弟节点，说明父节点已经遍历完毕了，找叔叔节点
  targetElement = sourceElement.parentElement;
  while (targetElement) {
    let sibling = targetElement.previousSibling;
    if (sibling) {
      return focusable(sibling)
        ? sibling
        : getPreviousFocusableElement(sibling);
    } else {
      targetElement = targetElement.parentElement;
    }
  }
  return null;
}

/**
 * 导航的动作，比如按回车的时候，焦点往下走，按上箭头的时候，焦点往上走。 这里forward表示向前走，否则就是向上走
 * @param forward
 * @constructor
 */
export const NavigateDomainAction = function (forward: boolean) {
  return (event: HotKeyEvent) => {
    let component = event.focusComponent;
    let model = event.focusStore;
    let target = forward
      ? getNextFocusableElement(document.activeElement)
      : getPreviousFocusableElement(document.activeElement);
    model && model.blur();
    (target as HTMLElement)?.focus();
  };
};
