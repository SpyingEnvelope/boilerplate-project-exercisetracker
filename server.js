const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mySecretURI = process.env['MONGO_URI'];
const Schema = mongoose.Schema;

//Body parser for post requests
app.use(bodyParser.urlencoded({extended: false}));

//Connect to Database
mongoose.connect(mySecretURI, { useNewUrlParser: true, useUnifiedTopology: true});

//Schema to store users
const userSchema = new Schema({
  'username': {
    type: String,
    required: true
  },
  'description': [String],
  'duration': [Number],
  'date': [Date]
});

const objSubSchema = new Schema({
  'description': String,
  'duration': Number,
  'date': String
})

const ExerciseUser = mongoose.model('User', userSchema);



app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users")

//Get request to get all users
app.get('/api/users', (req, res) => {
  ExerciseUser.find({}, 'username _id', (err, data) => {
    if (err) {
      console.log(err)
      res.send(err); 
    } else {
      res.send(data);
    }
  })
})

//Post for registering new user
app.post('/api/users', (req, res) => {
  console.log(req.body.username)

  const newUser = new ExerciseUser({
    'username': req.body.username,
    'description': ['ignore this'],
    'duration': [0],
    'date': [new Date()]
  }).save((err, data) => {
    if (err) {
      console.log(err)
      res.send(err)
    } else {
      res.json({'username': req.body.username, '_id': data['_id']})
    }
  })
})

//Post for adding new exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  ExerciseUser.findById(req.params['_id'], (err, user) => {
    if (err) {
      console.log('error finding user')
      console.log(err);
      res.send(err)
    } else {
      console.log('I am pushing data')
      user.description.push(req.body.description)
      user.duration.push(req.body.duration)
      if(req.body.date) {
        user.date.push(new Date(req.body.date))
      } else {
        user.date.push(new Date())
      }
      user.save((err, data) => {
        if (err) {
          console.log('error saving new information')
          console.log(err);
          res.send(err);
        } else {
          console.log('I am returning data')
          res.json({
            'username': data.username,
            'description': data.description[data.description.length - 1],
            'duration': data.duration[data.duration.length - 1],
            'date': data.date[data.date.length - 1].toDateString(),
            '_id': data['_id']
          });
        }
      })
    }
  })
})

//GET used to get logs
app.get('/api/users/:_id/logs', (req, res) => {
  //Numbers to keep track if req queries were made
  let fromCounter = 0;
  let toCounter = 0;
  let limitCounter = 0;

  if (req.query.from) {
    queryCounter = 1;
  }

  if (req.query.to) {
    toCounter = 1;
  }

  if (req.query.limit) {
    limitCounter = 1;
  }

  //console.log(Object.keys(req.query));
  ExerciseUser.findById(req.params['_id'], (err, user) => {
    if (err) {
      console.log(err)
      res.send(err)
    } else {
      let userArr = [];
      for (let i = 1; i < user.description.length; i++) {
        
        // if statment if to query date is reached
        if (toCounter == 1 && new Date(user.date[i]) > new Date(req.query.to)) {
            res.json({ 
            'username': user.username, 
            'count': userArr.length,
            '_id': user['_id'],
            'log': userArr
            });
          break;
        } 
        
        //if statement to continue if from date is closer to today than loop date
        if (fromCounter == 1 && new Date(user.date[i]) < new Date(req.query.from)) {
          continue;
        }

        //if statement if limit is reached
        if (limitCounter == 1 && userArr.length == req.query.limit) {
           res.json({ 
            'username': user.username, 
            'count': userArr.length,
            '_id': user['_id'],
            'log': userArr
            });
          break;
        }

        let pushObj = {
          'description': user.description[i],
          'duration': user.duration[i],
          'date': new Date(user.date[i]).toDateString()
        }
        userArr.push(pushObj);
        if (i == user.description.length - 1) {
          res.json({ 
            'username': user.username, 
            'count': userArr.length,
            '_id': user['_id'],
            'log': userArr
            });
        }
      }
    }
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
