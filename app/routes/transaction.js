var express = require('express');
var router = express.Router();
const Transaction = require("../models/Transaction")
const withAuth = require("../middlewares/auth");

// Rota para obter categorias
router.get("/categories/:type", withAuth, (req, res) => {
  const type = req.params.type;

  const categories = {
    income: ["Salário", "Freelance", "Investimento"],
    expense: [
      "Mercado", 
      "Transporte", 
      "Aluguel", 
      "Educação", 
      "Lazer", 
      "Saúde", 
      "Restaurante", 
      "Compras", 
      "Viagem", 
      "Serviços"
    ]
  };

  if (categories[type]) {
    res.status(200).json(categories[type]);
  } else {
    res.status(400).json({ error: "Invalid transaction type" });
  }
});


// Create
router.post("/", withAuth, async (req, res) => { 
  const { type, amount, category, date, description } = req.body
  try {
    let transaction = new Transaction({type: type, amount: amount, category: category, date: date,  description: description, author: req.user._id })
    await transaction.save()
    res.status(200).json(transaction)
  } catch (error) {
    res.status(500).json({error: "Problem to create a new transaction"})
  }
})

//Procurar transação
router.get("/search", withAuth, async (req, res)=> { 
  const {query} = req.query
  try{
    let transactions = await Transaction.find({author: req.user._id}).find({
      $text: {$search: query}
    });
    res.json(transactions)
  }catch(error){
    res.json({error: error}).status(500)
  }
})

// Atualizar uma transação
router.put("/:id", withAuth, async (req, res) => {
  const { type, amount, category, date, description } = req.body;
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      { type, amount, category, date, description },
      { new: true }
    );
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Problem to update transaction" });
  }
});

/*
router.put('/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if(!transaction){
      return res.status(403).json({message:'Transaction not found'})
    }
    if(!isOwner(req.user,transaction)) { 
      return res.status(403).json({message: 'Unauthorized'})
    }
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});*/

