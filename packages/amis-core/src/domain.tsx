import {action, observable} from 'mobx';
import {RendererAction} from './actions';
import {
  FormItemStore,
  IFormItemStore,
  IIRendererStore,
  IRendererStore
} from './store';
import {IRootStore} from './store/root';
import {IScopedContext} from './Scoped';
import {findDOMNode} from 'react-dom';

/**
 * 热键事件
 */
export class HotKeyEvent {
  key: string;
  scope?: string;
  eat: boolean;
  focusComponent?: React.Component;
  focusStore?: IFormItemStore;
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
   * 当前激活的组件
   */
  @observable activeControl: string;
  listener: any;

  keyPressed = (rootStore: IRootStore, scoped: IScopedContext) => {
    return (event: HotKeyEvent): boolean => {
      const focusStore = Object.values(rootStore.stores).filter(store => {
        return (
          store.storeType === FormItemStore.name &&
          (store as IFormItemStore).isFocused
        );
      });
      if (focusStore.length > 0) {
        //表示当前焦点在form表单上，找到这个表单，问问他处理这个热键不？
        //处理机制是，自己先处理，没处理的话问问父亲处理不处理，父亲不处理问问爷爷处理不处理，直到root结束
        let componentId = (focusStore[0] as IFormItemStore).itemId;
        const component = scoped.getComponentByIdUnderCurrentScope(componentId);
        event.focusComponent = component;
        event.focusStore = focusStore[0] as IFormItemStore;
        component?.handleHotkey?.call(component, event);
      }
      return event.eat;
    };
  };

  /**
   * 注册热键功能
   * @param fn
   */
  @action.bound installHotKey(
    rootStore: IRendererStore,
    scoped: IScopedContext
  ) {
    const fn = this.keyPressed(rootStore, scoped);
    this.listener = function (domEvent: any) {
      let he = {
        key: domEvent.key
      } as HotKeyEvent;
      fn(he) && domEvent.preventDefault();
    };
    //处理绑定热键
    document.addEventListener('keydown', this.listener);
  }

  /**
   * 关闭热键功能
   */
  @action.bound
  unInstallHotKey() {
    document.removeEventListener('keydown', this.listener);
    this.listener = null;
  }
}

function focusable(element: Element | null) {
  console.log(
    '检查：' +
      element?.getAttribute('name') +
      ',tabIndex=' +
      element['tabIndex']
  );
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

export const domain = new Domain();
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
    (target as HTMLElement)?.focus();
  };
};
