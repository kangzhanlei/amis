import {Evaluator, parse} from 'amis-formula';
import {memoParse} from './tokenize';

export const resolveVariableAndFilter = (
  path?: string,
  data: object = {},
  defaultFilter: string = '| html',
  fallbackValue = (value: any) => value
) => {
  if (!path || typeof path !== 'string') {
    return undefined;
  }

  try {
    const ast = memoParse(path, {
      evalMode: false,
      allowFilter: true
    });

    const ret = new Evaluator(data, {
      defaultFilter
    }).evalute(ast);

    return ret == null && !~path.indexOf('default') && !~path.indexOf('now')
      ? fallbackValue(ret)
      : ret;
  } catch (e) {
    console.warn(e);
    return undefined;
  }
};
