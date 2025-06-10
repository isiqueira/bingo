import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, remove, set } from "firebase/database";
import { dirname } from 'path';
import view from '@fastify/view';
import pug from 'pug'
import Fastify from 'fastify';
import { randomUUID } from "crypto";
import 'dotenv/config';

const PORT = process.env.PORT || 3000;
const webapp = Fastify({ logger: true });

webapp.register(view, {
  engine: {
    pug: pug
  },
   templates: dirname('templates')
} );

console.log('Starting server...');

/**
 * Firebase configuration object containing keys and identifiers for connecting to a Firebase project.
 * All values are sourced from environment variables for security.
 * 
 * @type {Object}
 * @property {string} apiKey - Firebase API key.
 * @property {string} authDomain - Firebase Auth domain.
 * @property {string} projectId - Firebase project ID.
 * @property {string} storageBucket - Firebase storage bucket name.
 * @property {string} messagingSenderId - Firebase Cloud Messaging sender ID.
 * @property {string} appId - Firebase app ID.
 * @property {string} measurementId - Firebase Analytics measurement ID.
 * @property {string} databaseURL - Firebase Realtime Database URL.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
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
