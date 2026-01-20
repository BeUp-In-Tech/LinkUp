/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { CatchAsync } from '../../utils/CatchAsync';
import { SendResponse } from '../../utils/SendResponse';
import { StatusCodes } from 'http-status-codes';
import { categoryServices } from './category.service';

// CREATE EVENT CATEGORY
const createEventCategory = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category_name, category_icon } = req.body;
    const result = await categoryServices.createEventCategoryService({
      category_icon,
      category_name,
    });
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Created event category!',
      data: result,
    });
  }
);

// GET EVENT CATEGORY
const getEventCategory = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const isDeleted = req.query.isDeleted === 'true';
    const result = await categoryServices.getEventCategoryService(isDeleted);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Category fetched success!',
      data: result,
    });
  }
);

// UPDATE EVENT CATEGORY
const updateEventCategory = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const payload = req.body;
    const result = await categoryServices.updateEventCategoryService(
      categoryId,
      payload
    );
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Category updated success!',
      data: result,
    });
  }
);

// UPDATE EVENT CATEGORY
const deleteEventCategory = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const result =
      await categoryServices.deleteEventCategoryService(categoryId);
    SendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Category deleted success!',
      data: result,
    });
  }
);

export const categoryControllers = {
  createEventCategory,
  getEventCategory,
  updateEventCategory,
  deleteEventCategory,
};
