import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import Category from './category.model';

// CREATE EVENT CATEGORY
const createEventCategoryService = async (payload: {
  category_name: string;
  category_icon: string;
}) => {
  if (!payload.category_name) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category name must required!');
  }

  if (!payload.category_icon) {
    payload.category_icon = '🎉';
  }

  // Check Already exist
  const category = await Category.findOne({
    category_name: payload.category_name.trim(),
  });
  if (category) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `${category.category_name} - already exist!`
    );
  }

  // Remove if after before white-space
  payload.category_name = payload.category_name.trim();
  payload.category_icon = payload.category_icon.trim();

  // Create Category
  const categoryCreate = await Category.create(payload);
  return categoryCreate;
};

// GET EVENT CATEGORY
const getEventCategoryService = async (isDeleted: boolean) =>
  await Category.find({ isDeleted });

// UPDATE EVENT CATEGORY
const updateEventCategoryService = async (
  categoryId: string,
  payload: { category_name: string; category_icon: string }
) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found!');
  }

  // Update Category
  const updateCategory = await Category.findByIdAndUpdate(categoryId, payload, {
    runValidators: true,
    new: true,
  });
  return updateCategory;
};

// DELETE EVENT CATEGORY
const deleteEventCategoryService = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found!');
  }

  if (category.isDeleted) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This category is already deleted!'
    );
  }

  // Update Category
  const deleteCategory = await Category.findByIdAndUpdate(
    categoryId,
    { isDeleted: true },
    { runValidators: true, new: true }
  );

  return deleteCategory;
};

export const categoryServices = {
  createEventCategoryService,
  getEventCategoryService,
  updateEventCategoryService,
  deleteEventCategoryService,
};
