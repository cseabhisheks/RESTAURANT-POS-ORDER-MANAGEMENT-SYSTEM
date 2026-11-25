import mongoose from 'mongoose';

export const MENU_CATEGORIES = [
  'Starters',
  'Mains',
  'Sides',
  'Beverages',
  'Desserts',
];

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: MENU_CATEGORIES,
        message: `Category must be one of: ${MENU_CATEGORIES.join(', ')}`,
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });

export const MenuItem =
  mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
