import { createContext } from '@lit/context';
import { YatlTableController } from '@timlassiter11/yatl';
export const tableContext = createContext<YatlTableController>(
  Symbol('table-controller'),
);
