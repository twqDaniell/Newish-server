import Multer from "multer";

declare namespace Express {
    export interface Request {
      file?: Multer.File; // Single file
      files?: Multer.File[]; // Multiple files (if needed)
    }
  }
  