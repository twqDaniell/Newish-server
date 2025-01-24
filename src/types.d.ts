import "multer";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: {
        [fieldname: string]: Express.Multer.File[]; // Dictionary of files
      } | Express.Multer.File[]; // Array of files
    }
  }
}
