import { createContext } from '@lit/context';
import { YatlTableController } from './yatl-table-controller';
export const tableContext = createContext<YatlTableController>(
  Symbol('table-controller'),
);
