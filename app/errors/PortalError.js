export class PortalError extends Error {
  constructor(message, requireBrowserClose = true) {
    super(message);
    this.requireBrowserClose = requireBrowserClose;
    this.name = 'PortalError';
  }
}