import { createContext } from '@lit/context';
import { UnspecifiedRecord, YatlTableController } from '@timlassiter11/yatl';

const tableContextKey = Symbol('table-controller');
export const getTableContext = <T extends object = UnspecifiedRecord>() =>
  createContext<YatlTableController<T>>(tableContextKey);
