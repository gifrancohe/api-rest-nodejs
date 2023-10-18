const express = require('express')
const movies = require('./movies')
const crypto = require('crypto')
const { validateMovie, validationPartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')
app.use(express.json())

const ACCEPTED_ORIGINS = ['http://localhost:1234']

app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || origin === 'null') {
    res.header('Access-Control-Allow-Origin', '*')
  }
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))

    if (!filteredMovies.length) res.status(404).json({ message: `Movie not found by genre: ${genre}` })
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (!movie) res.status(404).json({ message: 'Movie not found' })
  res.json(movie)
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(422).json({ error: result.error }) // 400 Bad Request
  }

  const newMovie = {
    id: crypto.randomBytes(20).toString('hex'),
    ...result.data
  }
  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const index = movies.findIndex(movie => movie.id === id)
  if (index === -1) res.status(404).json({ message: 'Movie not found' })

  const result = validationPartialMovie(req.body)

  const updateMovie = {
    ...movies[index],
    ...result.data
  }
  console.log(updateMovie)

  movies[index] = updateMovie
  res.status(200).json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || origin === 'null') {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.send(200)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
