import { createServer } from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card,distributeInitialCards } from "./model"
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
import { Strategy as CustomStrategy } from "passport-custom"
import cors from "cors"
//new added on 4/16
const HOST = process.env.HOST || "localhost"

const DISABLE_SECURITY = process.env.DISABLE_SECURITY


const passportStrategies = [
  ...(DISABLE_SECURITY ? ["disable-security"] : []),
  "oidc",
]

const ADMIN_GROUP_ID = "fight-admin"

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
app.use(cors({
  origin: "http://127.0.0.1:" + port,
  credentials: true,
}))

// set up session
const sessionMiddleware = session({
  secret: 'a just so-so secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: mongoUrl,
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
passport.deserializeUser((user: any, done) => {
  console.log("deserializeUser", user)
  done(null, user)
})

app.get(
  "/api/login", 
  passport.authenticate(passportStrategies, { failureRedirect: "/api/login" }), 
  (req, res) => res.redirect("/")

  
)

app.get(
  "/api/login-callback",
  passport.authenticate(passportStrategies, {
    successRedirect: "/",
    failureRedirect: "/api/login",
  })
)    

// set up Socket.IO
const io = new Server(server)

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

// hard-coded game configuration
const playerUserIds = ["steve","ks713","qingli"]
var rolelist=["Landlord","Peasant","Peasant"]
let gameState = createEmptyGame(playerUserIds, 1, 13)
var sender=""
var chatinput=""
var receiver=""
var paramlistMy:String[][]=[[]]
function checkGameisOver(lastplayedcards:Card[]){
  var gameisOver:Boolean =false
  var playcount:number[]=[]
  playcount.push(0)
  playcount.push(0)
  playcount.push(0)
 for(var i=0;i<lastplayedcards.length;i++){
  var thiscard=lastplayedcards[i]
  if(thiscard.playerIndex==0){
    playcount[0]+=1
  }else if(thiscard.playerIndex==1){
    playcount[1]+=1
  }else if(thiscard.playerIndex==2){
    playcount[2]+=1
  }
  if(playcount[0]==1||playcount[1]==1||playcount[2]==1){
    gameisOver=true
    break
  }
 }
 console.log(playcount)
 console.log("game is over?????"+gameisOver)
 return gameisOver
}
function determineWinner(lastplayedcards:Card[]){
  var winnerindex=0
  var playcount:number[]=[]
  playcount.push(0)
  playcount.push(0)
  playcount.push(0)
  for(var i=0;i<lastplayedcards.length;i++){
    var thiscard=lastplayedcards[i]
    if(thiscard.playerIndex==0){
      playcount[0]+=1
    }else if(thiscard.playerIndex==1){
      playcount[1]+=1
    }else if(thiscard.playerIndex==2){
      playcount[2]+=1
    }
    if(playcount[0]==1||playcount[1]==1||playcount[2]==1){
      if(playcount[0]==1){
          winnerindex=0
      }else if(playcount[1]==1){
          winnerindex=1
      }else if(playcount[2]==1){
          winnerindex=2
      }
      break
    }
   }
   return winnerindex
}
function emitCardUpdates(cards: Card[], newGame = false, toAll = true) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i);
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused");
    }
    if (toAll) {
      io.to(String(i)).emit(newGame ? "all-cards" : "updated-cards", updatedCardsFromPlayerPerspective);
    } else if (i === gameState.currentTurnPlayerIndex) {
      io.to(String(i)).emit(newGame ? "all-cards" : "updated-cards", updatedCardsFromPlayerPerspective);
    }
  });

  if (newGame) {
    gameState.phase = "play";
    emitAllGameState();  
  }
}

let allPlayersConnected = false;
function checkAllPlayersConnected() {
  
  if (gameState.connectedPlayers.size === gameState.playerNames.length) {
    allPlayersConnected = true
    distributeInitialCards(gameState,14);
    emitCardUpdates(Object.values(gameState.cardsById), true, true);

  }
  collectAndSendOpponentInfo();
}


function collectAndSendOpponentInfo() {
  gameState.playerNames.forEach((_, index) => {
    const opponentInfo = gameState.playerNames.map((name, idx) => {
      if (idx !== index) { 
        const cardCount = Object.values(gameState.cardsById).filter(card => 
          card.playerIndex === idx && card.locationType === "player-hand").length;
        return { name, cardCount };
      }
    }).filter(info => info); 

    io.to(String(index)).emit("opponent-info", opponentInfo);
  });
}

