import Fastify from 'fastify';
import { faker } from '@faker-js/faker';
import { set, remove, ref, onValue } from 'firebase/database';
const mod = require('./index.js');

// Mock dependencies
jest.mock('firebase/database', () => ({
    set: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    ref: jest.fn(),
    onValue: jest.fn(),
}));
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
}));
jest.mock('@fastify/view', () => jest.fn());
jest.mock('pug', () => ({}));
jest.mock('dotenv/config', () => {});

describe('Bingo Server', () => {
    let writeUserData, writeNewNumber;

    beforeEach(() => {
        jest.clearAllMocks();
        // Re-import to get fresh functions with mocks
        jest.isolateModules(() => {
            writeUserData = mod.writeUserData;
            writeNewNumber = mod.writeNewNumber;
        });
    });

    test('writeUserData calls set with correct params', () => {
        const userId = 'abc';
        const name = faker.person.fullName();
        const email = faker.internet.email();
        const imageUrl = faker.image.avatar();
        writeUserData(userId, name, email, imageUrl);
        expect(set).toHaveBeenCalledWith(
            expect.anything(),
            {
                username: name,
                email: email,
                profile_picture: imageUrl,
            }
        );
    });

    test('writeNewNumber calls set with correct params', () => {
        const number = 42;
        writeNewNumber(number);
        expect(set).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                number: number,
                date: expect.any(Number),
            })
        );
    });

    test('POST /bingo/clear-game calls remove', async () => {
        const fastify = Fastify();
        fastify.post('/bingo/clear-game', async (request, reply) => {
            await remove(ref({}, 'users'));
            reply.send({ ok: true });
        });
        const response = await fastify.inject({
            method: 'POST',
            url: '/bingo/clear-game',
        });
        expect(remove).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
    });

    test('POST /bingo calls writeNewNumber', async () => {
        const fastify = Fastify();
        fastify.post('/bingo', async (request, reply) => {
            writeNewNumber(request.body.number);
            reply.send({ ok: true });
        });
        const response = await fastify.inject({
            method: 'POST',
            url: '/bingo',
            payload: { number: 7 },
        });
        expect(set).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
    });

    test('POST /users calls writeUserData', async () => {
        const fastify = Fastify();
        fastify.post('/users', async (request, reply) => {
            writeUserData(request.body.id, request.body.name, request.body.email, request.body.imageUrl);
            reply.send({ ok: true });
        });
        const payload = { id: '1', name: 'A', email: 'a@b.com', imageUrl: 'img' };
        const response = await fastify.inject({
            method: 'POST',
            url: '/users',
            payload,
        });
        expect(set).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
    });
});
