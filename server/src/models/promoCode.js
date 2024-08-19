const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const promoSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    maxUses: {
        type: Number,
        required: true
    },
    currentUses: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountPercentage: {
        type: Number
    },
    discountPrice: {
        type: Number
    },
    applicableCategories: {
        type: [String], // Array of strings
        default: [] // Default to an empty array
    }
});

module.exports = mongoose.model('Promo', promoSchema);
