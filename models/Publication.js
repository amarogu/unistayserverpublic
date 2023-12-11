const mongoose = require('mongoose');
const OpenAi = require('openai').OpenAI;
require('dotenv').config();
const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const publicationSchema = new mongoose.Schema({
    title: {
        original: {
            type: String,
            required: true,
            minlength: 5,
            maxlength: 100
        },
        en: {
            type: String,
            default: '',
            maxlength: 100
        },
        pt: {
            type: String,
            default: '',
            maxlength: 100
        },
        fr: {
            type: String,
            default: '',
            maxlength: 100
        }
    },
    description: {
        original: {
            type: String,
            
            maxlength: 500
        },
        pt: {
            type: String,
            default: '',
            maxlength: 500
        },
        fr: {
            type: String,
            default: '',
            maxlength: 500
        },
        en: {
            type: String,
            default: '',
            maxlength: 500
        }
    },
    rent: {
        type: Number,
        required: true,
        min: 100,
        max: 100000
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        enum: [
            'USD',
            'EUR',
            'JPY',
            'GBP',
            'CAD',
            'AUD',
            'CHF',
            'CNY',
            'SEK',
            'NZD',
            'MXN',
            'SGD',
            'HKD',
            'NOK',
            'KRW',
            'BRL',
            'INR',
            'RUB',
            'ZAR',
            'TRY',
            'PLN',
            'PHP',
            'MYR',
            'IDR',
            'THB',
            'ARS',
        ]
    },
    type: {
        type: String,
        required: true,
        enum: ['On-campus', 'Off-campus', 'Homestay']
    },
    boosted: Boolean,
    postLanguage: {
        type: String,
        required: true,
        default: 'en'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // reference only the users that are publishers
        ref: 'User',
    },
    visibility: {
        type: String,
        required: true,
        enum: ['Visible', 'Invisible']
    },
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }],
    location: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    connectedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    requests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    acceptedRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
});

publicationSchema.post('save', async function(doc, next) {
    if (doc.title.en == "") {
        if (doc.description.en == "") {
            // Do something after the document is saved
            const languages = ['English', 'Portuguese', 'French'];
            const completions = [];

            for (let i = 0; i < languages.length; i++) {
                const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: `You will translate the text in whatever original language it is to ${languages[i]}. If the text you receive is already in the requested translation language, simply return it to the user with no change.` },
                    { role: "user", content: doc.description.original }
                ],
                model: "gpt-4-1106-preview",
                });

                completions.push(completion.choices[0]);
            }

            // Assuming you have the translated descriptions in an array called `translations`
            const filter = { _id: doc._id };
            const update = { $set: { 'description.pt': completions[1].message.content, 'description.fr': completions[2].message.content, 'description.en': completions[0].message.content } };
            const options = { upsert: true };

            await Publication.updateOne(filter, update, options);

            const titleCompletions = [];

            for (let i = 0; i < languages.length; i++) {
                const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: `You will translate the text in whatever original language it is to ${languages[i]}. If the text you receive is already in the requested translation language, simply return it to the user with no change.` },
                    { role: "user", content: doc.title.original }
                ],
                model: "gpt-4-1106-preview",
                });

                titleCompletions.push(completion.choices[0]);
            }

            const titleFilter = { _id: doc._id };
            const titleUpdate = { $set: { 'title.pt': titleCompletions[1].message.content, 'title.fr': titleCompletions[2].message.content, 'title.en': titleCompletions[0].message.content } };
            const titleOptions = { upsert: true };

            await Publication.updateOne(titleFilter, titleUpdate, titleOptions);
        }
    }
});

const Publication = mongoose.model('Publication', publicationSchema);
module.exports = Publication;