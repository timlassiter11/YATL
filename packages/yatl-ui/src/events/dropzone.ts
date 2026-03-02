import { YatlEvent } from '@timlassiter11/yatl';

export class YatlDropzoneDragRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropzone-drag-request';
  constructor(
    public readonly dataTransfer: DataTransfer | null,
    public readonly context: unknown,
  ) {
    super(YatlDropzoneDragRequest.EVENT_NAME, { cancelable: true });
  }

  public override clone() {
    return new YatlDropzoneDragRequest(this.dataTransfer, this.context);
  }
}

export class YatlDropzoneDropRequest extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropzone-drop-request';

  private _rejectReason?: string;

  public get rejectReason() {
    return this._rejectReason;
  }

  constructor(
    public readonly dataTransfer: DataTransfer | null,
    public context: unknown,
  ) {
    super(YatlDropzoneDropRequest.EVENT_NAME, { cancelable: true });
  }

  public reject(reason?: string) {
    this.preventDefault();
    this._rejectReason = reason;
  }

  public override clone() {
    return new YatlDropzoneDropRequest(this.dataTransfer, this.context);
  }
}

export class YatlDropzoneDropEvent extends YatlEvent {
  public static readonly EVENT_NAME = 'yatl-dropzone-drop';
  constructor(
    public readonly dataTransfer: DataTransfer | null,
    public context: unknown,
  ) {
    super(YatlDropzoneDropEvent.EVENT_NAME);
  }

  public override clone() {
    return new YatlDropzoneDropEvent(this.dataTransfer, this.context);
  }
}

declare global {
  interface HTMLElementEventMap {
    [YatlDropzoneDragRequest.EVENT_NAME]: YatlDropzoneDragRequest;
    [YatlDropzoneDropRequest.EVENT_NAME]: YatlDropzoneDropRequest;
    [YatlDropzoneDropEvent.EVENT_NAME]: YatlDropzoneDropEvent;
  }
}
