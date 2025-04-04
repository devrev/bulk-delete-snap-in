import bulk_delete_all from './functions/bulk_delete_all';
import snap_kit_template from './functions/snap_kit_template';

export const functionFactory = {
  bulk_delete_all,
  snap_kit_template,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
