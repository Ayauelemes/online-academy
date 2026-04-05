const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../index.js'); 

describe('Online Academy API Tests', () => {

    describe('POST /api/login', () => {
        it('✅Студент логины сәтті қайтарылды!', (done) => {
            request(app)
                .post('/api/login')
                .send({ email: 'dana@mail.ru', password: 'dana123' })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('token');
                    done();
                });
        });
    });
    describe('GET /api/courses', () => {
        it('✅Барлық курстар тізімі алынды', (done) => {
            request(app)
                .get('/api/courses')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('array');
                    done();
                });
        });
    });
    describe('POST /api/register', () => {
        it('✅Жаңа пайдаланушы сәтті тіркелді', (done) => {
            const tempEmail = `user_${Date.now()}@test.com`; 
            request(app)
                .post('/api/register')
                .send({ email: tempEmail, password: 'password123' })
                .expect(201)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('token');
                    done();
                });
        });

        it('Email толтырылмаса 400 қайтарылады', (done) => {
            request(app)
                .post('/api/register')
                .send({ password: '123' })
                .expect(400)
                .end(done);
        });
    });

    describe('Security Tests', () => {
        it('Токенсіз тапсырма жіберу мүмкін болмауы керек (401)', (done) => {
            request(app)
                .post('/api/submit-task')
                .send({ homework_url: 'https://github.com' })
                .expect(401)
                .end(done);
        });

        it('Қате токенмен кіруге болмайды (403/401)', (done) => {
            request(app)
                .get('/api/teacher/homework')
                .set('Authorization', 'Bearer fake_token')
                .expect(401)
                .end(done);
        });
    });

    describe('Teacher Panel', () => {
        let teacherToken;
        before((done) => {
            request(app)
                .post('/api/login')
                .send({ email: 'teacher@mail.ru', password: 'teacher123' })
                .end((err, res) => {
                    teacherToken = res.body.token;
                    done();
                });
        });

        it('Мұғалім барлық тапсырмаларды көре алады', (done) => {
            request(app)
                .get('/api/teacher/homework')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('array');
                    done();
                });
        });
    });

    describe('POST /api/payment', () => {
        let studentToken;
        before((done) => {
            request(app)
                .post('/api/login')
                .send({ email: 'dana@mail.ru', password: 'dana123' })
                .end((err, res) => {
                    studentToken = res.body.token;
                    done();
                });
        });

        it('✅Төлем сәтті қабылданды', (done) => {
            request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ amount: 5000, month_name: 'Мамыр' })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('id');
                    done();
                });
        });
    });
});