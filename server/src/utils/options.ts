export enum NODE_ENV {
  DEV = "development",
  PRO = "production",
}

export enum ErrorType {
  CastError = "CastError",
  MongoDuplicateError = 11000,
  ValidationError = "ValidationError",
  NoDirError = "ENOENT",
}

export enum MemoryType {
  Public = "Public",
  Secret = "Secret",
  Private = "Private",
}
