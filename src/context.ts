import { createContext } from '@lit/context';
import { YatlTableController } from './controllers';
export const tableContext = createContext<YatlTableController>(
  Symbol('table-controller'),
);
