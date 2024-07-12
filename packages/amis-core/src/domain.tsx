import {action, observable} from 'mobx';
import {RendererAction} from './actions';
import {IFormItemStore} from './store';

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

  /**
   * 注册热键功能
   * @param fn
   */
  @action.bound installHotKey(fn: (event: HotKeyEvent) => boolean) {
    this.listener = function (domEvent: any) {
      let he = {
        key: 'esc'
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

export const domain = new Domain();
export const NavigateDomainAction = function (event: HotKeyEvent) {
  if (!event.focusComponent) {
    return;
  }
  let component = event.focusComponent;
  let model = event.focusStore;
};