//list
router.get("/", withAuth, async (req, res) => {
  try {
    let transaction = await Transaction.find({ author: req.user._id });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Total de ganhos
router.get("/income/total", withAuth, async (req, res) => {
  try {
    const totalIncome = await Transaction.aggregate([
      { $match: { author: req.user._id, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    res.status(200).json(totalIncome[0].total);
  } catch (error) {
    res.status(500).json({ error: "Problem to get total income" });
  }
});

// Total de gastos 
router.get("/expense/total", withAuth, async (req, res) => {
  try {
    const totalExpense = await Transaction.aggregate([
      { $match: { author: req.user._id, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    res.status(200).json(totalExpense[0].total);
  } catch (error) {
    res.status(500).json({ error: "Problem to get total expense" });
  }
});

//Total Geral (ganhos e gastos)
router.get("/total", withAuth, async (req, res) => {
  try {
    const income = await Transaction.aggregate([
      { $match: { author: req.user._id, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const expense = await Transaction.aggregate([
      { $match: { author: req.user._id, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const total = (income[0]?.total || 0) - (expense[0]?.total || 0);
    res.status(200).json(total);
  } catch (error) {
    res.status(500).json({ error: "Problem to get total" });
  }
});



// Obter transações por categoria
router.get('/category/:category', withAuth, async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    const transactions = await Transaction.find({
      category: category,
      author: req.user._id
    });
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found for this category' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar transações por mês e ano
router.get('/:year/:month', withAuth, async (req, res) => {
  const { year, month } = req.params;

  // Validação de entrada
  if (!Number(year) || !Number(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }

  // Configuração das datas de início e fim do mês
  const startDate = new Date(Date.UTC(year, month - 1, 1));  // Primeiro dia do mês em UTC
  const endDate = new Date(Date.UTC(year, month, 1));        // Primeiro dia do próximo mês em UTC
  try {
    // Busca as transações para o mês especificado
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lt: endDate },
      author: req.user._id
    });

    // Responde com as transações encontradas
    res.status(200).json(transactions);
  } catch (error) {
    // Responde com erro em caso de falha
    res.status(500).json({ error: error.message });
  }
});


// Encontrar total de ganhos por ano e mês
router.get("/income/total/:year/:month", withAuth, async (req, res) => {
  const { year, month } = req.params;

  if (!Number(year) || !Number(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }


  const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
  const endDate = new Date(year, month, 1)


  try {
    const totalIncome = await Transaction.aggregate([
      { 
        $match: { author: req.user._id, type: "income", date: { $gte: startDate, $lt: endDate }} 
      },
      { 
        $group: { _id: null,  total: { $sum: "$amount" } 
        } 
      }
    ]);

    if (totalIncome.length > 0) {
      res.status(200).json(totalIncome[0].total);
    } else {
      res.status(200).json(0); // Se não houver transações, o total é 0
    }
  } catch (error) {
    res.status(500).json({ error: "Problem to get total income" });
  }
});

// Encontrar total de gastos por ano e mês
router.get("/expense/total/:year/:month", withAuth, async (req, res) => {
  const { year, month } = req.params;

  if (!Number(year) || !Number(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month' });
  }


  const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
  const endDate = new Date(year, month, 1)


  try {
    const totalExpense = await Transaction.aggregate([
      { 
        $match: { author: req.user._id, type: "expense",  date: { $gte: startDate, $lt: endDate } } 
      },
      { 
        $group: { _id: null, total: { $sum: "$amount" } } 
      }
    ]);
    if (totalExpense.length > 0) {
      res.status(200).json(totalExpense[0].total);
    } else {
      res.status(200).json(0); // Se não houver transações, o total é 0
    }
  } catch (error) {
    res.status(500).json({ error: "Problem to get total expense" });
  }
});



// Encontrar total geral por ano e mês
router.get("/total/:year/:month", withAuth, async (req, res) => {
  const { year, month } = req. params


  const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
  const endDate = new Date(year, month, 1)


  try {
    const income = await Transaction.aggregate([
      { 
        $match: { author: req.user._id, type: "income",  date: { $gte: startDate, $lt: endDate } } 
    },
      { 
        $group: { _id: null, total: { $sum: "$amount" } } 
      }
    ]);
    const expense = await Transaction.aggregate([
      { 
        $match: { author: req.user._id, type: "expense",  date: { $gte: startDate, $lt: endDate } } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const total = (income[0]?.total || 0) - (expense[0]?.total || 0);
    res.status(200).json(total);
  } catch (error) {
    res.status(500).json({ error: "Problem to get total" });
  }
});


router.get("/total", withAuth, async (req, res) => {

});


//---------------------------------------------------------------------------------------------------------------------------------------------------------// 
// Obter Total de gastos por categoria para grafico 
router.get('/category/total/:category', withAuth, async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const total = await Transaction.aggregate([
      { 
        $match: { 
          author: req.user._id, 
          category: category 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$amount" } 
        } 
      }
    ]);

    if (total.length > 0) {
      res.status(200).json(total[0].total);
    } else {
      res.status(200).json(0);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//getbyID
router.get('/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Transaction ID:", id); // Verifica o ID recebido
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json({ message: 'Transaction retrieved successfully', data: transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Edit
router.put('/:id', withAuth, async (req, res) => {
  const { type, amount, category, date, description } = req.body
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if(!transaction){
      	res.status(404).json({ message: 'Transaction not found' });
    }
    if(!isOwner(req.user, transaction)){
      return res.status(403).json({message: "Unauthorized"})
    }
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, { type, amount, category, date, description }, { new: true });
    res.status(200).json({ message: 'Transaction updated', transaction: updatedTransaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//Delete transação 
router.delete('/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if(!transaction){
      	res.status(404).json({ message: 'Transaction not found' });
    }
    if(!isOwner(req.user, transaction)){
      return res.status(403).json({message: "Unauthorized"})
    }
    await Transaction.findByIdAndDelete(id);
    res.status(204).json({message: 'Transaction deleted'})
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


const isOwner = (user, transaction) => {
  return JSON.stringify(user._id) === JSON.stringify(transaction.author._id);
};

module.exports = router;
