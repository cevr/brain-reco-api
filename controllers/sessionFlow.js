const registerHandler = (req, res, db, bcrypt) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send({
            res: false,
            status: 'incorrect form'
        });
    }
    const hash = bcrypt.hashSync(password);
    db
        .transaction(trx => {
            trx
                .insert({
                    hash,
                    email
                })
                .into('login')
                .returning('email')
                .then(loginEmail => {
                    return trx('users')
                        .returning('*')
                        .insert({
                            username,
                            email: loginEmail[0],
                            joined: new Date()
                        })
                        .then(user => {
                            return res.status(200).send({
                                res: true,
                                body: user[0]
                            });
                        });
                })
                .then(trx.commit)
                .catch(trx.rollback);
        })

        .catch(err =>
            res.status(400).send({
                res: false,
                status: 'Username or email already exists!'
            })
        );
};

const loginHandler = (req, res, db, bcrypt) => {
    const { password, email } = req.body;
    if (!email || !password) {
        return res.status(400).send({
            res: false,
            status: 'incorrect form'
        });
    }
    db
        .transaction(trx => {
            trx('login')
                .where('email', '=', email)
                .update('session', req.session.id)
                .returning('*')
                .then(data => {
                    console.log(data);
                    const isValid = bcrypt.compareSync(password, data[0].hash);
                    if (isValid) {
                        return db
                            .select('*')
                            .from('users')
                            .where('email', '=', email)
                            .then(user => {
                                const { id, username, entries } = user[0];
                                res.status(200).send({
                                    res: true,
                                    id,
                                    name: username,
                                    entryCount: entries
                                });
                            });
                    } else {
                        res.send({
                            res: false,
                            status: 'Invalid password'
                        });
                    }
                })
                .then(trx.commit)
                .catch(trx.rollback);
        })
        .catch(err => {
            console.log(err);
            res.send({
                res: false,
                status: 'Invalid email'
            });
        });
};

const logoutHandler = (req, res, db) => {
    const { id } = req.body;
    db
        .select('*')
        .from('login')
        .where({ id })
        .update('session', null)
        .returning('*')
        .then(user => {
            console.log('LOGOUT', user);
            if (user.length) {
                res.status(200).send({ res: true });
            } else {
                res.status(404).send({
                    res: false,
                    status: 'user not found'
                });
            }
        })
        .catch(err => {
            res.status(400).send({
                res: false,
                status: 'database error'
            });
        });
};

const sessionCheckHandler = (req, res, db) => {
    const session = req.session.id;
    db('users')
        .join('login', 'users.email', '=', 'login.email')
        .select('*')
        .where({
            session
        })
        .then(user => {
            if (user.length) {
                const { id, username, entries } = user[0];
                console.log('entries: ', entries);
                console.log('username: ', username);
                res.status(200).send({
                    res: true,
                    id,
                    name: username,
                    entryCount: entries
                });
            } else {
                res.status(404).send({
                    res: false,
                    status: 'not found'
                });
            }
        })
        .catch(err =>
            res.status(400).send({
                res: false,
                status: 'database error'
            })
        );
};

module.exports = {
    registerHandler,
    loginHandler,
    logoutHandler,
    sessionCheckHandler
};
