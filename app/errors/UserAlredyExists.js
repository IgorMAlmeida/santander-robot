export class UserAlredyExists extends Error {
  constructor(message, data = {}) {
    super(message);
    this.data = data;
    this.name = 'UserAlredyExists';
  }
}