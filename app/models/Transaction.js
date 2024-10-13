const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    type: { type: String, required: true, enum: ["income", "expense"]},
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },
});

transactionSchema.index({ title: "text", body: "text" });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports  = Transaction 