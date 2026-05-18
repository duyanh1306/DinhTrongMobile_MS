const express = require("express");
const router = express.length ? express.Router() : require('express').Router();
const { getAllCriteria, createCriteria, updateCriteria, deleteCriteria } = require("../controllers/evaluationCriteriaController");

router.get("/", getAllCriteria);
router.post("/", createCriteria);
router.put("/:id", updateCriteria);
router.delete("/:id", deleteCriteria);

module.exports = router;