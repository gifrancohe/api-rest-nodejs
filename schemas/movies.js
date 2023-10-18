const z = require('zod')

const movieSchema = z.object({
  title: z.string({
    invalid_type_error: 'Title must be a string',
    required_error: 'Title is required'
  }),
  genre: z.array(
    z.enum(
      ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western']),
    {
      required_error: 'Genre is required'
    }
  ),
  year: z.number().int().positive().min(1900).max(new Date().getFullYear() + 1),
  director: z.string(),
  duration: z.number().int().positive().min(1),
  rate: z.number().min(0).max(10).default(5),
  poster: z.string().url({
    message: 'Poster must be a valid URL'
  })
})

function validateMovie (object) {
  return movieSchema.safeParse(object)
}

function validationPartialMovie (object) {
  return movieSchema.partial().safeParse(object)
}

module.exports = {
  validateMovie,
  validationPartialMovie
}
