class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [], // Changed error to errors for consistency
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors; // Corrected assignment from errors parameter
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
