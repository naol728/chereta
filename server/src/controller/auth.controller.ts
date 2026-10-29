import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";

export const telgramAuth = catchAsync(
  (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: true,
      message: "suces",
    });
  },
);
