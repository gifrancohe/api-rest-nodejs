const express = require('express')
const movies = require('./movies')
const crypto = require('crypto')
const tokens = require('./utils/tokens')
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

app.get('/', (req, res) => {
  return res.json({ message: 'Rest API with nodejs and express, running and ready!' })
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

app.get('/payments-api/4.0/service.payment', (req, res) => {
  const { callback, public_key, account_id, list_id, _ } = req.query;

  const jsonResponse = `${callback}([{id:11, name:'MASTERCARD'},{id:99, name:'TEST_CREDIT_CARD'},{id:44, name:'VISA'},{id:22, name:'DINERS'},{id:12, name:'AMEX'},{id:45, name:'VISA_DEBIT'},{id:34, name:'OTHERS_CASH'},{id:23, name:'CODENSA'},{id:36, name:'BANK_REFERENCED'},{id:25, name:'PSE'},{id:37, name:'EFECTY'},{id:26, name:'ACH_DEBIT'},{id:27, name:'CASH_ON_DELIVERY'},{id:733, name:'BNPL'},{id:40, name:'CMR'},{id:41, name:'MASTERPASS'},{id:43, name:'MASTERCARD_DEBIT'},{id:32, name:'LENDING_INSTALLMENTS'},])`;

  res.send(jsonResponse);
});

app.get('/payments-api/4.0/service.token', (req, res) => {
  const { callback, _card } = req.query
  const payerId = _card ? _card.payer_id : undefined
  const method = _card ? _card.method : undefined
  const token = tokens.generateUuid()

  const jsonResponse = `${callback}({
    "token": "${token}",
    "name": "APPROVED",
    "payer_id": "${payerId}",
    "method": "${method}",
    "document": "null"
  })`;

  res.send(jsonResponse);
});

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
