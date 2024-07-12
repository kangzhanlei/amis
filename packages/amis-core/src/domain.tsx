import {action, observable} from 'mobx';
import {RendererAction} from './actions';

/**
 * 热键事件
 */
export class HotKeyEvent {
  key: string;
  scopes?: string[];
  eat: boolean;
}

export interface HotkeyBinding {
  key: string;
  domain?: string;
  action?: RendererAction;
}

export class Domain {
  /**
   * 当前激活的组件
   */
  @observable activeControl: string;
  listener: any;

  @action.bound focus(activeControl: string) {
    this.activeControl = activeControl;
  }

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

  @action.bound
  unInstallHotKey() {
    document.removeEventListener('keydown', this.listener);
    this.listener = null;
  }
}

export const domain = new Domain();
