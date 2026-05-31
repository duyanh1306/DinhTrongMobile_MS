// routes/evaluationConditionRoute.js
const express = require('express');
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const { 
    getAllConditions, 
    createCondition, 
    updateCondition, 
    deleteCondition 
} = require('../controllers/evaluationConditionController');

router.get('/', getAllConditions);
router.post('/', authInternal, createCondition);
router.put('/:id', authInternal, updateCondition);
router.delete('/:id', authInternal, deleteCondition);

module.exports = router;