function emitAllGameState() {
  io.emit( 
    "game-state", 
    null,
    gameState.currentTurnPlayerIndex,
    gameState.phase,
    gameState.playCount,
    gameState.lastPlayedCards,
    checkGameisOver(gameState.lastPlayedCards),
      determineWinner(gameState.lastPlayedCards)
  );
}
setInterval(() => {
  if (checkGameisOver(gameState.lastPlayedCards)) {
    // Assuming playernames is an array of player names
    playerUserIds.forEach(pname => {
      const usecollection = db.collection("users");

      // Find the user with the given preferred username
      usecollection.findOne({ preferred_username: pname }, function(err, user) {
        if (err) {
          console.error('Error finding user:', err);
          return;
        }

        if (!user) {
          console.error('User not found');
          return;
        }

        // Increment each field by 1
        user.gamesPlayed += 1;
        user.gamesWon += 1
        user.score += 1;

        // Update the user in the database
        usecollection.updateOne({ _id: user._id }, { $set: { score: user.score, gamesPlayed: user.gamesPlayed, gamesWon: user.gamesWon } }, function(err, result) {
          if (err) {
            console.error('Error updating user:', err);
            return;
          }

          console.log('User updated successfully');
        });
      });
    });

    // Reset gameState
    gameState = createEmptyGame(playerUserIds, 1, 13);
  }
}, 1500);


