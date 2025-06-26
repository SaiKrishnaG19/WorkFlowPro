/**
 * Custom error class for database-related errors
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly detail?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }

  /**
   * Creates a formatted error message including error code and details if available
   */
  public getFullMessage(): string {
    let message = this.message
    if (this.code) {
      message = `[${this.code}] ${message}`
    }
    if (this.detail) {
      message = `${message}\nDetails: ${this.detail}`
    }
    return message
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}