import {
  ListenerAction,
  ListenerContext,
  registerAction,
  RendererAction,
  RendererEvent
} from 'amis-core';

export interface IHotkeyAction extends ListenerAction {}

export class HotkeyAction implements RendererAction {
  async run(
    action: ListenerAction,
    renderer: ListenerContext,
    event: RendererEvent<any, any>,
    mergeData?: any
  ) {
    if (action.componentId) {
      const targetComponent = event.context.scoped?.getComponentById(
        action.componentId
      );
      targetComponent?.doAction?.(action, event.data, true, action.args);
      return;
    }
  }
}

registerAction('hotkey', new HotkeyAction());
