const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next(err);
  }
};

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const listingSchema = z.object({
  category: z.enum(['Lost', 'Found', 'Adoption']),
  title: z.string().min(3, "Title must be at least 3 characters"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  age: z.string().optional(),
  color: z.string().optional(),
  size: z.enum(['Small', 'Medium', 'Large', 'Unknown']).optional().default('Unknown'),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  contactInfo: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Resolved', 'Adopted']).optional().default('Active'),
});

const messageSchema = z.object({
  receiver: z.string(), // Object ID
  listing: z.string(), // Object ID
  content: z.string().min(1, "Message content cannot be empty"),
});

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  listingSchema,
  messageSchema,
  profileSchema
};
