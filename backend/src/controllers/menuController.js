import mongoose from 'mongoose';
import { MenuItem, MENU_CATEGORIES } from '../models/MenuItem.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getMenuItems = asyncHandler(async (req, res) => {
  const { category, search, available } = req.query;
  const filter = {};

  if (typeof category === 'string' && category.trim() && category !== 'All') {
    filter.category = category.trim();
  }

  if (available === 'true') {
    filter.isAvailable = true;
  } else if (available === 'false') {
    filter.isAvailable = false;
  }

  if (typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });

  res.status(200).json({
    success: true,
    count: items.length,
    categories: MENU_CATEGORIES,
    items,
  });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const { name, category, price, description = '', isAvailable = true } = req.body || {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    throw new AppError('Menu item name must be at least 2 characters.', 400);
  }
  if (!MENU_CATEGORIES.includes(category)) {
    throw new AppError(`Category must be one of: ${MENU_CATEGORIES.join(', ')}.`, 400);
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw new AppError('Price must be a valid non-negative number.', 400);
  }

  const item = await MenuItem.create({
    name: name.trim(),
    category,
    price: Math.round((numericPrice + Number.EPSILON) * 100) / 100,
    description: typeof description === 'string' ? description.trim() : '',
    isAvailable: Boolean(isAvailable),
  });

  res.status(201).json({ success: true, item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid menu item ID.', 400);
  }

  const existing = await MenuItem.findById(id);
  if (!existing) {
    throw new AppError('Menu item not found.', 404);
  }

  const { name, category, price, description, isAvailable } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Menu item name must be at least 2 characters.', 400);
    }
    existing.name = name.trim();
  }

  if (category !== undefined) {
    if (!MENU_CATEGORIES.includes(category)) {
      throw new AppError(`Category must be one of: ${MENU_CATEGORIES.join(', ')}.`, 400);
    }
    existing.category = category;
  }

  if (price !== undefined) {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      throw new AppError('Price must be a valid non-negative number.', 400);
    }
    existing.price = Math.round((numericPrice + Number.EPSILON) * 100) / 100;
  }

  if (description !== undefined) {
    existing.description = typeof description === 'string' ? description.trim() : '';
  }

  if (isAvailable !== undefined) {
    if (typeof isAvailable !== 'boolean') {
      throw new AppError('isAvailable must be a boolean.', 400);
    }
    existing.isAvailable = isAvailable;
  }

  await existing.save();
  res.status(200).json({ success: true, item: existing });
});

export const toggleMenuItemStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid menu item ID.', 400);
  }

  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found.', 404);
  }

  item.isAvailable =
    typeof req.body?.isAvailable === 'boolean' ? req.body.isAvailable : !item.isAvailable;

  await item.save();
  res.status(200).json({ success: true, item });
});
