import { YatlEvent } from '@timlassiter11/yatl';

export class YatlOptionToggleRequest extends YatlEvent {
  // Mimic the normal click event just with some extra details
  public static readonly EVENT_NAME = 'yatl-option-toggle';
  constructor(
    public readonly value: string,
    public readonly checked?: boolean,
  ) {
    super(YatlOptionToggleRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlOptionToggleRequest(this.value, this.checked);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlOptionToggleRequest.EVENT_NAME]: YatlOptionToggleRequest;
  }
}
