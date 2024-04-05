import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import session from 'express-session'
// import MongoStore from 'connect-mongo'
import cors from 'cors'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { gitlab } from "./secrets"

// set up Express
const app = express()
const port = parseInt(process.env.PORT) || 8220

// set up body parsing for both JSON and URL encoded
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({ transport: { target: 'pino-pretty' }})
app.use(expressPinoLogger({ logger }))

// set up CORS
app.use(cors({
  origin: "http://127.0.0.1:8220",
  credentials: true,
}))

// set up session
app.use(session({
  secret: 'a just so-so secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  // the default store is memory-backed, so all sessions will be forgotten every time the server restarts
  // uncomment the following to use a Mongo-backed store that will work with a load balancer
  // store: MongoStore.create({
  //   mongoUrl: 'mongodb://127.0.0.1:27017',
  //   ttl: 14 * 24 * 60 * 60 // 14 days
  // })
}))
declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => {
  console.log("serializeUser", user)
  done(null, user)
})
passport.deserializeUser((user, done) => {
  console.log("deserializeUser", user)
  done(null, user)
})

Issuer.discover("https://coursework.cs.duke.edu/").then(issuer => {
  const client = new issuer.Client(gitlab)

  const params = {
    scope: 'openid profile email',
    nonce: generators.nonce(),
    redirect_uri: 'http://127.0.0.1:8220/login-callback',
    state: generators.state(),
  }

  function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
    console.log('userInfo', userInfo)
    console.log('tokenSet', tokenSet)
    return done(null, userInfo)
  }

  passport.use('oidc', new Strategy({ client, params }, verify))

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
})

app.get('/login', passport.authenticate('oidc', {
  successReturnToOrRedirect: "/"
}))

app.get('/login-callback', passport.authenticate('oidc', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/',
}))

app.get(
  "/",
  (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send(`
Please <a href="/login">log in</a> first.
      `)
      return
    }

    console.log("/", req.user)
    const name = (req?.user as any)?.preferred_username || "unknown"

    res.status(200).send(`
<h1>Hello, ${name}</h1>
You have ${req.session?.credits || 'no credits'}.
<form method="POST" action="/logout"><input type="submit" value="Logout"></form>
<form method="POST" action="/add-credit">
<input name="amount" value="1">
<input type="submit" value="Add Credit via POST">
</form>
<form method="GET" action="/add-credit">
<input name="amount" value="1">
<input type="submit" value="Add Credit via GET">
</form>
<button onclick="addCreditViaFetch()">Add 100 credits via fetch POST</button>
<script>
function addCreditViaFetch() {
  fetch(
    "/add-credit", 
    { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 100 }),
    }
  ).then(() => alert('done - refresh page to see result'))
}
</script>
    `)
  }
)

function addCredit(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    res.status(403).send("log in first")
    return
  }

  // NOTE: the following line is a bad idea!
  // for GET, the parameters come in via the query parameter
  // for POST, the parameters come in via the body
  const amount = parseInt(req.body.amount || req.query.amount) || 1

  // the following line is the "right" thing to do
  // const amount = parseInt(req.body.amount) || 1
  
  req.session.credits = (req.session.credits || 0) + amount
  res.redirect("/")
}

app.post("/add-credit", addCredit)

// NOTE: the following line is a bad idea!
app.get("/add-credit", addCredit)

app.post(
  "/logout", 
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })
  }
)