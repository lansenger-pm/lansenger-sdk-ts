export class LansengerError extends Error {
  errCode?: number;
  retryable: boolean;

  constructor(message: string, errCode?: number, retryable: boolean = false) {
    super(message);
    this.errCode = errCode;
    this.retryable = retryable;
  }
}

export class LansengerAuthError extends LansengerError {
  constructor(message: string, errCode?: number) {
    super(message, errCode, false);
  }
}

export class LansengerConfigError extends LansengerError {
  constructor(message: string) {
    super(message, undefined, false);
  }
}

export class LansengerAPIError extends LansengerError {
  constructor(message: string, errCode?: number, retryable: boolean = true) {
    super(message, errCode, retryable);
  }
}

export class LansengerNetworkError extends LansengerError {
  constructor(message: string, retryable: boolean = true) {
    super(message, undefined, retryable);
  }
}

export class LansengerFileError extends LansengerError {
  constructor(message: string) {
    super(message, undefined, false);
  }
}