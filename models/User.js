const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const crypto = require('crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20
    },
    backgroundImage: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Image'
    },
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    surname: {
        type: String,
        required: false,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 50
    },
    language: {
        type: String,
        required: true,
        default: 'en'
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 400
    },
    preferredLocations: [{
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
    }],
    private: Boolean,
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
    savedPublications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publication',
        required: false
    }],
    connectedPublications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publication',
        required: false
    }],
    twoFactorAuthentication: Boolean,
    profilePicture: { 
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Image'
    },
    owns: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publication',
        required: this.accountType === 'provider' ? true : false
    }],
    locatedAt: [{
        latitude: {
            type: Number,
            required: this.accountType === 'provider' ? true : false,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: this.accountType === 'provider' ? true : false,
            min: -180,
            max: 180
        }
    }],
    bio: {
        type: String,
        // if account type is publisher, bio is required
        required: false,
        default: '',
        minlength: 10,
        maxlength: 500
    },
    accountType: {
        type: String,
        required: true,
        enum: ['provider', 'student']
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: false
    }]
    /*publicKey: {
        type: String,
        default: publicKey
    },
    privateKey: {
        type: String,
        default: privateKey
    },*/
});

userSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('password')) {
        const document = this;
        bcrypt.hash(document.password, saltRounds, function(err, hashedPassword) {
            if (err) {
                next(err);
            } else {
                document.password = hashedPassword;
                next();
            }
        });
    } else {
        next();
    }
});

userSchema.methods.isCorrectPassword = async function(password) {
    try {
        const same = await bcrypt.compare(password, this.password);
        return same;
    } catch (error) {
        throw error;
    }
};

// Export the model
const User = mongoose.model('User', userSchema);
module.exports = User;
