const Clarifai = require('clarifai');

const profileHandler = (req, res, db) => {
    const { id } = req.params;
    db
        .select('*')
        .from('users')
        .where({
            id
        })
        .then(user => {
            if (user.length) {
                res.send({
                    res: true,
                    body: user
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

const entryUpdateHandler = (req, res, db) => {
    const { id } = req.body;
    console.log('id: ', id);
    db('users')
        .where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.send({
                res: true,
                entryCount: entries[0]
            });
        })
        .catch(err =>
            res.status(400).send({
                res: false,
                status: 'database error'
            })
        );
};

const faceRecognitionAPI = new Clarifai.App({
    apiKey: 'f6dbeec361614947b1439e42dee8f722'
});

const imageHandler = (req, res) => {
    const { input } = req.body;
    faceRecognitionAPI.models
        .predict(Clarifai.FACE_DETECT_MODEL, input)
        .then(data => {
            res.send({
                res: true,
                data
            });
        })
        .catch(err => {
            res.status(400).send({
                res: false,
                status: 'clarifai api error'
            });
        });
};

module.exports = { profileHandler, entryUpdateHandler, imageHandler };
