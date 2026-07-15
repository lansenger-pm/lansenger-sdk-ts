let _sdkDebug = false;

export function setSDKDebug(enabled: boolean): void { _sdkDebug = enabled; }
export function t(): string { return `[${new Date().toISOString().slice(11, 19)}] [DEBUG]`; }
export function isSDKDebug(): boolean { return _sdkDebug; }
