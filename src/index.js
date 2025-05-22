// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, remove, set } from "firebase/database";
import { dirname } from 'path';
import view from '@fastify/view';
import pug from 'pug'
import Fastify from 'fastify';
import { randomUUID } from "crypto";
const PORT = 8080;

const webapp = Fastify({ logger: true });

webapp.register(view, {
  engine: {
    pug: pug
  },
   templates: dirname('templates')
} );

const firebaseConfig = {
  apiKey: "AIzaSyA5rz7wxoVPFd4iJOBObTUMQi0hpgsVLsU",
  authDomain: "bingo-60902.firebaseapp.com",
  projectId: "bingo-60902",
  storageBucket: "bingo-60902.firebasestorage.app",
  messagingSenderId: "535909421516",
  appId: "1:535909421516:web:8360a604a8ef4d94f58d69",
  measurementId: "G-3SL6LP087Y",
  databaseURL: "https://bingo-60902-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

function writeUserData(userId, name, email, imageUrl) {
  set(ref(database, 'users/' + userId), {
    username: name,
    email: email,
    profile_picture : imageUrl
  }); 
}

function writeNewNumber(number) {
  const numberId = randomUUID();
  set(ref(database, 'bingo-numbers/' + numberId ), {
    number: number,
    date: Date.now(),
  }); 
}

function getUsers() {
  const dbRef = ref(database);
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    console.log(data);
  });
}



writeUserData('isiqueira2', 'Italo', 'Siqueira', 'siqueira.italo@gmail.com', 'https://lh3.googleusercontent.com/a/ACg8ocIMgelIdJt3NovkckexPC4Mlg9TmFFuXPMcGyqTMOBvHAFRSpu1Ig=s288-c-no' );
getUsers();

webapp.get('/bingo', async (request, reply) => {
  const dbRef = ref(database);
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    return reply.send(data);
  }); 
});

webapp.post('/bingo/clear-game', async (request, reply) => {
  remove(ref(database, 'users')).then(() => {
    console.log('Users removed successfully');
  }).catch((error) => {
    console.error('Error removing users:', error);
  });
});

webapp.post('/bingo', async (request, reply) => {
  const dbRef = ref(database);
  writeNewNumber(request.body.number);
});

webapp.post('/users', async (request, reply) => {
  writeUserData(request.body.id, request.body.name, request.body.email, request.body.imageUrl );
});

webapp.get('/', async (request, reply) => {
  reply.view('/index.pug', { title: 'Pug Example', message: 'Hello, Pug!' });
});

webapp.get('/insere-numero', async (request, reply) => {
  reply.view('/novo-numero.pug', { title: 'Pug Example', message: 'Hello, Pug!' });
});

const address = await webapp.listen({ port: PORT });

console.log(`Server is running on ${address}`);