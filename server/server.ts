import { createServer } from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card } from "./model"
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { gitlab } from "./secrets"
import { User } from "./data"


const OPERATOR_GROUP_ID = "fight-admin"


// set up Mongo
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const client = new MongoClient(mongoUrl)
let db: Db


// set up Express
const app = express()
const server = createServer(app)
const port = parseInt(process.env.PORT) || 8228
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})
app.use(expressPinoLogger({ logger }))

// set up CORS
// app.use(cors({
//   origin: "http://127.0.0.1:" + port,
//   credentials: true,
// }))

// set up session
const sessionMiddleware = session({
  secret: 'a just so-so secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: 'mongodb://127.0.0.1:27017/fightTheLandlord',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
})
app.use(sessionMiddleware)
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

// set up Socket.IO
const io = new Server(server)

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

// hard-coded game configuration
const playerUserIds = ["jx133"]
let gameState = createEmptyGame(playerUserIds, 1, 2)

function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
    }
    console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
    io.to(String(i)).emit(
      newGame ? "all-cards" : "updated-cards", 
      updatedCardsFromPlayerPerspective,
    )
  })
}

io.on('connection', client => {
  const user = (client.request as any).session?.passport?.user
  logger.info("new socket connection for user " + JSON.stringify(user))
  if (!user) {
    client.disconnect()
    return
  }

  function emitGameState() {
    client.emit(
      "game-state", 
      playerIndex,
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  }
  
  console.log("New client")
  let playerIndex: number | "all" = playerUserIds.indexOf(user.preferred_username)
  if (playerIndex === -1) {
    playerIndex = "all"
  }
  client.join(String(playerIndex))
  
  if (typeof playerIndex === "number") {
    client.emit(
      "all-cards", 
      filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
    )
  } else {
    client.emit(
      "all-cards", 
      Object.values(gameState.cardsById),    
    )
  }
  emitGameState()

  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitUpdatedCardsForPlayers(updatedCards)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    io.emit(
      "game-state", 
      null,
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames, 1, 2)
    const updatedCards = Object.values(gameState.cardsById)
    emitUpdatedCardsForPlayers(updatedCards, true)
    io.to("all").emit(
      "all-cards", 
      updatedCards,
    )
    io.emit(
      "game-state", 
      playerIndex,
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })
})

// app routes
app.post(
  "/api/logout", 
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })
  }
)

app.get("/api/user", (req, res) => {
  res.json(req.user || {})
  //groups
  //console.log((req.user as any).groups);
})


function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  
  if (!req.isAuthenticated()) {
    res.sendStatus(401)
    return
  }

  next()
}
function checkRole(requiredRoles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {

    const roles = (req.user as any)?.roles || [];
    const hasRequiredRole = roles.some((role: string) => requiredRoles.includes(role));
    console.log("hasRequiredRole", hasRequiredRole)
    if (hasRequiredRole) {
      next(); // User has one of the required roles, proceed
    } else {
      console.log("hasRequiredRole2", hasRequiredRole)

      res.status(403).json({ message: "Access denied: Insufficient permissions" });
    }
  };
}

//specfic API for Player
app.get('/api/settings/:username', checkAuthenticated, checkRole(["Player"]), async (req, res) => {
  const username = req.params.username

  try {
    const userSettings = await db.collection('users').findOne({ username: username });
    console.log("Settings")
    console.log(userSettings)
    if (!userSettings) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(userSettings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/api/settings/:username', checkAuthenticated, checkRole(["Player"]),async (req, res) => {


  
  const username = req.params.username;
  const score = Number(req.body.score);
  const gamesPlayed = Number(req.body.gamesPlayed);
  const gamesWon = Number(req.body.gamesWon);
  const totalPlayTime = Number(req.body.totalPlayTime);



    
    const updateResult = await db.collection('users').updateOne(
      { username: username },
      {
        $set: {
          score, 
          gamesPlayed, 
          gamesWon, 
          totalPlayTime
        }
      }
    );

 
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (updateResult.modifiedCount === 0) {
      return res.status(304).send(); 
    }

    res.json({ message: 'Settings updated successfully' });
  
});

//specfic API for Admin

app.put('/api/changeRole', checkAuthenticated,async (req, res) => {


  const { newRole } = req.body;
  const user: any = req.user as any;


  if (!newRole || !["Admin", "Player"].includes(newRole)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  user.roles = [newRole];

  

  res.json(user);

  
  
});
// connect to Mongo
client.connect().then(() => {
  logger.info('connected successfully to MongoDB')
  db = client.db("fightTheLandlord")
  // operators = db.collection('operators')
  // orders = db.collection('orders')
  // customers = db.collection('customers')

  Issuer.discover("https://coursework.cs.duke.edu/").then(issuer => {
    const client = new issuer.Client(gitlab)
  
    const params = {
      scope: 'openid profile email',
      nonce: generators.nonce(),
      redirect_uri: 'http://localhost:8221/login-callback',
      state: generators.state(),
    }
  
    function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
      console.log('userInfo', userInfo)
      userInfo.roles = userInfo.groups.includes(OPERATOR_GROUP_ID) ? ["Admin"] : ["Player"]
      console.log('tokenSet', tokenSet)
      console.log('AfteruserInfo', userInfo)

      


      const username = userInfo.name
      const usersCollection = db.collection('users')

      console.log("username is ", username)



      const result = usersCollection.updateOne(
        { username: username }, 
        { 
          $setOnInsert: {
            score: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalPlayTime: 0,
          },
          $set: { lastLogin: new Date() }
        },
        { upsert: true } 
      )

      console.log("Insert successfully")
      
      return done(null, userInfo)
    }
  
    passport.use('oidc', new Strategy({ client, params }, verify))

    app.get(
      "/api/login", 
      passport.authenticate("oidc", { failureRedirect: "/api/login" }), 
      (req, res) => res.redirect("/")
      
    )
    
    app.get(
      "/login-callback",
      passport.authenticate("oidc", {
        successRedirect: "/",
        failureRedirect: "/api/login",
      })
    )    


    

    // start server
    server.listen(port)
    logger.info(`Game server listening on port ${port}`)
  })
})
