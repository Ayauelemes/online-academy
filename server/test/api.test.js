const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../index.js'); 

describe('Online Academy API Tests', () => {

    // --- ТІРКЕЛУ ТЕСТТЕРІ ---
    describe('POST /api/register', () => {
        it('✅ Жаңа пайдаланушы сәтті тіркелді', (done) => {
            const tempEmail = `testuser_${Date.now()}@mail.ru`; 
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

        it('❌ Email толтырылмаса 400 қайтарылады', (done) => {
            request(app)
                .post('/api/register')
                .send({ password: '123' })
                .expect(400)
                .end(done);
        });
    });

    // --- КІРУ (LOGIN) ТЕСТТЕРІ ---
    describe('POST /api/login', () => {
        const userCredentials = { email: `login_${Date.now()}@mail.ru`, password: '123' };

        before((done) => {
            // Тест үшін алдымен қолданушыны тіркеу
            request(app).post('/api/register').send(userCredentials).end(done);
        });

        it('✅ Студент логины сәтті қайтарылды!', (done) => {
            request(app)
                .post('/api/login')
                .send(userCredentials)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('token');
                    done();
                });
        });
    });

    // --- ҚАУІПСІЗДІК ТЕСТТЕРІ ---
    describe('Security Tests', () => {
        it('❌ Токенсіз тапсырма жіберу мүмкін емес (401)', (done) => {
            request(app)
                .post('/api/submit-task')
                .send({ homework_url: 'https://github.com' })
                .expect(401)
                .end(done);
        });

        it('❌ Қате токенмен кіруге болмайды (401)', (done) => {
            request(app)
                .get('/api/teacher/homework')
                .set('Authorization', 'Bearer fake_token')
                .expect(401)
                .end(done);
        });
    });

    // --- МҰҒАЛІМ ПАНЕЛІ (TEACHER ROLE) ---
    describe('Teacher Panel', () => {
        let teacherToken;
        const teacherAcc = { email: 'teacher@mail.ru', password: 'teacher123' };

        before((done) => {
            // 1. Мұғалімді тіркеу
            request(app).post('/api/register').send(teacherAcc).end(() => {
                // 2. Логин жасап, токен алу
                request(app).post('/api/login').send(teacherAcc).end((err, res) => {
                    teacherToken = res.body.token;
                    done();
                });
            });
        });

        it('✅ Мұғалім барлық тапсырмаларды көре алады', (done) => {
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

    // --- ТӨЛЕМ ЖАСАУ (PAYMENT) ---
    describe('POST /api/payment', () => {
        let studentToken;

        before((done) => {
            const studentAcc = { email: `pay_test_${Date.now()}@mail.ru`, password: '123' };
            request(app).post('/api/register').send(studentAcc).end((err, res) => {
                studentToken = res.body.token;
                done();
            });
        });

        it('✅ Төлем сәтті қабылданды', (done) => {
            request(app)
                .post('/api/payment')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ amount: 5000, month_name: 'Сәуір' })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('id');
                    done();
                });
        });
    });
});