io.on('connection', client => {
  const user = (client.request as any).session?.passport?.user
  logger.info("new socket connection for user " + JSON.stringify(user))
  if (!user) {
    client.disconnect()
    return
  }

  function emitGameState() {
    console.log("XBBBBBBBBBBBBBBBBBBBBBBB")
    console.log(gameState.lastPlayedCards)
    client.emit(
      "game-state", 
      playerIndex,
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
      gameState.lastPlayedCards,
      checkGameisOver(gameState.lastPlayedCards),
      determineWinner(gameState.lastPlayedCards)
    )
  }

  client.on("clientchat",paramlist=>{
    sender=paramlist[0]
    chatinput=paramlist[1]
    receiver=paramlist[2]
    var plist=[sender,chatinput,receiver]
    paramlistMy.push(plist)
    console.log("Paaaa")
    console.log(paramlistMy)
    client.emit("allchat",paramlistMy)
  })
  client.on("getallchat",()=>{
    console.log("Try to get all chat")
    client.emit("allchat",paramlistMy)
  })

  
  console.log("New client")
  let playerIndex: number | "all" = playerUserIds.indexOf(user.preferred_username)
  if (playerIndex === -1) {
    playerIndex = "all"
  }

  console.log("playerIndex set", playerIndex)
  console.log(gameState.connectedPlayers)
  console.log(gameState.connectedPlayers.has(playerIndex as any))
  
  client.join(String(playerIndex))
  const alreadyDistributed=gameState.connectedPlayers.has(playerIndex as any)
  if(!(gameState.connectedPlayers.has(playerIndex as any))){
    gameState.connectedPlayers.add(playerIndex as any); 
  }
  
  if (typeof playerIndex === "number") {
    console.log("IN HRER")
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
  if(!alreadyDistributed||gameState.connectedPlayers.size < gameState.playerNames.length){
    checkAllPlayersConnected()
  }
  emitGameState()

  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitCardUpdates(updatedCards,false,true)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    console.log("XBBBBBBBBBBBBBBBBBBBBBBB")
    console.log(gameState.lastPlayedCards)
    io.emit(
      "game-state", 
      null,
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
      gameState.lastPlayedCards,
      checkGameisOver(gameState.lastPlayedCards),
      determineWinner(gameState.lastPlayedCards)
    )
    collectAndSendOpponentInfo();
  })

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames, 1, 2)
    const updatedCards = Object.values(gameState.cardsById)
    emitCardUpdates(updatedCards,true,true)
    io.to("all").emit(
      "all-cards", 
      updatedCards,
    )
    console.log("XBBBBBBBBBBBBBBBBBBBBBBB")
    console.log(gameState.lastPlayedCards)
    io.emit(
      "game-state", 
      playerIndex,
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
      gameState.lastPlayedCards,
      checkGameisOver(gameState.lastPlayedCards),
      determineWinner(gameState.lastPlayedCards)
    )
    collectAndSendOpponentInfo();
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
app.get('/api/settings/:preferred_username', checkAuthenticated, checkRole(["Player"]), async (req, res) => {
  const preferred_username = req.params.preferred_username

  try {
    const userSettings = await db.collection('users').findOne({ preferred_username: preferred_username });
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


app.put('/api/settings/:preferred_username', checkAuthenticated, checkRole(["Player"]),async (req, res) => {


  
  const preferred_username = req.params.preferred_username;
  const score = Number(req.body.score);
  const gamesPlayed = Number(req.body.gamesPlayed);
  const gamesWon = Number(req.body.gamesWon);
  const totalPlayTime = Number(req.body.totalPlayTime);
  const personalInformation = req.body.personalInformation



    
    const updateResult = await db.collection('users').updateOne(
      { preferred_username: preferred_username },
      {
        $set: {
          score, 
          gamesPlayed, 
          gamesWon, 
          totalPlayTime,
          personalInformation,
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


app.get('/api/statistics/users', checkAuthenticated, checkRole(['Admin']), async (req, res) => {
  
  try {
    const users = await db.collection('users').find({}).toArray();
    console.log("STA USER")
    console.log(users)
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/user/:preferred_username/clear', checkAuthenticated, checkRole(['Admin']), async (req, res) => {
  const { preferred_username } = req.params;

  try {
    const updateResult = await db.collection('users').updateOne(
      { preferred_username: preferred_username },
      {
        $set: {
          gamesPlayed: 0,
          gamesWon: 0,
          score: 0,
          totalPlayTime: 0,
          personalInformation:""

        }
      }
    );

    if (updateResult.matchedCount === 0) {
     
      return res.status(404).json({ message: 'User not found' });
    }

    if (updateResult.modifiedCount === 0) {
      
      return res.status(200).json({ message: 'User data was already reset' });
    }


    res.json({ message: `User ${preferred_username}'s data reset successfully` });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// connect to Mongo
client.connect().then(async () => {
  logger.info('connected successfully to MongoDB')
  db = client.db("fightTheLandlord")


  passport.use("disable-security", new CustomStrategy((req, done) => {
    if (req.query.key !== DISABLE_SECURITY) {
      console.log("you must supply ?key=" + DISABLE_SECURITY + " to log in via DISABLE_SECURITY")
      done(null, false)
    } else {
      const db_preferred_username = req.query.user as string
      const usersCollection = db.collection('users')
      const result = usersCollection.updateOne(
        { preferred_username:  db_preferred_username }, 
        { 
          $setOnInsert: {
            score: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalPlayTime: 0,
            personalInformation:""
          },
          $set: { lastLogin: new Date() }
        },
        { upsert: true } 
      )

      console.log("Insert successfully")
      done(null, { preferred_username: req.query.user, roles: [].concat(req.query.role) })
    }
    
    
  }))
  
  {
    const issuer = await Issuer.discover("https://coursework.cs.duke.edu/")
    const client = new issuer.Client(gitlab)

    
    const params = {
      scope: 'openid profile email',
      nonce: generators.nonce(),
      //redirect_uri: `http://${HOST}:8221/api/login-callback`,
      redirect_uri: `http://${HOST}:31000/api/login-callback`,
      state: generators.state(),
    }
    
    function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
      console.log('userInfo', userInfo)
      console.log('tokenSet', tokenSet)
      userInfo.roles = userInfo.groups.includes(ADMIN_GROUP_ID) ? ["Admin"] : ["Player"]
      const db_preferred_username = userInfo.preferred_username
      const usersCollection = db.collection('users')



      const result = usersCollection.updateOne(
        { preferred_username:  db_preferred_username }, 
        { 
          $setOnInsert: {
            score: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalPlayTime: 0,
            personalInformation:""
          },
          $set: { lastLogin: new Date() }
        },
        { upsert: true } 
      )

      console.log("Insert successfully")
      return done(null, userInfo)
    }

    
    passport.use('oidc', new Strategy({ client, params }, verify))

  

  }
  
  




    
    
    // start server
    server.listen(port)
    logger.info(`Game server listening on port ${port}`)
  })

